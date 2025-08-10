// app/api/prospects/all/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    
    // Paramètres de filtrage (optionnels)
    const search = url.searchParams.get('q') || ''
    const statut = url.searchParams.get('statut') || ''
    const secteur = url.searchParams.get('secteur') || ''
    const district = url.searchParams.get('district') || ''
    const region = url.searchParams.get('region') || ''
    
    console.log('[API] GET /prospects/all - Chargement de TOUS les prospects')
    console.log(`[API] Filtres: search="${search}", statut="${statut}", secteur="${secteur}"`)

    const supabase = supabaseAdmin()
    
    // Construire la requête
    let query = supabase
      .from('prospects')
      .select('*')
      .order('id', { ascending: false })

    // Appliquer les filtres si nécessaire
    if (search) {
      query = query.or(`nom.ilike.%${search}%,ville.ilike.%${search}%,contact.ilike.%${search}%`)
    }
    if (secteur) query = query.eq('secteur', secteur)
    if (statut) query = query.eq('statut', statut)
    if (district) query = query.eq('district', district)
    if (region) query = query.eq('region', region)

    // SOLUTION : Utiliser range pour récupérer TOUS les prospects
    // Range de 0 à 99999 pour contourner la limite de 1000 de Supabase
    const { data, error } = await query.range(0, 99999)
    
    if (error) {
      console.error('[API] Erreur Supabase /all:', error)
      throw error
    }
    
    const total = data?.length || 0
    console.log(`[API] /all - ${total} prospects chargés`)
    
    // Si on a exactement 100000 prospects, avertir qu'il y en a peut-être plus
    if (total === 100000) {
      console.warn('[API] ATTENTION: Limite de 100000 atteinte, il peut y avoir plus de prospects')
    }
    
    return NextResponse.json({
      data: data || [],
      total: total,
      message: total === 100000 ? 'Limite de 100000 prospects atteinte' : null
    })
    
  } catch (e: any) {
    console.error('[API] Erreur GET /all:', e)
    return new NextResponse(
      JSON.stringify({ error: e.message || 'Erreur serveur' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
