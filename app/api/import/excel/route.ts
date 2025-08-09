// app/api/import/excel/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

// Mapping des codes postaux vers les régions
const POSTAL_TO_REGION: Record<string, string> = {
  '11': 'port-louis',
  '20': 'grand-port', '21': 'pamplemousses',
  '30': 'flacq', '31': 'flacq', '40': 'flacq', '41': 'flacq', '42': 'riviere-du-rempart',
  '50': 'moka', '51': 'moka', '52': 'plaines-wilhems',
  '60': 'savanne', '61': 'savanne',
  '70': 'plaines-wilhems', '71': 'plaines-wilhems', '72': 'plaines-wilhems',
  '73': 'plaines-wilhems', '74': 'plaines-wilhems',
  '80': 'moka', '81': 'moka',
  '90': 'riviere-noire', '91': 'riviere-noire'
}

// Mapping des villes/zones vers les régions
const LOCATION_KEYWORDS: Record<string, string> = {
  'belle mare': 'flacq', 'poste de flacq': 'flacq', 'trou d\'eau douce': 'flacq',
  'grand baie': 'riviere-du-rempart', 'pereybere': 'riviere-du-rempart', 'cap malheureux': 'riviere-du-rempart',
  'flic en flac': 'riviere-noire', 'tamarin': 'riviere-noire', 'le morne': 'riviere-noire', 'la preneuse': 'riviere-noire',
  'port louis': 'port-louis', 'caudan': 'port-louis',
  'curepipe': 'plaines-wilhems', 'quatre bornes': 'plaines-wilhems', 'vacoas': 'plaines-wilhems', 'phoenix': 'plaines-wilhems',
  'mahebourg': 'grand-port', 'blue bay': 'grand-port',
  'moka': 'moka', 'saint pierre': 'moka',
  'grand gaube': 'riviere-du-rempart', 'goodlands': 'riviere-du-rempart',
  'bel ombre': 'savanne', 'souillac': 'savanne'
}

type ImportRow = {
  'Nom commercial'?: string
  'Adresse'?: string
  'Téléphone'?: number | string
  'Email'?: string
  'Code postal'?: number | string
  'Personne de contact'?: string
}

function detectRegion(row: ImportRow): string {
  // 1. Essayer par code postal
  if (row['Code postal']) {
    const prefix = String(row['Code postal']).substring(0, 2)
    if (POSTAL_TO_REGION[prefix]) {
      return POSTAL_TO_REGION[prefix]
    }
  }
  
  // 2. Essayer par adresse
  if (row['Adresse']) {
    const address = row['Adresse'].toLowerCase()
    for (const [keyword, region] of Object.entries(LOCATION_KEYWORDS)) {
      if (address.includes(keyword)) {
        return region
      }
    }
  }
  
  // 3. Par défaut
  return 'autre'
}

function detectVille(row: ImportRow): string {
  if (row['Adresse']) {
    const address = row['Adresse'].toLowerCase()
    
    // Extraire la ville des patterns communs
    for (const ville of Object.keys(LOCATION_KEYWORDS)) {
      if (address.includes(ville)) {
        // Capitaliser correctement
        return ville.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }
    }
    
    // Essayer d'extraire après la dernière virgule
    const parts = row['Adresse'].split(',')
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1].trim()
      // Retirer le code postal si présent
      return lastPart.replace(/\d{5}/, '').trim() || 'Non spécifié'
    }
  }
  
  return 'Non spécifié'
}

function calculateScore(row: ImportRow): number {
  let score = 2 // Score de base
  
  // +1 si email présent
  if (row['Email']) score++
  
  // +1 si téléphone présent
  if (row['Téléphone']) score++
  
  // +1 si personne de contact
  if (row['Personne de contact']) score++
  
  return Math.min(score, 5)
}

function formatTelephone(tel: number | string | undefined): string {
  if (!tel) return ''
  
  const telStr = String(tel).replace(/\D/g, '')
  
  // Format mauricien: +230 XXXX XXXX
  if (telStr.startsWith('230')) {
    return `+${telStr.substring(0, 3)} ${telStr.substring(3, 7)} ${telStr.substring(7)}`
  } else if (telStr.length === 8) {
    return `+230 ${telStr.substring(0, 4)} ${telStr.substring(4)}`
  } else if (telStr.length === 10 && telStr.startsWith('23')) {
    return `+230 ${telStr.substring(2, 6)} ${telStr.substring(6)}`
  }
  
  return telStr
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const dryRun = url.searchParams.get('dryRun') === 'true'
    const skipDuplicates = url.searchParams.get('skipDuplicates') !== 'false'
    
    const form = await req.formData()
    const file = form.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }
    
    // Lire le fichier Excel
    const buf = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buf, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<ImportRow>(ws, { defval: '' })
    
    const supabase = supabaseAdmin()
    
    // Préparer les données pour l'import
    const prospects = []
    const errors = []
    const warnings = []
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      
      // Vérifier le nom (obligatoire)
      if (!row['Nom commercial']) {
        errors.push(`Ligne ${i + 2}: Nom commercial manquant`)
        continue
      }
      
      const prospect = {
        nom: row['Nom commercial'].trim(),
        secteur: 'hotel' as const, // Tous sont des hôtels
        ville: detectVille(row),
        region: detectRegion(row),
        statut: 'nouveau' as const,
        contact: row['Personne de contact']?.trim() || '',
        telephone: formatTelephone(row['Téléphone']),
        email: row['Email']?.trim().toLowerCase() || '',
        score: calculateScore(row),
        budget: '',
        notes: `Import Excel ${new Date().toLocaleDateString('fr-FR')}`,
        adresse_complete: row['Adresse']?.trim() || '',
        
        // Champs additionnels
        nombre_employes: null,
        taille_structure: null,
        score_ia: null,
        potentiel_revenue_mur: null
      }
      
      // Avertissements pour données manquantes
      if (!prospect.email) {
        warnings.push(`${prospect.nom}: Email manquant`)
      }
      if (!prospect.telephone) {
        warnings.push(`${prospect.nom}: Téléphone manquant`)
      }
      if (prospect.region === 'autre') {
        warnings.push(`${prospect.nom}: Région non identifiée`)
      }
      
      prospects.push(prospect)
    }
    
    if (errors.length > 0 && !dryRun) {
      return NextResponse.json({
        success: false,
        errors,
        warnings,
        stats: {
          total: rows.length,
          valid: prospects.length,
          errors: errors.length
        }
      }, { status: 400 })
    }
    
    // Vérifier les doublons existants
    const { data: existing } = await supabase
      .from('prospects')
      .select('id, nom, ville')
      .eq('secteur', 'hotel')
    
    const existingMap = new Set(
      (existing || []).map(e => `${e.nom.toLowerCase()}|${e.ville.toLowerCase()}`)
    )
    
    const toInsert = []
    const duplicates = []
    
    for (const prospect of prospects) {
      const key = `${prospect.nom.toLowerCase()}|${prospect.ville.toLowerCase()}`
      
      if (existingMap.has(key)) {
        duplicates.push(prospect.nom)
        if (!skipDuplicates) {
          toInsert.push(prospect)
        }
      } else {
        toInsert.push(prospect)
      }
    }
    
    // Mode dry run : retourner l'analyse sans insérer
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        stats: {
          totalRows: rows.length,
          validProspects: prospects.length,
          willInsert: toInsert.length,
          duplicates: duplicates.length,
          errors: errors.length,
          warnings: warnings.length
        },
        preview: toInsert.slice(0, 5),
        duplicates: duplicates.slice(0, 10),
        warnings: warnings.slice(0, 10),
        errors,
        regionDistribution: prospects.reduce((acc, p) => {
          acc[p.region] = (acc[p.region] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      })
    }
    
    // Insertion réelle
    if (toInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('prospects')
        .insert(toInsert)
        .select()
      
      if (insertError) {
        throw insertError
      }
      
      // Géolocalisation asynchrone (ne pas bloquer la réponse)
      if (inserted && inserted.length > 0) {
        // Lancer la géolocalisation en arrière-plan
        geocodeProspects(inserted)
      }
      
      return NextResponse.json({
        success: true,
        stats: {
          inserted: inserted?.length || 0,
          duplicatesSkipped: duplicates.length,
          total: rows.length
        },
        warnings: warnings.slice(0, 20),
        message: `${inserted?.length || 0} hôtels importés avec succès`
      })
    }
    
    return NextResponse.json({
      success: true,
      stats: {
        inserted: 0,
        duplicatesSkipped: duplicates.length,
        total: rows.length
      },
      message: 'Aucun nouvel hôtel à importer'
    })
    
  } catch (error: any) {
    console.error('Erreur import Excel:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erreur lors de l\'import'
    }, { status: 500 })
  }
}

// Fonction de géolocalisation asynchrone
async function geocodeProspects(prospects: any[]) {
  const supabase = supabaseAdmin()
  
  for (const prospect of prospects) {
    if (prospect.adresse_complete) {
      try {
        // Utiliser une API de géocodage (OpenStreetMap Nominatim)
        const query = `${prospect.adresse_complete}, Mauritius`
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=mu`
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data.length > 0) {
            await supabase
              .from('prospects')
              .update({
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon)
              })
              .eq('id', prospect.id)
          }
        }
        
        // Attendre un peu entre les requêtes pour respecter les limites
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Erreur géocodage pour ${prospect.nom}:`, error)
      }
    }
  }
}
