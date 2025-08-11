// app/api/prospects/route.ts
// VERSION SIMPLE - API pour les prospects

import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/database'

// GET - Récupérer les prospects
export async function GET(request: NextRequest) {
  try {
    // Récupérer TOUS les prospects depuis Supabase
    const prospects = await db.getAllProspects()
    
    // Extraire les paramètres de recherche
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('q')
    const secteur = searchParams.get('secteur')
    const district = searchParams.get('district')
    const statut = searchParams.get('statut')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    // Filtrer si nécessaire
    let filtered = prospects
    
    if (search) {
      filtered = filtered.filter(p => 
        p.nom.toLowerCase().includes(search.toLowerCase()) ||
        p.ville?.toLowerCase().includes(search.toLowerCase()) ||
        p.contact?.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    if (secteur) {
      filtered = filtered.filter(p => p.secteur === secteur)
    }
    
    if (district) {
      filtered = filtered.filter(p => p.district === district)
    }
    
    if (statut) {
      filtered = filtered.filter(p => p.statut === statut)
    }
    
    // Si on demande TOUT (limit > 1000), retourner tout
    if (limit > 1000) {
      return NextResponse.json({
        data: filtered,
        total: filtered.length
      })
    }
    
    // Sinon, paginer
    const start = (page - 1) * limit
    const end = start + limit
    const paginated = filtered.slice(start, end)
    
    return NextResponse.json({
      data: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit)
      }
    })
    
  } catch (error) {
    console.error('Erreur GET:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur',
      data: [],
      pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
    }, { status: 500 })
  }
}

// POST - Créer un prospect
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.nom || !body.ville) {
      return NextResponse.json(
        { error: 'Nom et ville requis' },
        { status: 400 }
      )
    }
    
    const newProspect = await db.createProspect(body)
    return NextResponse.json(newProspect)
    
  } catch (error) {
    console.error('Erreur POST:', error)
    return NextResponse.json(
      { error: 'Erreur création' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un prospect
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      )
    }
    
    const updated = await db.updateProspect(body.id, body)
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Prospect non trouvé' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(updated)
    
  } catch (error) {
    console.error('Erreur PATCH:', error)
    return NextResponse.json(
      { error: 'Erreur mise à jour' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un prospect
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID requis' },
        { status: 400 }
      )
    }
    
    const success = await db.deleteProspect(parseInt(id))
    
    if (!success) {
      return NextResponse.json(
        { error: 'Prospect non trouvé' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Erreur DELETE:', error)
    return NextResponse.json(
      { error: 'Erreur suppression' },
      { status: 500 }
    )
  }
}
