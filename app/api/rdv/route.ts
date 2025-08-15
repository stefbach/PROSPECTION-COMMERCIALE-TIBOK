// app/api/rdv/route.ts
// Ajout du statut "proposition" pour les RDV non confirmés

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// GET - Récupérer les RDV avec filtre sur le statut
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prospect_id = searchParams.get('prospect_id')
    const statut = searchParams.get('statut')
    const includePropositions = searchParams.get('include_propositions') === 'true'
    
    let query = supabase.from('rdvs').select('*')
    
    if (prospect_id) {
      query = query.eq('prospect_id', parseInt(prospect_id))
    }
    
    // Filtrer par statut
    if (statut) {
      query = query.eq('statut', statut)
    } else if (!includePropositions) {
      // Par défaut, ne pas inclure les propositions sauf demande explicite
      query = query.neq('statut', 'proposition')
    }
    
    const { data: rdvs, error } = await query.order('date_time', { ascending: true })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Enrichir avec les données prospects
    const rdvsWithProspects = await Promise.all(
      (rdvs || []).map(async (rdv) => {
        const { data: prospect } = await supabase
          .from('prospects')
          .select('*')
          .eq('id', rdv.prospect_id)
          .single()
        
        return {
          ...rdv,
          prospect: prospect || null,
          prospect_nom: prospect?.nom || rdv.prospect_nom || 'Prospect inconnu',
          // Ajouter un flag pour identifier les propositions
          isProposition: rdv.statut === 'proposition',
          canEdit: rdv.statut === 'proposition' || rdv.statut === 'planifie'
        }
      })
    )
    
    return NextResponse.json(rdvsWithProspects)
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Créer un RDV ou une proposition
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Déterminer si c'est une proposition IA ou un RDV manuel
    const isProposition = body.source === 'ai' || body.statut === 'proposition'
    
    const rdvData = {
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
      // Nouveaux champs pour la gestion des propositions
      ai_score: body.ai_score || null, // Score de pertinence IA
      ai_reason: body.ai_reason || null, // Raison de la proposition
      proposed_at: isProposition ? new Date().toISOString() : null,
      validated_at: null,
      validated_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: newRDV, error } = await supabase
      .from('rdvs')
      .insert([rdvData])
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(newRDV)
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Valider ou modifier un RDV
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }
    
    const updates: any = { ...body }
    delete updates.id
    
    // Si on valide une proposition
    if (body.action === 'validate' && body.statut === 'planifie') {
      updates.validated_at = new Date().toISOString()
      updates.validated_by = body.commercial || 'Agent'
      updates.notes = (updates.notes || '') + '\n✅ Validé et confirmé avec le prospect'
    }
    
    // Si on verrouille un RDV
    if (body.action === 'lock' && body.statut === 'confirme') {
      updates.locked = true
      updates.locked_at = new Date().toISOString()
      updates.locked_by = body.commercial || 'Agent'
    }
    
    updates.updated_at = new Date().toISOString()
    
    const { data: updated, error } = await supabase
      .from('rdvs')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(updated)
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Nouvelle route pour créer des propositions en masse
export async function PUT(request: NextRequest) {
  try {
    const { propositions } = await request.json()
    
    if (!Array.isArray(propositions)) {
      return NextResponse.json({ error: 'Format invalide' }, { status: 400 })
    }
    
    // Créer toutes les propositions
    const results = await Promise.all(
      propositions.map(async (prop) => {
        const rdvData = {
          ...prop,
          statut: 'proposition',
          source: 'ai',
          proposed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { data, error } = await supabase
          .from('rdvs')
          .insert([rdvData])
          .select()
          .single()
        
        return { data, error }
      })
    )
    
    const successful = results.filter(r => !r.error).map(r => r.data)
    const failed = results.filter(r => r.error)
    
    return NextResponse.json({
      success: successful.length,
      failed: failed.length,
      propositions: successful,
      errors: failed.map(f => f.error?.message)
    })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
