// app/api/rdv/route.ts
// API RDV complète avec gestion des prospects

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Connexion Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Vérifier la configuration
if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ Configuration Supabase manquante!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// GET - Récupérer les RDV avec les données complètes du prospect
export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET /api/rdv - Récupération des RDV...')
    
    const { searchParams } = new URL(request.url)
    const prospect_id = searchParams.get('prospect_id')
    
    // Construire la requête
    let query = supabase.from('rdvs').select('*')
    
    if (prospect_id) {
      query = query.eq('prospect_id', parseInt(prospect_id))
      console.log(`🔍 Filtrage par prospect_id: ${prospect_id}`)
    }
    
    // Exécuter la requête
    const { data: rdvs, error } = await query.order('date_time', { ascending: true })
    
    if (error) {
      console.error('❌ Erreur Supabase GET:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log(`✅ ${rdvs?.length || 0} RDV récupérés`)
    
    // Pour chaque RDV, récupérer les données complètes du prospect
    const rdvsWithProspects = await Promise.all(
      (rdvs || []).map(async (rdv) => {
        try {
          // Récupérer le prospect complet
          const { data: prospect, error: prospectError } = await supabase
            .from('prospects')
            .select('*')
            .eq('id', rdv.prospect_id)
            .single()
          
          if (prospectError) {
            console.warn(`⚠️ Prospect ${rdv.prospect_id} non trouvé:`, prospectError.message)
          }
          
          return {
            ...rdv,
            prospect: prospect || null,
            prospect_nom: prospect?.nom || rdv.prospect_nom || 'Prospect inconnu'
          }
        } catch (err) {
          console.error(`Erreur récupération prospect ${rdv.prospect_id}:`, err)
          return rdv
        }
      })
    )
    
    console.log(`✅ RDV enrichis avec données prospects`)
    return NextResponse.json(rdvsWithProspects)
    
  } catch (error: any) {
    console.error('❌ Erreur GET /api/rdv:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer un RDV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('➕ POST /api/rdv - Création RDV...')
    console.log('📦 Données reçues:', {
      prospect_id: body.prospect_id,
      date_time: body.date_time,
      commercial: body.commercial,
      type_visite: body.type_visite
    })
    
    // Validation
    if (!body.prospect_id || !body.date_time) {
      console.error('❌ Données manquantes')
      return NextResponse.json(
        { error: 'prospect_id et date_time sont requis' },
        { status: 400 }
      )
    }
    
    // Récupérer les données du prospect si nécessaire
    let prospectData = body.prospect
    if (!prospectData && body.prospect_id) {
      console.log(`🔍 Récupération du prospect ${body.prospect_id}...`)
      const { data: prospect, error: prospectError } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', body.prospect_id)
        .single()
      
      if (prospectError) {
        console.warn('⚠️ Prospect non trouvé:', prospectError)
      } else {
        prospectData = prospect
        console.log('✅ Prospect récupéré:', prospect.nom)
      }
    }
    
    // Préparer les données du RDV
    const rdvData = {
      prospect_id: body.prospect_id,
      prospect_nom: prospectData?.nom || body.prospect_nom || 'Prospect',
      commercial: body.commercial || 'Commercial',
      titre: body.titre || `RDV - ${prospectData?.nom || 'Prospect'}`,
      date_time: body.date_time,
      duree_min: body.duree_min || 60,
      type_visite: body.type_visite || 'decouverte',
      priorite: body.priorite || 'normale',
      statut: body.statut || 'planifie',
      notes: body.notes || '',
      lieu: body.lieu || prospectData?.adresse || 
            (prospectData ? `${prospectData.ville}, ${prospectData.district}` : ''),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('💾 Insertion dans Supabase...')
    
    // Insérer dans la base
    const { data: newRDV, error } = await supabase
      .from('rdvs')
      .insert([rdvData])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Erreur insertion Supabase:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    console.log('✅ RDV créé avec succès:', newRDV.id)
    
    // Retourner le RDV avec les données du prospect
    return NextResponse.json({
      ...newRDV,
      prospect: prospectData
    })
    
  } catch (error: any) {
    console.error('❌ Erreur POST /api/rdv:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un RDV
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    console.log(`📝 PATCH /api/rdv - Mise à jour RDV ${body.id}...`)
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      )
    }
    
    // Préparer les données de mise à jour
    const updates: any = { ...body }
    delete updates.id
    delete updates.prospect // Ne pas écraser la colonne prospect
    updates.updated_at = new Date().toISOString()
    
    console.log('💾 Mise à jour dans Supabase...')
    
    const { data: updated, error } = await supabase
      .from('rdvs')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Erreur update Supabase:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    if (!updated) {
      return NextResponse.json(
        { error: 'RDV non trouvé' },
        { status: 404 }
      )
    }
    
    // Récupérer les données du prospect
    const { data: prospect } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', updated.prospect_id)
      .single()
    
    console.log('✅ RDV mis à jour:', updated.id)
    
    return NextResponse.json({
      ...updated,
      prospect: prospect
    })
    
  } catch (error: any) {
    console.error('❌ Erreur PATCH /api/rdv:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
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
    
    console.log(`🗑️ DELETE /api/rdv - Suppression RDV ${id}...`)
    
    const { error } = await supabase
      .from('rdvs')
      .delete()
      .eq('id', parseInt(id))
    
    if (error) {
      console.error('❌ Erreur delete Supabase:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    console.log('✅ RDV supprimé')
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('❌ Erreur DELETE /api/rdv:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
