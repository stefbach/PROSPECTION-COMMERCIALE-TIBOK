// app/api/prospects/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const search = url.searchParams.get('q') || ''
    const statut = url.searchParams.get('statut') || ''
    const secteur = url.searchParams.get('secteur') || ''
    const district = url.searchParams.get('district') || ''
    const region = url.searchParams.get('region') || ''

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
    
    // Champs requis minimaux
    const required = ['nom', 'secteur', 'ville', 'statut']
    
    for (const k of required) {
      if (body[k] === undefined || body[k] === null || body[k] === '') {
        return new NextResponse(`Champ requis manquant: ${k}`, { status: 400 })
      }
    }
    
    const supabase = supabaseAdmin()
    
    // Préparer les données avec TOUS les champs disponibles
    const dataToInsert = {
      // Champs principaux
      nom: body.nom,
      secteur: body.secteur,
      ville: body.ville,
      statut: body.statut || 'nouveau',
      
      // Localisation - IMPORTANT: region ET district existent
      region: body.region || body.district || 'Maurice',  // region avec fallback
      district: body.district || body.region || null,      // district avec fallback
      
      // Contacts de base
      contact: body.contact || '',
      telephone: body.telephone || '',
      email: body.email || '',
      score: body.score || 3,
      budget: body.budget || '',
      notes: body.notes || '',
      
      // Adresses (plusieurs colonnes existent)
      adresse: body.adresse || null,
      adresse_complete: body.adresse_complete || body.adresse || null,
      adresse_originale: body.adresse_originale || null,
      rue: body.rue || null,
      code_postal: body.code_postal || null,
      pays: body.pays || 'Maurice',
      code_pays: body.code_pays || 'MU',
      
      // Web et social (ATTENTION: site_web pas website)
      site_web: body.website || body.site_web || null,
      facebook: body.facebook || null,
      instagram: body.instagram || null,
      linkedin: body.linkedin || null,
      twitter: body.twitter || null,
      whatsapp: body.whatsapp || null,
      
      // Coordonnées GPS
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      has_valid_coordinates: body.has_valid_coordinates || false,
      
      // Google Data
      google_place_id: body.google_place_id || null,
      google_cid: body.google_cid || null,
      google_id: body.google_id || null,
      google_maps_url: body.google_maps_url || null,
      
      // Métriques
      rating: body.rating || null,
      reviews_count: body.reviews_count || 0,
      star_rating: body.star_rating || null,
      photos_count: body.photos_count || 0,
      
      // Métadonnées
      type: body.type || null,
      category: body.category || null,
      business_status: body.business_status || 'OPERATIONAL',
      
      // Scoring et priorité
      quality_score: body.quality_score || 0,
      priority: body.priority || null,
      
      // Import tracking
      data_source: body.data_source || 'manual',
      import_batch_id: body.import_batch_id || null,
      import_date: body.import_date || new Date().toISOString(),
      is_verified: body.is_verified || false,
      
      // Commercial
      zone_commerciale: body.zone_commerciale || null,
      statut_visite: body.statut_visite || 'À visiter',
      
      // Téléphones additionnels
      telephone_2: body.telephone_2 || null,
      telephone_3: body.telephone_3 || null,
      
      // Description
      description: body.description || null,
      
      // Entreprise
      entreprise: body.entreprise || null,
      quartier: body.quartier || null
    }
    
    const { data, error } = await supabase
      .from('prospects')
      .insert(dataToInsert)
      .select()
      .single()
    
    if (error) {
      console.error('Erreur Supabase:', error)
      throw error
    }
    
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Erreur POST:', e)
    return new NextResponse(e.message || 'Error', { status: 500 })
  }
}
