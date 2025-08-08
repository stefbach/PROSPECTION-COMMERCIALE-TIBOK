import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

type Row = {
  nom?: string
  secteur?: string
  ville?: string
  region?: string
  statut?: string
  contact?: string
  telephone?: string
  email?: string
  score?: number
  budget?: string
  notes?: string
}

const requiredCols = ['nom', 'secteur', 'ville', 'region', 'statut']

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const dryRun = url.searchParams.get('dryRun') === 'true'
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return new NextResponse('Fichier manquant', { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buf, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: '' })

    // Normalize and validate
    const parsed = rows.map((r) => ({
      nom: String(r.nom || '').trim(),
      secteur: String(r.secteur || '').trim().toLowerCase(),
      ville: String(r.ville || '').trim(),
      region: String(r.region || '').trim().toLowerCase(),
      statut: String(r.statut || '').trim().toLowerCase(),
      contact: String(r.contact || '').trim(),
      telephone: String(r.telephone || '').trim(),
      email: String(r.email || '').trim(),
      score: Number(r.score || 3),
      budget: String(r.budget || '').trim(),
      notes: String(r.notes || '').trim(),
    }))

    for (const row of parsed) {
      for (const c of requiredCols) {
        if (!row[c as keyof typeof row]) {
          return new NextResponse(`Colonne requise manquante pour une ligne: ${c}`, { status: 400 })
        }
      }
    }

    const supabase = supabaseAdmin()
    // Get existing by (nom, ville) to detect duplicates
    const names = parsed.map((p) => p.nom)
    const { data: existing } = await supabase.from('prospects').select('id,nom,ville').in('nom', names)
    const existingSet = new Set((existing || []).map((e: any) => `${(e.nom || '').toLowerCase()}|${(e.ville || '').toLowerCase()}`))

    let willUpdate = 0
    let willInsert = 0
    let duplicates = 0
    for (const p of parsed) {
      const key = `${p.nom.toLowerCase()}|${p.ville.toLowerCase()}`
      if (existingSet.has(key)) {
        willUpdate++
      } else {
        willInsert++
      }
    }
    duplicates = parsed.length - (willInsert + willUpdate)

    if (dryRun) {
      return NextResponse.json({
        totalRows: parsed.length,
        willInsert,
        willUpdate,
        duplicates,
      })
    }

    // Upsert using unique index (nom, ville)
    const { error } = await supabase.from('prospects').upsert(parsed, { onConflict: 'nom,ville' })
    if (error) throw error

    return NextResponse.json({ ok: true, inserted: willInsert, updated: willUpdate })
  } catch (e: any) {
    return new NextResponse(e.message || 'Erreur import', { status: 500 })
  }
}
