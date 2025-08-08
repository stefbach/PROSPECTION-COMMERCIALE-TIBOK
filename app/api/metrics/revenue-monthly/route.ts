import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

function key(dateStr: string) {
  const d = new Date(dateStr)
  const y = d.getUTCFullYear()
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0')
  return `${y}-${m}`
}

export async function GET() {
  try {
    const supabase = supabaseAdmin()
    const { data, error } = await supabase.from('consultation_logs').select('date,fee_mur').order('date', { ascending: true })
    if (error) throw error
    const map = new Map<string, number>()
    for (const row of data || []) {
      const k = key(row.date)
      map.set(k, (map.get(k) || 0) + (Number(row.fee_mur) || 0))
    }
    const result = Array.from(map.entries()).map(([month, total]) => ({ month, total_mur: total }))
    return NextResponse.json(result)
  } catch {
    // Return empty list if table missing
    return NextResponse.json([])
  }
}
