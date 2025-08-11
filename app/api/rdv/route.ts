// app/api/rdv/route.ts
// CE FICHIER NE CONTIENT QUE DES ENDPOINTS API - PAS DE JSX/REACT !

import { NextRequest, NextResponse } from 'next/server'

// Interface temporaire en attendant la base de données
interface RDV {
  id: number
  prospect_id: number
  prospect_nom?: string
  commercial: string
  titre: string
  date_time: string
  duree_min: number
  type_visite: 'decouverte' | 'presentation' | 'negociation' | 'signature' | 'suivi'
  priorite: 'normale' | 'haute' | 'urgente'
  statut: 'planifie' | 'confirme' | 'en-cours' | 'termine' | 'annule' | 'reporte'
  notes?: string
  lieu?: string
  created_at: string
  updated_at: string
}

// Stockage temporaire en mémoire (sera remplacé par la vraie DB)
let rdvs: RDV[] = []
let nextId = 1

// Initialiser avec quelques données de test
if (rdvs.length === 0) {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  rdvs = [
    {
      id: nextId++,
      prospect_id: 1,
      prospect_nom: "Hôtel Mauricia",
      commercial: "Karine MOMUS",
      titre: "RDV - Présentation solution",
      date_time: tomorrow.toISOString(),
      duree_min: 60,
      type_visite: 'presentation',
      priorite: 'haute',
      statut: 'confirme',
      notes: "Présentation de la solution complète",
      lieu: "Grand Baie",
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    }
  ]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prospect_id = searchParams.get('prospect_id')
    
    let filtered = rdvs
    if (prospect_id) {
      filtered = rdvs.filter(r => r.prospect_id === parseInt(prospect_id))
    }
    
    return NextResponse.json(filtered)
  } catch (error) {
    console.error('Erreur GET /api/rdv:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des RDV' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données requises
    if (!body.prospect_id || !body.date_time) {
      return NextResponse.json(
        { error: 'prospect_id et date_time sont requis' },
        { status: 400 }
      )
    }
    
    const newRdv: RDV = {
      id: nextId++,
      prospect_id: body.prospect_id,
      prospect_nom: body.prospect_nom || '',
      commercial: body.commercial || 'Commercial',
      titre: body.titre || 'RDV',
      date_time: body.date_time,
      duree_min: body.duree_min || 60,
      type_visite: body.type_visite || 'decouverte',
      priorite: body.priorite || 'normale',
      statut: body.statut || 'planifie',
      notes: body.notes || '',
      lieu: body.lieu || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    rdvs.push(newRdv)
    
    return NextResponse.json(newRdv, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/rdv:', error)
    return NextResponse.json({ error: 'Erreur lors de la création du RDV' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID du RDV requis' },
        { status: 400 }
      )
    }
    
    const index = rdvs.findIndex(r => r.id === body.id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'RDV non trouvé' },
        { status: 404 }
      )
    }
    
    rdvs[index] = {
      ...rdvs[index],
      ...body,
      id: rdvs[index].id, // Garder l'ID original
      updated_at: new Date().toISOString()
    }
    
    return NextResponse.json(rdvs[index])
  } catch (error) {
    console.error('Erreur PATCH /api/rdv:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du RDV' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du RDV requis' },
        { status: 400 }
      )
    }
    
    const index = rdvs.findIndex(r => r.id === parseInt(id))
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'RDV non trouvé' },
        { status: 404 }
      )
    }
    
    rdvs.splice(index, 1)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur DELETE /api/rdv:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression du RDV' }, { status: 500 })
  }
}
