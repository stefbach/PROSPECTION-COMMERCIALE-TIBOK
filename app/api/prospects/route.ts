// app/api/prospects/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Données mock de prospects pour test
const mockProspects = [
  {
    id: 1,
    nom: "Hôtel Grand Baie",
    secteur: "hotel",
    ville: "Grand Baie",
    district: "pamplemousses",
    statut: "qualifie",
    contact: "Jean Dupont",
    telephone: "+230 5789 1234",
    email: "contact@hotelgrandbaie.mu",
    score: 4,
    budget: "50000",
    adresse: "Rue Royale, Grand Baie",
    notes: "Intéressé par solution complète"
  },
  {
    id: 2,
    nom: "Pharmacie Centrale",
    secteur: "pharmacie",
    ville: "Port Louis",
    district: "port-louis",
    statut: "nouveau",
    contact: "Marie Martin",
    telephone: "+230 5234 5678",
    email: "pharmacie.centrale@gmail.com",
    score: 3,
    budget: "25000",
    adresse: "Rue Desforges, Port Louis",
    notes: "Premier contact établi"
  },
  {
    id: 3,
    nom: "Clinique Mauricienne",
    secteur: "clinique",
    ville: "Curepipe",
    district: "plaines-wilhems",
    statut: "proposition",
    contact: "Dr. Patel",
    telephone: "+230 5456 7890",
    email: "info@cliniquemauricienne.mu",
    score: 5,
    budget: "75000",
    adresse: "Avenue Paul et Virginie, Curepipe",
    notes: "Très intéressé, budget confirmé"
  },
  {
    id: 4,
    nom: "Restaurant Le Flamboyant",
    secteur: "restaurant",
    ville: "Flic en Flac",
    district: "riviere-noire",
    statut: "contacte",
    contact: "Pierre Lebon",
    telephone: "+230 5678 9012",
    email: "leflamboyant@resto.mu",
    score: 3,
    budget: "15000",
    adresse: "Coastal Road, Flic en Flac",
    notes: "A rappeler la semaine prochaine"
  },
  {
    id: 5,
    nom: "Supermarché Winner's",
    secteur: "supermarche",
    ville: "Mahébourg",
    district: "grand-port",
    statut: "qualifie",
    contact: "Sarah Chen",
    telephone: "+230 5890 1234",
    email: "admin@winners.mu",
    score: 4,
    budget: "35000",
    adresse: "Route Royale, Mahébourg",
    notes: "Demande de démonstration prévue"
  }
]

let prospects = [...mockProspects]
let nextId = 6

// GET - Récupérer les prospects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    
    let result = [...prospects]
    
    if (limit) {
      result = result.slice(0, parseInt(limit))
    }
    
    return NextResponse.json({
      data: result,
      success: true
    })
    
  } catch (error: any) {
    console.error('Erreur GET /api/prospects:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Créer un prospect
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newProspect = {
      id: nextId++,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    prospects.push(newProspect)
    
    return NextResponse.json({
      data: newProspect,
      success: true
    })
    
  } catch (error: any) {
    console.error('Erreur POST /api/prospects:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Modifier un prospect
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }
    
    const index = prospects.findIndex(p => p.id === body.id)
    if (index === -1) {
      return NextResponse.json({ error: 'Prospect non trouvé' }, { status: 404 })
    }
    
    const updates = { ...body }
    delete updates.id
    updates.updated_at = new Date().toISOString()
    
    prospects[index] = { ...prospects[index], ...updates }
    
    return NextResponse.json({
      data: prospects[index],
      success: true
    })
    
  } catch (error: any) {
    console.error('Erreur PATCH /api/prospects:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Supprimer un prospect
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }
    
    const index = prospects.findIndex(p => p.id === parseInt(id))
    
    if (index === -1) {
      return NextResponse.json({ error: 'Prospect non trouvé' }, { status: 404 })
    }
    
    prospects.splice(index, 1)
    
    return NextResponse.json({
      message: 'Prospect supprimé avec succès',
      success: true
    })
    
  } catch (error: any) {
    console.error('Erreur DELETE /api/prospects:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
