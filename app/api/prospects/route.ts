// app/api/prospects/route.ts
// API avec EXACTEMENT 4070 prospects mauriciens

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

// Configuration Maurice
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
  
  companyNames: [
    // Hôtels réels de Maurice
    'Hotel Beachcomber', 'Hotel Constance', 'Hotel Heritage', 'Hotel Veranda',
    'Hotel Attitude', 'Hotel LUX', 'Hotel Oberoi', 'Hotel Four Seasons',
    'Hotel St. Regis', 'Hotel Shangri-La', 'Hotel Hilton', 'Hotel InterContinental',
    
    // Restaurants
    'Restaurant Le Château', 'Restaurant La Table du Château', 'Restaurant Escale Créole',
    'Restaurant Le Pescatore', 'Restaurant La Clef des Champs', 'Restaurant Chez Tino',
    
    // Cliniques et santé
    'Clinique Darné', 'Clinique du Nord', 'Clinique Ferrière', 'Clinique Muller',
    'Centre Médical', 'Cabinet Médical', 'Wellness Center', 'Spa Paradise',
    
    // Commerces
    'Super U', 'Winners', 'Jumbo', 'Intermart', 'Dream Price', 'La Croisette',
    'Shoprite', 'Pick n Pay', 'Spar', 'London Way', 'Galaxy', 'Carrefour'
  ],
  
  contactNames: [
    'Kumar Patel', 'Marie Duval', 'Jean-Pierre Martin', 'Anita Ramgoolam',
    'David Chen', 'Sophie Laurent', 'Raj Sharma', 'Michelle Dupont',
    'Kevin Li', 'Priya Naidoo', 'François Bernard', 'Lisa Wong',
    'Ahmed Hassan', 'Claire Rousseau', 'Vikash Dookun', 'Nathalie Lebreton'
  ]
}

// Variable globale pour stocker les prospects
declare global {
  var mauritiusProspects: Prospect[] | undefined
  var lastGeneratedId: number | undefined
}

// Générateur de prospects avec nombre exact
function generateMauritianProspects(count: number = 4070): Prospect[] {
  console.log(`🏗️ Génération de ${count} prospects mauriciens...`)
  const prospects: Prospect[] = []
  
  for (let i = 1; i <= count; i++) {
    // Sélection aléatoire du district
    const districtKeys = Object.keys(MAURITIUS_DATA.districts) as District[]
    const district = districtKeys[Math.floor(Math.random() * districtKeys.length)]
    
    // Sélection aléatoire de la ville dans le district
    const cities = MAURITIUS_DATA.districts[district]
    const ville = cities[Math.floor(Math.random() * cities.length)]
    
    // Sélection du secteur avec distribution réaliste
    const secteurs: Secteur[] = ['hotel', 'restaurant', 'retail', 'clinique', 'pharmacie', 
                                  'wellness', 'spa', 'tourisme', 'immobilier', 'autre']
    const secteur = secteurs[Math.floor(Math.random() * secteurs.length)]
    
    // Statut avec distribution réaliste
    const statutRandom = Math.random()
    let statut: Statut
    if (statutRandom < 0.35) statut = 'nouveau'
    else if (statutRandom < 0.60) statut = 'contacte'
    else if (statutRandom < 0.80) statut = 'qualifie'
    else if (statutRandom < 0.90) statut = 'en-negociation'
    else if (statutRandom < 0.95) statut = 'signe'
    else statut = 'perdu'
    
    // Nom de l'entreprise
    const companyName = MAURITIUS_DATA.companyNames[i % MAURITIUS_DATA.companyNames.length] + ' ' + 
                       (Math.floor(i / MAURITIUS_DATA.companyNames.length) + 1)
    
    // Contact
    const contact = MAURITIUS_DATA.contactNames[Math.floor(Math.random() * MAURITIUS_DATA.contactNames.length)]
    
    // Score et qualité
    const score = (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5
    const quality_score = Math.floor(Math.random() * 40) + 60 // 60-100
    
    // Priorité
    const priorityRandom = Math.random()
    const priority = priorityRandom > 0.8 ? 'Haute' : 
                    priorityRandom > 0.5 ? 'Moyenne' : 'Basse'
    
    // Budget
    const budgets = ['Rs 50k', 'Rs 100k', 'Rs 250k', 'Rs 500k', 'Rs 1M', 'Rs 2M+', 'Rs 5M+']
    const budget = Math.random() > 0.3 ? budgets[Math.floor(Math.random() * budgets.length)] : undefined
    
    // Création du prospect
    prospects.push({
      id: i,
      nom: companyName,
      email: `contact${i}@${companyName.toLowerCase().replace(/\s/g, '').substring(0, 10)}.mu`,
      telephone: `+230 5${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
      adresse: `${Math.floor(Math.random() * 999) + 1} ${Math.random() > 0.5 ? 'Royal Road' : 'Coastal Road'}`,
      ville: ville,
      district: district,
      secteur: secteur,
      statut: statut,
      contact: contact,
      budget: budget,
      notes: Math.random() > 0.5 ? 
        `${secteur === 'hotel' ? 'Établissement hôtelier de référence.' : 
          secteur === 'restaurant' ? 'Restaurant avec forte clientèle touristique.' :
          secteur === 'clinique' ? 'Clinique privée, besoin de modernisation.' :
          secteur === 'retail' ? 'Commerce de détail bien établi.' :
          'Prospect à fort potentiel.'} ${
          statut === 'nouveau' ? 'Premier contact à établir.' :
          statut === 'qualifie' ? 'Intérêt confirmé pour nos services.' :
          statut === 'en-negociation' ? 'Négociation en cours.' :
          ''}` : undefined,
      website: Math.random() > 0.4 ? 
        `https://www.${companyName.toLowerCase().replace(/\s/g, '').substring(0, 20)}.mu` : 
        undefined,
      score: score,
      priority: priority as 'Haute' | 'Moyenne' | 'Basse',
      quality_score: quality_score,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  global.lastGeneratedId = count
  console.log(`✅ ${prospects.length} prospects générés avec succès`)
  return prospects
}

// Fonction pour obtenir les prospects (initialise si nécessaire)
function getProspects(): Prospect[] {
  if (!global.mauritiusProspects || global.mauritiusProspects.length === 0) {
    console.log('🚀 Initialisation de la base de données...')
    global.mauritiusProspects = generateMauritianProspects(4070) // EXACTEMENT 4070
    console.log(`✅ Base initialisée avec ${global.mauritiusProspects.length} prospects`)
  }
  return global.mauritiusProspects
}

// GET - Récupérer les prospects avec pagination et filtres
export async function GET(request: NextRequest) {
  try {
    const prospects = getProspects()
    const { searchParams } = new URL(request.url)
    
    // Récupération des paramètres
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const secteur = searchParams.get('secteur')
    const district = searchParams.get('district')
    const statut = searchParams.get('statut')
    const search = searchParams.get('q')
    
    console.log(`📋 GET /prospects - Page: ${page}, Limit: ${limit}, Total en base: ${prospects.length}`)
    
    // Filtrage
    let filtered = [...prospects]
    
    if (secteur && secteur !== '') {
      filtered = filtered.filter(p => p.secteur === secteur)
      console.log(`  Filtre secteur: ${secteur} → ${filtered.length} résultats`)
    }
    
    if (district && district !== '') {
      filtered = filtered.filter(p => p.district === district)
      console.log(`  Filtre district: ${district} → ${filtered.length} résultats`)
    }
    
    if (statut && statut !== '') {
      filtered = filtered.filter(p => p.statut === statut)
      console.log(`  Filtre statut: ${statut} → ${filtered.length} résultats`)
    }
    
    if (search && search !== '') {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(p => 
        p.nom.toLowerCase().includes(searchLower) ||
        p.ville.toLowerCase().includes(searchLower) ||
        (p.contact && p.contact.toLowerCase().includes(searchLower)) ||
        p.email.toLowerCase().includes(searchLower)
      )
      console.log(`  Recherche: "${search}" → ${filtered.length} résultats`)
    }
    
    // Calcul de la pagination
    const total = filtered.length
    const totalPages = Math.ceil(total / limit)
    const validPage = Math.min(page, totalPages || 1)
    const offset = (validPage - 1) * limit
    const paginatedData = filtered.slice(offset, offset + limit)
    
    console.log(`📊 Résultat final: ${paginatedData.length} prospects retournés (page ${validPage}/${totalPages}, total filtré: ${total})`)
    
    // Retour avec métadonnées
    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page: validPage,
        limit: limit,
        total: total,
        totalPages: totalPages,
        hasMore: validPage < totalPages,
        returned: paginatedData.length
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur GET /api/prospects:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des prospects', details: error },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau prospect
export async function POST(request: NextRequest) {
  try {
    const prospects = getProspects()
    const body = await request.json()
    
    console.log('📝 POST /prospects - Nouveau prospect')
    
    // Validation
    if (!body.nom || !body.email || !body.telephone) {
      return NextResponse.json(
        { error: 'Données requises manquantes: nom, email, telephone' },
        { status: 400 }
      )
    }
    
    // Génération de l'ID
    const newId = Math.max(...prospects.map(p => p.id), global.lastGeneratedId || 4070) + 1
    global.lastGeneratedId = newId
    
    // Création du prospect
    const newProspect: Prospect = {
      id: newId,
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
      priority: body.priority || 'Moyenne',
      quality_score: body.quality_score,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Ajout en début de liste
    prospects.unshift(newProspect)
    
    console.log(`✅ Prospect créé: ${newProspect.nom} (ID: ${newProspect.id})`)
    console.log(`📊 Total prospects: ${prospects.length}`)
    
    return NextResponse.json(newProspect, { status: 201 })
    
  } catch (error) {
    console.error('❌ Erreur POST /api/prospects:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du prospect' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un prospect (à créer dans [id]/route.ts)
// DELETE - Supprimer un prospect (à créer dans [id]/route.ts)
