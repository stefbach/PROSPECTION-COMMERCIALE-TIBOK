// app/api/prospects/all/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const search = url.searchParams.get('q') || ''
    const statut = url.searchParams.get('statut') || ''
    const secteur = url.searchParams.get('secteur') || ''
    const district = url.searchParams.get('district') || ''

    const supabase = supabaseAdmin()
    let query = supabase.from('prospects').select('*')

    if (search) {
      query = query.or(`nom.ilike.%${search}%,ville.ilike.%${search}%`)
    }
    if (secteur) query = query.eq('secteur', secteur)
    if (statut) query = query.eq('statut', statut)
    if (district) query = query.eq('district', district)

    query = query.order('id', { ascending: false })

    // SOLUTION : Utiliser range pour récupérer TOUS les prospects (jusqu'à 100000)
    const { data, error } = await query.range(0, 99999)
    
    if (error) throw error
    
    return NextResponse.json({
      data: data || [],
      total: data?.length || 0
    })
  } catch (e: any) {
    console.error('Erreur API /all:', e)
    return new NextResponse(e.message || 'Error', { status: 500 })
  }
}
