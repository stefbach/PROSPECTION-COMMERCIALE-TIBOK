import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = supabaseAdmin()
    // Prefer a view if available; otherwise sum on the fly
    const { data, error } = await supabase.from('consultation_logs').select('fee_mur')
    if (error) throw error
    const total = (data || []).reduce((acc, row: any) => acc + (Number(row.fee_mur) || 0), 0)
    return NextResponse.json({ total_mur: total })
  } catch (e: any) {
    // Fallback 0 if table not present yet
    return NextResponse.json({ total_mur: 0 })
  }
}
