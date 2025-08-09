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
