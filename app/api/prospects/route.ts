// app/api/prospects/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    
    // Paramètres de filtrage
    const search = url.searchParams.get('q') || ''
    const statut = url.searchParams.get('statut') || ''
    const secteur = url.searchParams.get('secteur') || ''
    const district = url.searchParams.get('district') || ''
    const region = url.searchParams.get('region') || ''
    
    // Paramètres de pagination - IMPORTANT pour dépasser 1000
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    
    console.log(`[API] GET /prospects - Page: ${page}, Limit: ${limit}, Search: ${search}`)

    const supabase = supabaseAdmin()
    
    // Construire la requête avec count pour avoir le total
    let query = supabase
      .from('prospects')
      .select('*', { count: 'exact' })
      .order('id', { ascending: false })

    // Appliquer les filtres
    if (search) {
      query = query.or(`nom.ilike.%${search}%,ville.ilike.%${search}%,contact.ilike.%${search}%`)
    }
    if (secteur) query = query.eq('secteur', secteur)
    if (statut) query = query.eq('statut', statut)
    if (district) query = query.eq('district', district)
    if (region) query = query.eq('region', region)

    // SOLUTION CRITIQUE : Utiliser .range() pour la pagination
    // Cela permet de dépasser la limite de 1000 de Supabase
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    console.log(`[API] Range: ${from} to ${to}`)
    
    // Exécuter la requête avec range
    const { data, error, count } = await query.range(from, to)
    
    if (error) {
      console.error('[API] Erreur Supabase:', error)
      throw error
    }
    
    console.log(`[API] Résultats: ${data?.length || 0} prospects, Total en base: ${count}`)

    // Retourner avec les infos de pagination
    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (e: any) {
    console.error('[API] Erreur GET:', e)
    return new NextResponse(
      JSON.stringify({ error: e.message || 'Erreur serveur' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    console.log('[API] POST /prospects - Création nouveau prospect')
    
    // Validation des champs requis
    const required = ['nom', 'secteur', 'ville', 'statut']
    for (const k of required) {
      if (!body[k]) {
        return new NextResponse(
          JSON.stringify({ error: `Champ requis manquant: ${k}` }), 
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
    
    const supabase = supabaseAdmin()
    
    // Préparer les données complètes
    const dataToInsert = {
      // Champs principaux
      nom: body.nom,
      secteur: body.secteur,
      ville: body.ville,
      statut: body.statut || 'nouveau',
      
      // Localisation
      region: body.region || body.district || 'Maurice',
      district: body.district || body.region || null,
      
      // Contacts
      contact: body.contact || '',
      telephone: body.telephone || '',
      email: body.email || '',
      score: body.score || 3,
      budget: body.budget || '',
      notes: body.notes || '',
      
      // Adresses
      adresse: body.adresse || null,
      adresse_complete: body.adresse_complete || body.adresse || null,
      adresse_originale: body.adresse_originale || null,
      rue: body.rue || null,
      code_postal: body.code_postal || null,
      pays: body.pays || 'Maurice',
      code_pays: body.code_pays || 'MU',
      
      // Web et social
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
      console.error('[API] Erreur Supabase POST:', error)
      throw error
    }
    
    console.log('[API] Prospect créé avec succès:', data.id)
    return NextResponse.json(data)
    
  } catch (e: any) {
    console.error('[API] Erreur POST:', e)
    return new NextResponse(
      JSON.stringify({ error: e.message || 'Erreur serveur' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url)
    const segments = url.pathname.split('/')
    const id = segments[segments.length - 1]
    
    if (!id || id === 'prospects') {
      return new NextResponse(
        JSON.stringify({ error: 'ID manquant' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    const body = await req.json()
    console.log(`[API] PATCH /prospects/${id} - Mise à jour`)
    
    const supabase = supabaseAdmin()
    
    // Préparer les données à mettre à jour
    const dataToUpdate: any = {}
    
    // Mettre à jour seulement les champs fournis
    if (body.nom !== undefined) dataToUpdate.nom = body.nom
    if (body.secteur !== undefined) dataToUpdate.secteur = body.secteur
    if (body.ville !== undefined) dataToUpdate.ville = body.ville
    if (body.statut !== undefined) dataToUpdate.statut = body.statut
    if (body.district !== undefined) dataToUpdate.district = body.district
    if (body.region !== undefined) dataToUpdate.region = body.region
    if (body.contact !== undefined) dataToUpdate.contact = body.contact
    if (body.telephone !== undefined) dataToUpdate.telephone = body.telephone
    if (body.email !== undefined) dataToUpdate.email = body.email
    if (body.score !== undefined) dataToUpdate.score = body.score
    if (body.budget !== undefined) dataToUpdate.budget = body.budget
    if (body.notes !== undefined) dataToUpdate.notes = body.notes
    if (body.adresse !== undefined) dataToUpdate.adresse = body.adresse
    if (body.website !== undefined) dataToUpdate.site_web = body.website
    if (body.priority !== undefined) dataToUpdate.priority = body.priority
    if (body.quality_score !== undefined) dataToUpdate.quality_score = body.quality_score
    
    const { data, error } = await supabase
      .from('prospects')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('[API] Erreur Supabase PATCH:', error)
      throw error
    }
    
    console.log(`[API] Prospect ${id} mis à jour avec succès`)
    return NextResponse.json(data)
    
  } catch (e: any) {
    console.error('[API] Erreur PATCH:', e)
    return new NextResponse(
      JSON.stringify({ error: e.message || 'Erreur serveur' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const segments = url.pathname.split('/')
    const id = segments[segments.length - 1]
    
    if (!id || id === 'prospects') {
      return new NextResponse(
        JSON.stringify({ error: 'ID manquant' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log(`[API] DELETE /prospects/${id} - Suppression`)
    
    const supabase = supabaseAdmin()
    
    const { error } = await supabase
      .from('prospects')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('[API] Erreur Supabase DELETE:', error)
      throw error
    }
    
    console.log(`[API] Prospect ${id} supprimé avec succès`)
    return NextResponse.json({ success: true })
    
  } catch (e: any) {
    console.error('[API] Erreur DELETE:', e)
    return new NextResponse(
      JSON.stringify({ error: e.message || 'Erreur serveur' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
