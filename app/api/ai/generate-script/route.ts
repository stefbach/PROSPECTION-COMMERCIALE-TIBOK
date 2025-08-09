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
