// app/api/prospects/[id]/comments/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('prospect_comments')
      .select('*')
      .eq('prospect_id', params.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const supabase = supabaseAdmin()
    
    const { data, error } = await supabase
      .from('prospect_comments')
      .insert({
        prospect_id: params.id,
        comment: body.comment,
        type: body.type || 'note',
        user_name: body.user_name || 'Admin'
      })
      .select()
      .single()
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 })
  }
}
