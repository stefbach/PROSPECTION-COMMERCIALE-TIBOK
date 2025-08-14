import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    
    // Calculer l'offset pour la pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    console.log(`📥 Chargement prospects: page ${page}, limit ${limit}, from ${from} to ${to}`)

    // Récupérer le nombre total SANS charger toutes les données
    const { count } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true })

    // Récupérer seulement la page demandée
    let query = supabase
      .from('prospects')
      .select('*')
      .range(from, to)
      .order('id', { ascending: true })

    // Ajouter la recherche si nécessaire
    if (search) {
      query = query.or(`nom.ilike.%${search}%,ville.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur Supabase:', error)
      throw error
    }

    console.log(`✅ ${data?.length || 0} prospects chargés sur ${count} total`)

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page: page,
        limit: limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        from: from + 1,
        to: Math.min(to + 1, count || 0)
      }
    })

  } catch (error: any) {
    console.error('❌ Erreur API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Erreur serveur',
        details: error
      },
      { status: 500 }
    )
  }
}

// Ajouter un nouveau prospect
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('prospects')
      .insert([body])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    )
  }
}

// Mettre à jour un prospect
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    const { data, error } = await supabase
      .from('prospects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 }
    )
  }
}
