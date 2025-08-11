// app/api/rdv/route.ts
// VERSION SIMPLE - API pour les RDV

import { NextRequest, NextResponse } from 'next/server'
import { rdvDB } from '../../../lib/rdv-database'

// GET - Récupérer les RDV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prospect_id = searchParams.get('prospect_id')
    
    // Si on demande les RDV d'un prospect spécifique
    if (prospect_id) {
      const rdvs = await rdvDB.getRDVs(parseInt(prospect_id))
      return NextResponse.json(rdvs)
    }
    
    // Sinon tous les RDV
    const allRdvs = await rdvDB.getRDVs()
    return NextResponse.json(allRdvs)
    
  } catch (error) {
    console.error('Erreur GET RDV:', error)
    return NextResponse.json([], { status: 500 })
  }
}

// POST - Créer un RDV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Vérifier les champs requis
    if (!body.prospect_id || !body.date_time || !body.commercial) {
      return NextResponse.json(
        { error: 'Champs manquants' },
        { status: 400 }
      )
    }
    
    const newRDV = await rdvDB.createRDV({
      prospect_id: body.prospect_id,
      prospect_nom: body.prospect_nom || '',
      commercial: body.commercial,
      titre: body.titre || 'Rendez-vous',
      date_time: body.date_time,
      duree_min: body.duree_min || 60,
      type_visite: body.type_visite || 'decouverte',
      priorite: body.priorite || 'normale',
      statut: body.statut || 'planifie',
      notes: body.notes || '',
      lieu: body.lieu || ''
    })
    
    return NextResponse.json(newRDV)
    
  } catch (error) {
    console.error('Erreur POST RDV:', error)
    return NextResponse.json(
      { error: 'Erreur création' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un RDV
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      )
    }
    
    const updated = await rdvDB.updateRDV(body.id, body)
    
    if (!updated) {
      return NextResponse.json(
        { error: 'RDV non trouvé' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(updated)
    
  } catch (error) {
    console.error('Erreur PATCH RDV:', error)
    return NextResponse.json(
      { error: 'Erreur mise à jour' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un RDV
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      )
    }
    
    const success = await rdvDB.deleteRDV(parseInt(id))
    
    if (!success) {
      return NextResponse.json(
        { error: 'RDV non trouvé' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Erreur DELETE RDV:', error)
    return NextResponse.json(
      { error: 'Erreur suppression' },
      { status: 500 }
    )
  }
}
