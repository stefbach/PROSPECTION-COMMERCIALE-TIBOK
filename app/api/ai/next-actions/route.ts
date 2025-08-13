import { NextResponse } from 'next/server'
import AIService from '@/lib/openai-service'
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
