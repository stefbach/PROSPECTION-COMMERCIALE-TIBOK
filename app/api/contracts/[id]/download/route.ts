import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

const BUCKET = 'contracts'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = supabaseAdmin()
    const { data: row, error } = await supabase.from('contracts').select('*').eq('id', params.id).single()
    if (error) throw error
    if (!row?.file_path) return new NextResponse('Not found', { status: 404 })
    const { data: signed, error: urlErr } = await supabase.storage.from(BUCKET).createSignedUrl(row.file_path, 60 * 10) // 10 min
    if (urlErr) throw urlErr
    return NextResponse.json({ url: signed?.signedUrl })
  } catch (e: any) {
    return new NextResponse(e.message || 'Error', { status: 500 })
  }
}
