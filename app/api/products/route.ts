// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Route temporaire pour éviter l'erreur 404
export async function GET(request: NextRequest) {
  try {
    // Retourner des données vides ou mock pour le moment
    return NextResponse.json({
      data: [],
      success: true
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { message: 'Route products non implémentée' },
    { status: 501 }
  )
}
