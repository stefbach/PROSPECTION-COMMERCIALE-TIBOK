import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = supabaseAdmin()
    const { data, error } = await supabase.from('appointments').select('*').order('date_time', { ascending: true })
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (e: any) {
    return new NextResponse(e.message || 'Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = supabaseAdmin()
    const { data, error } = await supabase.from('appointments').insert({
      prospect_id: body.prospect_id,
      titre: body.titre,
      commercial: body.commercial,
      date_time: body.date_time,
      type_visite: body.type_visite,
      priorite: body.priorite,
      duree_min: body.duree_min || 60,
      notes: body.notes || '',
    }).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e: any) {
    return new NextResponse(e.message || 'Error', { status: 500 })
  }
}
