import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const search = url.searchParams.get('q') || ''
    const statut = url.searchParams.get('statut') || ''
    const secteur = url.searchParams.get('secteur') || ''
    const district = url.searchParams.get('district') || ''

    const supabase = supabaseAdmin()
    let query = supabase.from('prospects').select('*').order('id', { ascending: false })

    if (search) {
      query = supabase
        .from('prospects')
        .select('*')
        .or(`nom.ilike.%${search}%,ville.ilike.%${search}%`)
        .order('id', { ascending: false })
    }
    if (secteur) query = query.eq('secteur', secteur)
    if (statut) query = query.eq('statut', statut)
    if (district) query = query.eq('district', district)

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
    
    // Vérifier les champs requis avec DISTRICT (pas region)
    const required = ['nom', 'secteur', 'ville', 'statut', 'district', 'score']
    
    for (const k of required) {
      if (body[k] === undefined || body[k] === null || body[k] === '') {
        return new NextResponse(`Champ requis manquant: ${k}`, { status: 400 })
      }
    }
    
    const supabase = supabaseAdmin()
    
    // Insérer avec tous les champs, en utilisant DISTRICT
    const { data, error } = await supabase.from('prospects').insert({
      nom: body.nom,
      secteur: body.secteur,
      ville: body.ville,
      statut: body.statut,
      district: body.district,  // DISTRICT, pas region
      contact: body.contact || '',
      telephone: body.telephone || '',
      email: body.email || '',
      score: body.score,
      budget: body.budget || '',
      notes: body.notes || '',
      website: body.website || '',
      adresse: body.adresse || ''
    }).select().single()
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (e: any) {
    return new NextResponse(e.message || 'Error', { status: 500 })
  }
}
