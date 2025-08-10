// app/api/prospects/route.ts
// API avec 4000+ prospects mauriciens

import { NextRequest, NextResponse } from 'next/server'

// Types pour Maurice
type District = 'port-louis' | 'pamplemousses' | 'riviere-du-rempart' | 'flacq' | 
                'grand-port' | 'savanne' | 'plaines-wilhems' | 'moka' | 'riviere-noire'

type Secteur = 'hotel' | 'restaurant' | 'retail' | 'clinique' | 'pharmacie' | 
               'wellness' | 'spa' | 'tourisme' | 'immobilier' | 'autre'

type Statut = 'nouveau' | 'contacte' | 'qualifie' | 'en-negociation' | 'signe' | 'perdu'

interface Prospect {
  id: number
  nom: string
  email: string
  telephone: string
  adresse?: string
  ville: string
  district: District
  secteur: Secteur
  statut: Statut
  contact?: string
  budget?: string
  notes?: string
  website?: string
  score: 1 | 2 | 3 | 4 | 5
  priority?: 'Haute' | 'Moyenne' | 'Basse'
  quality_score?: number
  created_at: string
  updated_at: string
}

// Configuration pour générer des données réalistes
const MAURITIUS_DATA = {
  districts: {
    'port-louis': ['Port Louis', 'Caudan', 'Chinatown', 'Plaine Verte'],
    'pamplemousses': ['Pamplemousses', 'Arsenal', 'Calebasses', 'Morcellement Saint André'],
    'riviere-du-rempart': ['Rivière du Rempart', 'Goodlands', 'Poudre dOr', 'Grand Gaube'],
    'flacq': ['Centre de Flacq', 'Poste de Flacq', 'Belle Mare', 'Trou dEau Douce'],
    'grand-port': ['Mahébourg', 'Rose Belle', 'Plaine Magnien', 'Blue Bay'],
    'savanne': ['Souillac', 'Surinam', 'Rivière des Anguilles', 'Baie du Cap'],
    'plaines-wilhems': ['Curepipe', 'Vacoas', 'Phoenix', 'Quatre Bornes', 'Rose Hill'],
    'moka': ['Moka', 'Quartier Militaire', 'Saint Pierre', 'Reduit'],
    'riviere-noire': ['Tamarin', 'Flic en Flac', 'Le Morne', 'La Gaulette']
  },
  
  companyPrefixes: [
    'Hotel', 'Restaurant', 'Boutique', 'Clinique', 'Pharmacie', 'Spa', 'Resort',
    'Villa', 'Guest House', 'Beach Resort', 'Medical Center', 'Wellness Center',
    'Super U', 'Winners', 'Jumbo', 'Intermart', 'Dream Price', 'La Croisette'
  ],
  
  companySuffixes: [
    'Paradise', 'Tropical', 'Island', 'Ocean View', 'Beach', 'Lagoon', 'Coral',
    'Blue Bay', 'Grand Baie', 'Belle Mare', 'Le Morne', 'Tamarin', 'Flic en Flac'
  ],
  
  contactNames: [
    'Kumar Patel', 'Marie Duval', 'Jean-Pierre Martin', 'Anita Ramgoolam',
    'David Chen', 'Sophie Laurent', 'Raj Sharma', 'Michelle Dupont',
    'Kevin Li', 'Priya Naidoo', 'François Bernard', 'Lisa Wong'
  ]
}

// Générateur de prospects mauriciens
function generateMauritianProspects(count: number = 4500): Prospect[] {
  const prospects: Prospect[] = []
  
  for (let i = 1; i <= count; i++) {
    const districtKey = Object.keys(MAURITIUS_DATA.districts)[
      Math.floor(Math.random() * Object.keys(MAURITIUS_DATA.districts).length)
    ] as District
    
    const cities = MAURITIUS_DATA.districts[districtKey]
    const city = cities[Math.floor(Math.random() * cities.length)]
    
    const secteurs: Secteur[] = ['hotel', 'restaurant', 'retail', 'clinique', 'pharmacie', 
                                  'wellness', 'spa', 'tourisme', 'immobilier', 'autre']
    const secteur = secteurs[Math.floor(Math.random() * secteurs.length)]
    
    const statuts: Statut[] = ['nouveau', 'contacte', 'qualifie', 'en-negociation', 'signe', 'perdu']
    // Biais vers les nouveaux et qualifiés
    const statutWeights = [0.35, 0.25, 0.20, 0.10, 0.05, 0.05]
    const randomStatut = Math.random()
    let statut: Statut = 'nouveau'
    let cumulativeWeight = 0
    for (let j = 0; j < statuts.length; j++) {
      cumulativeWeight += statutWeights[j]
      if (randomStatut <= cumulativeWeight) {
        statut = statuts[j]
        break
      }
    }
    
    const companyPrefix = MAURITIUS_DATA.companyPrefixes[
      Math.floor(Math.random() * MAURITIUS_DATA.companyPrefixes.length)
    ]
    const companySuffix = MAURITIUS_DATA.companySuffixes[
      Math.floor(Math.random() * MAURITIUS_DATA.companySuffixes.length)
    ]
    
    const contactName = MAURITIUS_DATA.contactNames[
      Math.floor(Math.random() * MAURITIUS_DATA.contactNames.length)
    ]
    
    const score = Math.floor(Math.random() * 5) + 1 as 1 | 2 | 3 | 4 | 5
    const quality_score = Math.floor(Math.random() * 40) + 60 // 60-100
    
    const priorities = ['Haute', 'Moyenne', 'Basse']
    const priority = Math.random() > 0.8 ? priorities[0] : 
                    Math.random() > 0.5 ? priorities[1] : priorities[2]
    
    const budgets = ['Rs 50k', 'Rs 100k', 'Rs 250k', 'Rs 500k', 'Rs 1M', 'Rs 2M+']
    const budget = Math.random() > 0.3 ? budgets[Math.floor(Math.random() * budgets.length)] : undefined
    
    prospects.push({
      id: i,
      nom: `${companyPrefix} ${companySuffix} ${i}`,
      email: `contact${i}@${companyPrefix.toLowerCase().replace(/\s/g, '')}.mu`,
      telephone: `+230 5${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
      adresse: `${Math.floor(Math.random() * 999) + 1} Royal Road`,
      ville: city,
      district: districtKey,
      secteur: secteur,
      statut: statut,
      contact: contactName,
      budget: budget,
      notes: Math.random() > 0.5 ? `Prospect intéressant. ${secteur === 'hotel' ? 'Établissement de prestige.' : 
                                    secteur === 'restaurant' ? 'Forte affluence touristique.' :
                                    secteur === 'clinique' ? 'Besoin urgent de modernisation.' :
                                    'À recontacter rapidement.'}` : undefined,
      website: Math.random() > 0.4 ? `https://www.${companyPrefix.toLowerCase().replace(/\s/g, '')}.mu` : undefined,
      score: score,
      priority: priority as 'Haute' | 'Moyenne' | 'Basse',
      quality_score: quality_score,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  return prospects
}

// Générer les données une seule fois au démarrage
let allProspects: Prospect[] = []

// Fonction pour initialiser les données
function initializeData() {
  if (allProspects.length === 0) {
    console.log('🚀 Génération de 4500 prospects mauriciens...')
    allProspects = generateMauritianProspects(4500)
    console.log('✅ Base de données initialisée avec', allProspects.length, 'prospects')
  }
}

// GET - Récupérer les prospects avec pagination et filtres
export async function GET(request: NextRequest) {
  try {
    // Initialiser les données si nécessaire
    initializeData()
    
    const { searchParams } = new URL(request.url)
    
    // Récupérer les paramètres
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const secteur = searchParams.get('secteur')
    const district = searchParams.get('district')
    const statut = searchParams.get('statut')
    const search = searchParams.get('q')
    const country = searchParams.get('country')
    
    console.log(`📋 GET /prospects - Page: ${page}, Limit: ${limit}, Total: ${allProspects.length}`)
    
    // Filtrer les prospects
    let filtered = [...allProspects]
    
    if (secteur) {
      filtered = filtered.filter(p => p.secteur === secteur)
    }
    
    if (district) {
      filtered = filtered.filter(p => p.district === district)
    }
    
    if (statut) {
      filtered = filtered.filter(p => p.statut === statut)
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(p => 
        p.nom.toLowerCase().includes(searchLower) ||
        p.ville.toLowerCase().includes(searchLower) ||
        (p.contact && p.contact.toLowerCase().includes(searchLower)) ||
        p.email.toLowerCase().includes(searchLower)
      )
    }
    
    // Calculer la pagination
    const total = filtered.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const paginatedData = filtered.slice(offset, offset + limit)
    
    console.log(`📊 Résultats: ${paginatedData.length} prospects (page ${page}/${totalPages}, total filtré: ${total})`)
    
    // Retourner avec les métadonnées de pagination
    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur GET /api/prospects:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des prospects' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau prospect
export async function POST(request: NextRequest) {
  try {
    initializeData()
    
    const body = await request.json()
    console.log('📝 POST /prospects - Données reçues:', body)
    
    // Validation
    if (!body.nom || !body.email || !body.telephone) {
      return NextResponse.json(
        { error: 'Données manquantes: nom, email et téléphone sont requis' },
        { status: 400 }
      )
    }
    
    // Créer le nouveau prospect
    const newProspect: Prospect = {
      id: allProspects.length + 1,
      nom: body.nom,
      email: body.email,
      telephone: body.telephone,
      adresse: body.adresse || '',
      ville: body.ville || 'Port Louis',
      district: body.district || 'port-louis',
      secteur: body.secteur || 'autre',
      statut: body.statut || 'nouveau',
      contact: body.contact,
      budget: body.budget,
      notes: body.notes,
      website: body.website,
      score: body.score || 3,
      priority: body.priority,
      quality_score: body.quality_score,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Ajouter à la liste
    allProspects.unshift(newProspect)
    
    console.log('✅ Prospect créé:', newProspect.nom)
    return NextResponse.json(newProspect, { status: 201 })
  } catch (error) {
    console.error('❌ Erreur POST /api/prospects:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du prospect' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un prospect (à implémenter dans [id]/route.ts)
// DELETE - Supprimer un prospect (à implémenter dans [id]/route.ts)
