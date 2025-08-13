import { NextResponse } from 'next/server'
import AIService from '@/lib/openai-service'
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
