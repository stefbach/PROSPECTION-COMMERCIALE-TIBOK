import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const search = url.searchParams.get('q') || ''
    const statut = url.searchParams.get('statut') || ''
    const secteur = url.searchParams.get('secteur') || ''
    const region = url.searchParams.get('region') || ''

    const supabase = supabaseAdmin()
    let query = supabase.from('prospects').select('*').order('id', { ascending: false })

    if (search) {
      // Simple client-side filter later, server keeps base list light
      // Optionally, use ilike with or filters
      query = supabase
        .from('prospects')
        .select('*')
        .or(`nom.ilike.%${search}%,ville.ilike.%${search}%`)
        .order('id', { ascending: false })
    }
    if (secteur) query = query.eq('secteur', secteur)
    if (statut) query = query.eq('statut', statut)
    if (region) query = query.eq('region', region)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (e: any) {
    return new NextResponse(e.message || 'Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const required = ['nom', 'secteur', 'ville', 'statut', 'region', 'score']
    for (const k of required) {
      if (body[k] === undefined || body[k] === null || body[k] === '') {
        return new NextResponse(`Champ requis manquant: ${k}`, { status: 400 })
      }
    }
    const supabase = supabaseAdmin()
    const { data, error } = await supabase.from('prospects').insert({
  nom: body.nom,
  secteur: body.secteur,
  ville: body.ville,
  statut: body.statut,
  region: body.region || body.district || 'port-louis',  // Accepter district aussi
  contact: body.contact || '',
  telephone: body.telephone || '',
  email: body.email || '',
  score: body.score,
  budget: body.budget || '',
  notes: body.notes || '',
  website: body.website || '',  // Ajouter si la colonne existe
  adresse: body.adresse || '',  // Ajouter si la colonne existe
}).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e: any) {
    return new NextResponse(e.message || 'Error', { status: 500 })
  }
}
