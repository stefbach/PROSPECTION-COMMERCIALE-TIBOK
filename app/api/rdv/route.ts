// app/api/rdv/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { rdvDB } from '../../../lib/rdv-database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prospect_id = searchParams.get('prospect_id')
    
    // Si un prospect_id est fourni, retourner uniquement les RDV de ce prospect
    if (prospect_id) {
      const rdvs = rdvDB.getRDVs(parseInt(prospect_id))
      return NextResponse.json(rdvs)
    }
    
    // Sinon retourner tous les RDV
    const allRdvs = rdvDB.getRDVs()
    return NextResponse.json(allRdvs)
  } catch (error) {
    console.error('Erreur GET /api/rdv:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données requises
    if (!body.prospect_id || !body.date_time || !body.commercial) {
      return NextResponse.json(
        { error: 'prospect_id, date_time et commercial sont requis' },
        { status: 400 }
      )
    }
    
    const newRDV = rdvDB.createRDV({
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
    
    return NextResponse.json(newRDV, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/rdv:', error)
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
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
    
    const updated = rdvDB.updateRDV(body.id, body)
    
    if (!updated) {
      return NextResponse.json(
        { error: 'RDV non trouvé' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur PATCH /api/rdv:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
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
    
    const success = rdvDB.deleteRDV(parseInt(id))
    
    if (!success) {
      return NextResponse.json(
        { error: 'RDV non trouvé' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur DELETE /api/rdv:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
