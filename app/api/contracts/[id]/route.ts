import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

const BUCKET = 'contracts'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = supabaseAdmin()
    const { data: row, error: getErr } = await supabase.from('contracts').select('*').eq('id', params.id).single()
    if (getErr) throw getErr
    if (row?.file_path) {
      const { error: remErr } = await supabase.storage.from(BUCKET).remove([row.file_path])
      if (remErr) throw remErr
    }
    const { error: delErr } = await supabase.from('contracts').delete().eq('id', params.id)
    if (delErr) throw delErr
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return new NextResponse(e.message || 'Error', { status: 500 })
  }
}
