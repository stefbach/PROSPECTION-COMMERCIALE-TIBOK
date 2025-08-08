import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = supabaseAdmin()
    const { data, error } = await supabase.from('prospects').select('*').eq('id', Number(params.id)).single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e: any) {
    return new NextResponse(e.message || 'Not found', { status: 404 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const supabase = supabaseAdmin()
    const { data, error } = await supabase.from('prospects').update(body).eq('id', Number(params.id)).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e: any) {
    return new NextResponse(e.message || 'Error', { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = supabaseAdmin()
    const { error } = await supabase.from('prospects').delete().eq('id', Number(params.id))
    if (error) throw error
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return new NextResponse(e.message || 'Error', { status: 500 })
  }
}
