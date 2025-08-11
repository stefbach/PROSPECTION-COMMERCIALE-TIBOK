// app/api/prospects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Récupérer tous les prospects de manière asynchrone
    let prospects = await db.getProspects()
    
    // Filtres
    const search = searchParams.get('q')
    const secteur = searchParams.get('secteur')
    const district = searchParams.get('district')
    const statut = searchParams.get('statut')
    
    // Appliquer les filtres
    if (search) {
      prospects = prospects.filter(p => 
        p.nom.toLowerCase().includes(search.toLowerCase()) ||
        (p.ville && p.ville.toLowerCase().includes(search.toLowerCase())) ||
        (p.contact && p.contact.toLowerCase().includes(search.toLowerCase()))
      )
    }
    
    if (secteur) {
      prospects = prospects.filter(p => p.secteur === secteur)
    }
    
    if (district) {
      prospects = prospects.filter(p => p.district === district)
    }
    
    if (statut) {
      prospects = prospects.filter(p => p.statut === statut)
    }
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    
    const paginatedProspects = prospects.slice(startIndex, endIndex)
    
    // Si limit > 1000, on retourne tout (pour la vue complète)
    if (limit > 1000) {
      return NextResponse.json({
        data: prospects,
        total: prospects.length
      })
    }
    
    // Retourner avec pagination
    return NextResponse.json({
      data: paginatedProspects,
      pagination: {
        page,
        limit,
        total: prospects.length,
        totalPages: Math.ceil(prospects.length / limit)
      }
    })
  } catch (error) {
    console.error('Erreur GET /api/prospects:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données requises
    if (!body.nom || !body.ville) {
      return NextResponse.json(
        { error: 'Nom et ville sont requis' },
        { status: 400 }
      )
    }
    
    // Mapper les champs pour compatibilité
    const prospectData = {
      nom: body.nom,
      secteur: body.secteur || 'autre',
      ville: body.ville,
      district: body.district || 'Port Louis',
      statut: body.statut || 'nouveau',
      contact: body.contact || '',
      telephone: body.telephone || '',
      email: body.email || '',
      score: body.score || 3,
      budget: body.budget || '',
      notes: body.notes || '',
      website: body.website || '',
      adresse: body.adresse || '',
      priority: body.priority || '',
      quality_score: body.quality_score || 50,
      pays: 'Maurice'
    }
    
    const newProspect = await db.createProspect(prospectData)
    
    return NextResponse.json(newProspect, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/prospects:', error)
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID du prospect requis' },
        { status: 400 }
      )
    }
    
    const { id, ...updates } = body
    const updated = await db.updateProspect(id, updates)
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Prospect non trouvé' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erreur PATCH /api/prospects:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du prospect requis' },
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
    console.error('Erreur DELETE /api/prospects:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
