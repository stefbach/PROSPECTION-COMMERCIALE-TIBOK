// app/api/ai/optimize-planning/route.ts
import { NextResponse } from 'next/server'
import { AIService } from '@/lib/openai-service'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { commercial, date, appointments, constraints } = body
    
    if (!commercial || !date || !appointments) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }
    
    // Enrichir les données des RDV avec les infos de la base
    const supabase = supabaseAdmin()
    const appointmentIds = appointments.map((a: any) => a.prospectId)
    
    const { data: prospects } = await supabase
      .from('prospects')
      .select('id, nom, adresse_complete, latitude, longitude, score, secteur')
      .in('id', appointmentIds)
    
    const enrichedAppointments = appointments.map((apt: any) => {
      const prospect = prospects?.find(p => p.id === apt.prospectId)
      return {
        ...apt,
        nom: prospect?.nom || apt.nom,
        adresse: prospect?.adresse_complete || apt.adresse,
        latitude: prospect?.latitude,
        longitude: prospect?.longitude,
        score: prospect?.score
      }
    })
    
    // Optimiser avec l'IA
    const optimization = await AIService.optimizePlanning({
      commercial,
      date,
      appointments: enrichedAppointments,
      constraints
    })
    
    // Sauvegarder les résultats
    await supabase.from('tournees').insert({
      commercial_id: commercial,
      date,
      distance_totale_km: optimization.totalDistance,
      temps_total_min: optimization.totalTime,
      score_optimisation: 0.85,
      economie_km: optimization.savings.kmSaved,
      economie_temps_min: optimization.savings.timeSaved,
      suggestions_ia: optimization.suggestions
    })
    
    return NextResponse.json(optimization)
  } catch (error: any) {
    console.error('Erreur optimisation planning:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'optimisation' },
      { status: 500 }
    )
  }
}

// ============================================

// app/api/ai/analyze-prospect/route.ts
import { NextResponse } from 'next/server'
import { AIService } from '@/lib/openai-service'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { prospectId } = body
    
    if (!prospectId) {
      return NextResponse.json(
        { error: 'ID prospect manquant' },
        { status: 400 }
      )
    }
    
    const supabase = supabaseAdmin()
    
    // Récupérer les données du prospect
    const { data: prospect } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single()
    
    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect non trouvé' },
        { status: 404 }
      )
    }
    
    // Récupérer l'historique des interactions
    const { data: interactions } = await supabase
      .from('interaction_history')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('date_interaction', { ascending: false })
      .limit(10)
    
    // Analyser avec l'IA
    const analysis = await AIService.analyzeProspect({
      nom: prospect.nom,
      secteur: prospect.secteur,
      ville: prospect.ville,
      region: prospect.region,
      nombreEmployes: prospect.nombre_employes,
      interactions: interactions?.map(i => ({
        type: i.type_interaction,
        date: i.date_interaction,
        notes: i.notes || '',
        resultat: i.sentiment
      })) || [],
      budget: prospect.budget
    })
    
    // Mettre à jour le prospect avec le score IA
    await supabase
      .from('prospects')
      .update({
        score_ia: analysis.score / 100,
        potentiel_revenue_mur: analysis.potentielRevenu,
        derniere_analyse_ia: new Date().toISOString()
      })
      .eq('id', prospectId)
    
    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error('Erreur analyse prospect:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'analyse' },
      { status: 500 }
    )
  }
}

// ============================================

// app/api/ai/next-actions/route.ts
import { NextResponse } from 'next/server'
import { AIService } from '@/lib/openai-service'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { commercial } = body
    
    const supabase = supabaseAdmin()
    
    // Récupérer les prospects du commercial
    const { data: appointments } = await supabase
      .from('appointments')
      .select('prospect_id')
      .eq('commercial', commercial)
      .gte('date_time', new Date().toISOString())
    
    const prospectIds = appointments?.map(a => a.prospect_id) || []
    
    const { data: prospects } = await supabase
      .from('prospects')
      .select('*')
      .or(`id.in.(${prospectIds.join(',')}),statut.in.(nouveau,qualifie,en-negociation)`)
      .order('score', { ascending: false })
      .limit(30)
    
    // Récupérer les métriques du commercial
    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data: metrics } = await supabase
      .from('consultation_logs')
      .select('fee_mur')
      .gte('date', `${currentMonth}-01`)
    
    const progressActuel = metrics?.reduce((sum, m) => sum + (m.fee_mur || 0), 0) || 0
    
    // Obtenir les suggestions IA
    const actions = await AIService.getNextBestActions({
      commercial,
      prospects: prospects?.map(p => ({
        id: p.id,
        nom: p.nom,
        statut: p.statut,
        dernierContact: p.updated_at,
        score: p.score,
        notes: p.notes
      })) || [],
      objectifMensuel: 150000, // Objectif par défaut
      progressActuel
    })
    
    return NextResponse.json(actions)
  } catch (error: any) {
    console.error('Erreur next actions:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération des actions' },
      { status: 500 }
    )
  }
}

// ============================================

// app/api/ai/generate-script/route.ts
import { NextResponse } from 'next/server'
import { AIService } from '@/lib/openai-service'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { prospect, typeInteraction, objectif, contexte } = body
    
    if (!prospect || !typeInteraction || !objectif) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }
    
    const script = await AIService.generateSalesScript({
      prospect,
      typeInteraction,
      objectif,
      contexte
    })
    
    return NextResponse.json(script)
  } catch (error: any) {
    console.error('Erreur génération script:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du script' },
      { status: 500 }
    )
  }
}

// ============================================

// app/api/ai/chat/route.ts
import { NextResponse } from 'next/server'
import { AIService } from '@/lib/openai-service'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message, userId, context } = body
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message manquant' },
        { status: 400 }
      )
    }
    
    // Enrichir le contexte si nécessaire
    let enrichedContext = context || {}
    
    if (context?.currentProspectId) {
      const supabase = supabaseAdmin()
      const { data: prospect } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', context.currentProspectId)
        .single()
      
      enrichedContext.currentProspect = prospect
    }
    
    const response = await AIService.chatAssistant({
      userId: userId || 'anonymous',
      message,
      context: enrichedContext
    })
    
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Erreur chat IA:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la réponse' },
      { status: 500 }
    )
  }
}

// ============================================

// app/api/ai/predict-conversion/route.ts
import { NextResponse } from 'next/server'
import { AIService } from '@/lib/openai-service'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { prospectId } = body
    
    const supabase = supabaseAdmin()
    
    // Récupérer les données historiques
    const { data: prospect } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single()
    
    const { data: interactions } = await supabase
      .from('interaction_history')
      .select('*')
      .eq('prospect_id', prospectId)
    
    const firstInteraction = interactions?.[interactions.length - 1]
    const daysSinceFirst = firstInteraction 
      ? Math.floor((Date.now() - new Date(firstInteraction.date_interaction).getTime()) / (1000 * 60 * 60 * 24))
      : 0
    
    const prediction = await AIService.predictConversion({
      interactions: interactions?.length || 0,
      daysSinceFirstContact: daysSinceFirst,
      emailsOpened: 0, // À implémenter avec tracking email
      demosAttended: interactions?.filter(i => i.type_interaction === 'demo').length || 0,
      score: prospect?.score || 0,
      secteur: prospect?.secteur || '',
      budget: prospect?.budget
    })
    
    return NextResponse.json(prediction)
  } catch (error: any) {
    console.error('Erreur prédiction conversion:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la prédiction' },
      { status: 500 }
    )
  }
}
