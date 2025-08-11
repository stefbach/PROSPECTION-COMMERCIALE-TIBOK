// app/api/contrats/route.ts
// API pour la gestion des contrats

import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/database'

// Types pour les contrats
export interface Contrat {
  id: number
  prospect_id: number
  prospect_nom?: string
  numero: string
  titre: string
  date_debut: string
  date_fin: string
  montant: number
  devise: string
  statut: 'brouillon' | 'envoye' | 'negocie' | 'signe' | 'actif' | 'termine' | 'annule'
  type: 'vente' | 'service' | 'maintenance' | 'location' | 'autre'
  conditions?: string
  fichier_url?: string
  created_at: string
  updated_at: string
}

// Stockage temporaire des contrats
declare global {
  var mauritiusContrats: Contrat[] | undefined
  var lastContratId: number | undefined
}

// Initialiser les contrats
function initializeContrats(): Contrat[] {
  if (global.mauritiusContrats) {
    return global.mauritiusContrats
  }

  const contrats: Contrat[] = []
  const prospects = db.getProspects()
  let contratId = 1

  // Créer quelques contrats de démonstration
  prospects
    .filter(p => p.statut === 'signe' || p.statut === 'en-negociation')
    .slice(0, 10)
    .forEach(prospect => {
      contrats.push({
        id: contratId++,
        prospect_id: prospect.id,
        prospect_nom: prospect.nom,
        numero: `CTR-2025-${String(contratId).padStart(4, '0')}`,
        titre: `Contrat de service - ${prospect.nom}`,
        date_debut: new Date().toISOString().split('T')[0],
        date_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        montant: Math.floor(Math.random() * 100000) + 10000,
        devise: 'MUR',
        statut: prospect.statut === 'signe' ? 'actif' : 'negocie',
        type: 'service',
        conditions: 'Conditions générales de vente appliquées',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    })

  global.mauritiusContrats = contrats
  global.lastContratId = contratId

  console.log(`✅ ${contrats.length} contrats initialisés`)
  return contrats
}

// GET - Récupérer les contrats
export async function GET(request: NextRequest) {
  try {
    const contrats = initializeContrats()
    const { searchParams } = new URL(request.url)
    
    const prospect_id = searchParams.get('prospect_id')
    const statut = searchParams.get('statut')
    const type = searchParams.get('type')
    
    let filtered = [...contrats]
    
    if (prospect_id) {
      filtered = filtered.filter(c => c.prospect_id === parseInt(prospect_id))
    }
    
    if (statut) {
      filtered = filtered.filter(c => c.statut === statut)
    }
    
    if (type) {
      filtered = filtered.filter(c => c.type === type)
    }
    
    // Enrichir avec les noms des prospects
    const prospects = db.getProspects()
    const enrichedContrats = filtered.map(contrat => {
      const prospect = prospects.find(p => p.id === contrat.prospect_id)
      return {
        ...contrat,
        prospect_nom: prospect?.nom || contrat.prospect_nom
      }
    })
    
    return NextResponse.json(enrichedContrats)
    
  } catch (error) {
    console.error('❌ Erreur GET /api/contrats:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des contrats' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau contrat
export async function POST(request: NextRequest) {
  try {
    const contrats = initializeContrats()
    const body = await request.json()
    
    if (!body.prospect_id || !body.titre || !body.montant) {
      return NextResponse.json(
        { error: 'Données requises: prospect_id, titre, montant' },
        { status: 400 }
      )
    }
    
    // Vérifier que le prospect existe
    const prospect = db.getProspectById(body.prospect_id)
    if (!prospect) {
      return NextResponse.json(
        { error: `Prospect ${body.prospect_id} non trouvé` },
        { status: 404 }
      )
    }
    
    const newId = (global.lastContratId || 0) + 1
    global.lastContratId = newId
    
    const newContrat: Contrat = {
      id: newId,
      prospect_id: body.prospect_id,
      prospect_nom: prospect.nom,
      numero: body.numero || `CTR-2025-${String(newId).padStart(4, '0')}`,
      titre: body.titre,
      date_debut: body.date_debut || new Date().toISOString().split('T')[0],
      date_fin: body.date_fin || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      montant: body.montant,
      devise: body.devise || 'MUR',
      statut: body.statut || 'brouillon',
      type: body.type || 'service',
      conditions: body.conditions,
      fichier_url: body.fichier_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    contrats.push(newContrat)
    
    console.log(`✅ Contrat créé: ${newContrat.numero} pour ${prospect.nom}`)
    
    return NextResponse.json(newContrat, { status: 201 })
    
  } catch (error) {
    console.error('❌ Erreur POST /api/contrats:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du contrat' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un contrat
export async function PATCH(request: NextRequest) {
  try {
    const contrats = initializeContrats()
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du contrat requis' },
        { status: 400 }
      )
    }
    
    const index = contrats.findIndex(c => c.id === id)
    if (index === -1) {
      return NextResponse.json(
        { error: `Contrat ${id} non trouvé` },
        { status: 404 }
      )
    }
    
    contrats[index] = {
      ...contrats[index],
      ...updateData,
      id: contrats[index].id,
      created_at: contrats[index].created_at,
      updated_at: new Date().toISOString()
    }
    
    console.log(`✅ Contrat ${id} mis à jour`)
    
    return NextResponse.json(contrats[index])
    
  } catch (error) {
    console.error('❌ Erreur PATCH /api/contrats:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du contrat' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un contrat
export async function DELETE(request: NextRequest) {
  try {
    const contrats = initializeContrats()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du contrat requis' },
        { status: 400 }
      )
    }
    
    const index = contrats.findIndex(c => c.id === parseInt(id))
    if (index === -1) {
      return NextResponse.json(
        { error: `Contrat ${id} non trouvé` },
        { status: 404 }
      )
    }
    
    const deleted = contrats.splice(index, 1)[0]
    
    console.log(`✅ Contrat ${id} supprimé: ${deleted.numero}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Contrat supprimé avec succès',
      id: parseInt(id)
    })
    
  } catch (error) {
    console.error('❌ Erreur DELETE /api/contrats:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du contrat' },
      { status: 500 }
    )
  }
}
