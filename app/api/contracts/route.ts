import { NextResponse } from 'next/server'
import { ensureBucket, supabaseAdmin } from '@/lib/supabase/server'

const BUCKET = 'contracts'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const prospectId = url.searchParams.get('prospect_id')
    const supabase = supabaseAdmin()
    let query = supabase.from('contracts').select('*').order('uploaded_at', { ascending: false })
    if (prospectId) query = query.eq('prospect_id', Number(prospectId))
    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (e: any) {
    return new NextResponse(e.message || 'Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await ensureBucket(BUCKET)
    const supabase = supabaseAdmin()
    const form = await req.formData()
    const prospectId = Number(form.get('prospect_id'))
    const fee_mur = Number(form.get('fee_mur') || 0)
    const file = form.get('file') as File | null
    if (!prospectId || !file) return new NextResponse('prospect_id et file sont requis', { status: 400 })

    const safeName = file.name.replace(/[^\w.\-]+/g, '_')
    const path = `${prospectId}/${Date.now()}-${safeName}`
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    })
    if (uploadErr) throw uploadErr

    const { data, error: insertErr } = await supabase.from('contracts').insert({
      prospect_id: prospectId,
      file_path: path,
      file_name: safeName,
      fee_mur: isNaN(fee_mur) ? 0 : fee_mur,
    }).select().single()
    if (insertErr) throw insertErr

    return NextResponse.json(data)
  } catch (e: any) {
    return new NextResponse(e.message || 'Upload error', { status: 500 })
  }
}
