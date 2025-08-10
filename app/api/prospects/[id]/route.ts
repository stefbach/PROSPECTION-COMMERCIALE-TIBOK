// app/api/prospects/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    console.log(`[API] GET /prospects/${id} - Récupération d'un prospect`)
    
    const supabase = supabaseAdmin()
    
    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return new NextResponse(
          JSON.stringify({ error: 'Prospect non trouvé' }), 
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      throw error
    }
    
    return NextResponse.json(data)
    
  } catch (e: any) {
    console.error('[API] Erreur GET prospect:', e)
    return new NextResponse(
      JSON.stringify({ error: e.message || 'Erreur serveur' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await req.json()
    
    console.log(`[API] PATCH /prospects/${id} - Mise à jour`)
    
    const supabase = supabaseAdmin()
    
    // Préparer les données à mettre à jour
    const dataToUpdate: any = {}
    
    // Mettre à jour seulement les champs fournis
    const fieldsToUpdate = [
      'nom', 'secteur', 'ville', 'statut', 'district', 'region',
      'contact', 'telephone', 'email', 'score', 'budget', 'notes',
      'adresse', 'adresse_complete', 'rue', 'code_postal', 'pays',
      'latitude', 'longitude', 'priority', 'quality_score',
      'telephone_2', 'telephone_3', 'description', 'entreprise',
      'quartier', 'zone_commerciale', 'statut_visite',
      'facebook', 'instagram', 'linkedin', 'twitter', 'whatsapp',
      'google_place_id', 'google_maps_url', 'rating', 'reviews_count'
    ]
    
    // Gérer le cas spécial de 'website' qui devient 'site_web'
    if (body.website !== undefined) {
      dataToUpdate.site_web = body.website
    }
    if (body.site_web !== undefined) {
      dataToUpdate.site_web = body.site_web
    }
    
    // Copier les autres champs
    fieldsToUpdate.forEach(field => {
      if (body[field] !== undefined) {
        dataToUpdate[field] = body[field]
      }
    })
    
    // Vérifier qu'il y a au moins un champ à mettre à jour
    if (Object.keys(dataToUpdate).length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Aucun champ à mettre à jour' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    const { data, error } = await supabase
      .from('prospects')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return new NextResponse(
          JSON.stringify({ error: 'Prospect non trouvé' }), 
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    console.log(`[API] DELETE /prospects/${id} - Suppression`)
    
    const supabase = supabaseAdmin()
    
    // Vérifier d'abord que le prospect existe
    const { data: existing } = await supabase
      .from('prospects')
      .select('id')
      .eq('id', id)
      .single()
    
    if (!existing) {
      return new NextResponse(
        JSON.stringify({ error: 'Prospect non trouvé' }), 
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Supprimer le prospect
    const { error } = await supabase
      .from('prospects')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('[API] Erreur Supabase DELETE:', error)
      throw error
    }
    
    console.log(`[API] Prospect ${id} supprimé avec succès`)
    return NextResponse.json({ 
      success: true,
      message: `Prospect ${id} supprimé avec succès`
    })
    
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
