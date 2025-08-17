// app/api/performance/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Route temporaire pour éviter l'erreur 404
export async function GET(request: NextRequest) {
  try {
    // Retourner des données de performance mock
    return NextResponse.json({
      data: {
        totalSales: 0,
        totalRevenue: 0,
        conversionRate: 0,
        appointments: 0
      },
      success: true
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
