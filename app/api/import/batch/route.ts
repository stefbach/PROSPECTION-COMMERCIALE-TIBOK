import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma' // ou votre ORM
import { MAURITIUS_CONFIG } from '@/lib/mauritius-config'

// Types
interface ImportOptions {
  skipDuplicates: boolean
  updateExisting: boolean
  autoDetectSector: boolean
  autoDetectDistrict: boolean
  defaultSector: string
  defaultDistrict: string
}

interface ImportResult {
  success: boolean
  imported: number
  updated: number
  skipped: number
  errors: string[]
  duplicates: string[]
  details: any[]
}

// Fonction principale d'import
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, options }: { data: any[], options: ImportOptions } = body
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée à importer' },
        { status: 400 }
      )
    }
    
    // Résultats
    const result: ImportResult = {
      success: false,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      duplicates: [],
      details: []
    }
    
    // Traiter chaque ligne
    for (const item of data) {
      try {
        // Valider les données
        const validated = await validateProspect(item, options)
        
        if (!validated.isValid) {
          result.errors.push(`Ligne ${item.nom}: ${validated.error}`)
          result.skipped++
          continue
        }
        
        // Vérifier les doublons
        const existing = await checkDuplicate(validated.data)
        
        if (existing) {
          result.duplicates.push(item.nom)
          
          if (options.skipDuplicates) {
            result.skipped++
            continue
          }
          
          if (options.updateExisting) {
            // Mettre à jour l'existant
            await updateProspect(existing.id, validated.data)
            result.updated++
          } else {
            result.skipped++
          }
        } else {
          // Créer nouveau prospect
          await createProspect(validated.data)
          result.imported++
        }
        
      } catch (error: any) {
        result.errors.push(`Erreur ligne ${item.nom}: ${error.message}`)
        result.skipped++
      }
    }
    
    result.success = true
    
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error('Erreur import batch:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'import', details: error.message },
      { status: 500 }
    )
  }
}

// Fonction de validation
async function validateProspect(data: any, options: ImportOptions) {
  const errors: string[] = []
  
  // Nettoyer et valider les données
  const cleaned: any = {
    nom: data.nom?.trim() || '',
    secteur: data.secteur || options.defaultSector,
    ville: data.ville?.trim() || '',
    district: data.district || options.defaultDistrict,
    statut: data.statut || 'nouveau',
    contact: data.contact?.trim() || 'Direction',
    telephone: formatPhone(data.telephone),
    email: data.email?.toLowerCase().trim() || '',
    score: parseInt(data.score) || 3,
    budget: data.budget || 'À définir',
    notes: data.notes || `Import du ${new Date().toLocaleDateString('fr-FR')}`,
    adresse: data.adresse?.trim() || '',
    website: data.website?.trim() || ''
  }
  
  // Validations obligatoires
  if (!cleaned.nom) {
    errors.push('Nom obligatoire')
  }
  
  if (!cleaned.ville && !cleaned.district) {
    errors.push('Ville ou district obligatoire')
  }
  
  // Valider le secteur
  if (!MAURITIUS_CONFIG.secteurs[cleaned.secteur]) {
    if (options.autoDetectSector) {
      cleaned.secteur = detectSecteur(data)
    } else {
      cleaned.secteur = options.defaultSector
    }
  }
  
  // Valider le district
  if (!MAURITIUS_CONFIG.districts[cleaned.district]) {
    if (options.autoDetectDistrict) {
      cleaned.district = detectDistrict(data)
    } else {
      cleaned.district = options.defaultDistrict
    }
  }
  
  // Valider l'email
  if (cleaned.email && !isValidEmail(cleaned.email)) {
    errors.push('Email invalide')
    cleaned.email = ''
  }
  
  // Valider le téléphone
  if (cleaned.telephone && !isValidPhone(cleaned.telephone)) {
    errors.push('Téléphone invalide')
  }
  
  // Valider le score
  if (cleaned.score < 1 || cleaned.score > 5) {
    cleaned.score = 3
  }
  
  return {
    isValid: errors.length === 0,
    error: errors.join(', '),
    data: cleaned
  }
}

// Vérifier les doublons
async function checkDuplicate(data: any) {
  // Version avec Prisma
  /*
  return await prisma.prospect.findFirst({
    where: {
      OR: [
        { nom: data.nom },
        { email: data.email ? data.email : undefined },
        { telephone: data.telephone ? data.telephone : undefined }
      ]
    }
  })
  */
  
  // Version simulée
  // À remplacer par votre logique de base de données
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/prospects?` + 
    new URLSearchParams({
      nom: data.nom,
      email: data.email,
      telephone: data.telephone
    })
  )
  
  if (response.ok) {
    const prospects = await response.json()
    return prospects.length > 0 ? prospects[0] : null
  }
  
  return null
}

// Créer un prospect
async function createProspect(data: any) {
  // Version avec Prisma
  /*
  return await prisma.prospect.create({
    data: {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })
  */
  
  // Version avec API
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/prospects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Erreur création prospect')
  }
  
  return await response.json()
}

// Mettre à jour un prospect
async function updateProspect(id: number, data: any) {
  // Version avec Prisma
  /*
  return await prisma.prospect.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
    }
  })
  */
  
  // Version avec API
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/prospects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Erreur mise à jour prospect')
  }
  
  return await response.json()
}

// Fonctions utilitaires
function formatPhone(phone: string | undefined): string {
  if (!phone) return ''
  
  const cleaned = phone.toString().replace(/\D/g, '')
  
  // Format Maurice
  if (cleaned.length === 7 || cleaned.length === 8) {
    return `+230 ${cleaned}`
  }
  
  if (cleaned.startsWith('230')) {
    return `+${cleaned}`
  }
  
  return cleaned
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 7 && cleaned.length <= 15
}

function detectSecteur(data: any): string {
  const text = JSON.stringify(data).toLowerCase()
  
  const sectorMappings: Record<string, string[]> = {
    'hotel': ['hotel', 'resort', 'villa', 'guest', 'lodge'],
    'restaurant': ['restaurant', 'resto', 'café', 'cafe', 'snack', 'bar'],
    'pharmacie': ['pharmac', 'drug', 'medicament'],
    'clinique': ['clinic', 'medical', 'health', 'sante', 'hopital', 'hospital'],
    'assurance': ['assurance', 'insurance', 'assur'],
    'banque': ['bank', 'banque', 'finance', 'credit'],
    'immobilier': ['immobil', 'real estate', 'property', 'promoteur'],
    'retail': ['shop', 'boutique', 'magasin', 'supermarché', 'store'],
    'education': ['school', 'école', 'college', 'university', 'formation'],
    'transport': ['transport', 'logistic', 'cargo', 'shipping'],
    'technologie': ['tech', 'software', 'digital', 'web', 'it']
  }
  
  for (const [sector, keywords] of Object.entries(sectorMappings)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return sector
    }
  }
  
  return 'autre'
}

function detectDistrict(data: any): string {
  const text = JSON.stringify(data).toLowerCase()
  
  const districtMappings: Record<string, string[]> = {
    'port-louis': ['port louis', 'caudan', 'chinatown'],
    'pamplemousses': ['pamplemousses', 'terre rouge', 'arsenal'],
    'riviere-du-rempart': ['grand baie', 'pereybere', 'cap malheureux', 'calodyne'],
    'flacq': ['flacq', 'belle mare', 'trou d\'eau douce', 'quatre cocos'],
    'grand-port': ['mahebourg', 'blue bay', 'plaine magnien', 'rose belle'],
    'savanne': ['souillac', 'surinam', 'chemin grenier', 'bel ombre'],
    'plaines-wilhems': ['curepipe', 'quatre bornes', 'vacoas', 'phoenix', 'rose hill'],
    'moka': ['moka', 'quartier militaire', 'saint pierre'],
    'black-river': ['flic en flac', 'tamarin', 'black river', 'le morne']
  }
  
  for (const [district, keywords] of Object.entries(districtMappings)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return district
    }
  }
  
  return 'port-louis'
}

// GET - Obtenir le statut de l'import
export async function GET(request: NextRequest) {
  // Peut être utilisé pour suivre le progrès d'un import
  return NextResponse.json({
    status: 'ready',
    maxBatchSize: 1000,
    supportedFormats: ['csv', 'xlsx', 'xls', 'json']
  })
}
