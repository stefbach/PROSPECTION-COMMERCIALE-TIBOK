import { NextResponse } from 'next/server'
import AIService from '@/lib/openai-service'
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
