// app/api/rdv/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Stockage temporaire en mémoire (remplacer par Supabase en production)
let rdvs: any[] = []
let nextId = 1

// GET - Récupérer les RDV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includePropositions = searchParams.get('include_propositions') === 'true'
    const prospectId = searchParams.get('prospect_id')
    const statut = searchParams.get('statut')
    
    let filtered = [...rdvs]
    
    // Filtrer par prospect_id si fourni
    if (prospectId) {
      filtered = filtered.filter(r => r.prospect_id === parseInt(prospectId))
    }
    
    // Filtrer par statut
    if (statut) {
      filtered = filtered.filter(r => r.statut === statut)
    } else if (!includePropositions) {
      // Par défaut, ne pas inclure les propositions
      filtered = filtered.filter(r => r.statut !== 'proposition')
    }
    
    // Trier par date
    filtered.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
    
    return NextResponse.json(filtered)
    
  } catch (error: any) {
    console.error('Erreur GET /api/rdv:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Créer un RDV ou une proposition
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Déterminer si c'est une proposition IA ou un RDV manuel
    const isProposition = body.source === 'ai' || body.statut === 'proposition'
    
    const newRdv = {
      id: nextId++,
      prospect_id: body.prospect_id,
      prospect_nom: body.prospect_nom || 'Prospect',
      commercial: body.commercial || 'Commercial',
      titre: body.titre || `${isProposition ? 'Proposition' : 'RDV'} - ${body.prospect_nom}`,
      date_time: body.date_time,
      duree_min: body.duree_min || 60,
      type_visite: body.type_visite || 'decouverte',
      priorite: body.priorite || 'normale',
      statut: isProposition ? 'proposition' : (body.statut || 'planifie'),
      notes: body.notes || (isProposition ? '🤖 Proposition IA à valider' : ''),
      lieu: body.lieu || '',
      ai_score: body.ai_score || null,
      ai_reason: body.ai_reason || null,
      proposed_at: isProposition ? new Date().toISOString() : null,
      validated_at: null,
      validated_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      prospect: body.prospect || null
    }
    
    rdvs.push(newRdv)
    
    return NextResponse.json(newRdv)
    
  } catch (error: any) {
    console.error('Erreur POST /api/rdv:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Modifier un RDV
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }
    
    const index = rdvs.findIndex(r => r.id === body.id)
    if (index === -1) {
      return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 })
    }
    
    // Créer l'objet de mise à jour
    const updates: any = { ...body }
    delete updates.id
    
    // Si on valide une proposition
    if (body.action === 'validate' || (body.statut === 'planifie' && rdvs[index].statut === 'proposition')) {
      updates.validated_at = new Date().toISOString()
      updates.validated_by = body.validated_by || body.commercial || 'Agent'
      if (!updates.notes) {
        updates.notes = rdvs[index].notes
      }
    }
    
    // Si on verrouille un RDV
    if (body.action === 'lock' || body.locked === true) {
      updates.locked = true
      updates.locked_at = new Date().toISOString()
      updates.locked_by = body.locked_by || body.commercial || 'Agent'
    }
    
    updates.updated_at = new Date().toISOString()
    
    // Mettre à jour le RDV
    rdvs[index] = { ...rdvs[index], ...updates }
    
    return NextResponse.json(rdvs[index])
    
  } catch (error: any) {
    console.error('Erreur PATCH /api/rdv:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Supprimer un RDV
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }
    
    const index = rdvs.findIndex(r => r.id === parseInt(id))
    
    if (index === -1) {
      return NextResponse.json({ error: 'RDV non trouvé' }, { status: 404 })
    }
    
    // Vérifier si le RDV est verrouillé
    if (rdvs[index].locked) {
      return NextResponse.json({ error: 'RDV verrouillé, suppression impossible' }, { status: 403 })
    }
    
    // Supprimer le RDV
    rdvs.splice(index, 1)
    
    return NextResponse.json({ message: 'RDV supprimé avec succès' })
    
  } catch (error: any) {
    console.error('Erreur DELETE /api/rdv:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Créer des propositions en masse
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { propositions } = body
    
    if (!Array.isArray(propositions)) {
      return NextResponse.json({ error: 'Format invalide: propositions doit être un tableau' }, { status: 400 })
    }
    
    const createdPropositions: any[] = []
    const errors: string[] = []
    
    // Créer toutes les propositions
    for (const prop of propositions) {
      try {
        const newProposition = {
          id: nextId++,
          ...prop,
          statut: 'proposition',
          source: 'ai',
          proposed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        rdvs.push(newProposition)
        createdPropositions.push(newProposition)
      } catch (error: any) {
        errors.push(`Erreur création proposition: ${error.message}`)
      }
    }
    
    return NextResponse.json({
      success: createdPropositions.length,
      failed: errors.length,
      propositions: createdPropositions,
      errors: errors
    })
    
  } catch (error: any) {
    console.error('Erreur PUT /api/rdv:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
