// app/api/rdv/route.ts
// API RDV UTILISANT LA BASE DE DONNÉES PARTAGÉE

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

// GET - Récupérer les RDV avec filtres
export async function GET(request: NextRequest) {
  try {
    const rdvs = db.getRdvs()
    const { searchParams } = new URL(request.url)
    
    const commercial = searchParams.get('commercial')
    const prospect_id = searchParams.get('prospect_id')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const statut = searchParams.get('statut')
    const type_visite = searchParams.get('type_visite')
    const priorite = searchParams.get('priorite')
    const district = searchParams.get('district')
    
    console.log(`📅 GET /rdv - Total: ${rdvs.length} RDV`)
    
    let filtered = [...rdvs]
    
    if (commercial) {
      filtered = filtered.filter(r => r.commercial === commercial)
      console.log(`  Filtre commercial: ${commercial} → ${filtered.length} RDV`)
    }
    
    if (prospect_id) {
      filtered = filtered.filter(r => r.prospect_id === parseInt(prospect_id))
      console.log(`  Filtre prospect: ${prospect_id} → ${filtered.length} RDV`)
    }
    
    if (date_from) {
      filtered = filtered.filter(r => new Date(r.date_time) >= new Date(date_from))
      console.log(`  Filtre date début: ${date_from} → ${filtered.length} RDV`)
    }
    
    if (date_to) {
      filtered = filtered.filter(r => new Date(r.date_time) <= new Date(date_to))
      console.log(`  Filtre date fin: ${date_to} → ${filtered.length} RDV`)
    }
    
    if (statut) {
      filtered = filtered.filter(r => r.statut === statut)
      console.log(`  Filtre statut: ${statut} → ${filtered.length} RDV`)
    }
    
    if (type_visite) {
      filtered = filtered.filter(r => r.type_visite === type_visite)
    }
    
    if (priorite) {
      filtered = filtered.filter(r => r.priorite === priorite)
    }
    
    if (district) {
      filtered = filtered.filter(r => r.prospect_district === district)
    }
    
    // Enrichir les RDV avec les données prospects actuelles
    const enrichedRdvs = db.enrichRdvs(filtered)
    
    // Trier par date
    enrichedRdvs.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
    
    console.log(`✅ Résultat: ${enrichedRdvs.length} RDV retournés`)
    
    return NextResponse.json(enrichedRdvs)
    
  } catch (error) {
    console.error('❌ Erreur GET /api/rdv:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des RDV' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau RDV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📝 POST /rdv - Nouveau RDV')
    console.log('  Données reçues:', body)
    
    // Validation des champs requis
    if (!body.prospect_id || !body.commercial || !body.date_time) {
      console.error('❌ Champs manquants:', {
        prospect_id: body.prospect_id,
        commercial: body.commercial,
        date_time: body.date_time
      })
      return NextResponse.json(
        { error: 'Données requises: prospect_id, commercial, date_time' },
        { status: 400 }
      )
    }
    
    // Vérifier que le prospect existe
    const prospect = db.getProspectById(body.prospect_id)
    if (!prospect) {
      console.error(`❌ Prospect ${body.prospect_id} non trouvé`)
      return NextResponse.json(
        { error: `Prospect ${body.prospect_id} non trouvé` },
        { status: 404 }
      )
    }
    
    console.log('✅ Prospect trouvé:', prospect.nom)
    
    // Vérifier les conflits d'horaire
    const rdvs = db.getRdvs()
    const newDateTime = new Date(body.date_time)
    const newEndTime = new Date(newDateTime.getTime() + (body.duree_min || 60) * 60000)
    
    const conflict = rdvs.find(rdv => {
      if (rdv.commercial !== body.commercial) return false
      if (rdv.statut === 'annule') return false
      
      const rdvStart = new Date(rdv.date_time)
      const rdvEnd = new Date(rdvStart.getTime() + rdv.duree_min * 60000)
      
      return (newDateTime >= rdvStart && newDateTime < rdvEnd) ||
             (newEndTime > rdvStart && newEndTime <= rdvEnd) ||
             (newDateTime <= rdvStart && newEndTime >= rdvEnd)
    })
    
    if (conflict) {
      console.error('❌ Conflit horaire détecté avec RDV:', conflict.id)
      return NextResponse.json(
        { 
          error: `Conflit d'horaire avec un autre RDV`,
          conflict: {
            id: conflict.id,
            titre: conflict.titre,
            date_time: conflict.date_time
          }
        },
        { status: 409 }
      )
    }
    
    // Créer le nouveau RDV
    const newRdv = db.createRdv({
      prospect_id: body.prospect_id,
      commercial: body.commercial,
      titre: body.titre || `RDV - ${prospect.nom}`,
      date_time: body.date_time,
      duree_min: body.duree_min || 60,
      type_visite: body.type_visite || 'decouverte',
      priorite: body.priorite || 'normale',
      statut: body.statut || 'planifie',
      notes: body.notes,
      rappel: body.rappel !== undefined ? body.rappel : true,
      rappel_minutes: body.rappel_minutes || 15,
      lieu: body.lieu || `${prospect.ville || 'Maurice'}, ${prospect.district || ''}`,
      prospect_nom: prospect.nom,
      prospect_contact: prospect.contact,
      prospect_telephone: prospect.telephone,
      prospect_ville: prospect.ville,
      prospect_district: prospect.district,
      prospect_secteur: prospect.secteur
    })
    
    console.log(`✅ RDV créé avec succès:`)
    console.log(`  ID: ${newRdv.id}`)
    console.log(`  Prospect: ${newRdv.prospect_nom}`)
    console.log(`  Date: ${newRdv.date_time}`)
    console.log(`  Commercial: ${newRdv.commercial}`)
    
    return NextResponse.json(newRdv, { status: 201 })
    
  } catch (error) {
    console.error('❌ Erreur POST /api/rdv:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du RDV' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un RDV
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    console.log(`📝 PATCH /rdv/${id}`)
    console.log('  Données de mise à jour:', updateData)
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du RDV requis' },
        { status: 400 }
      )
    }
    
    // Si on met à jour le prospect_id, récupérer les infos du nouveau prospect
    if (updateData.prospect_id) {
      const prospect = db.getProspectById(updateData.prospect_id)
      if (prospect) {
        updateData.prospect_nom = prospect.nom
        updateData.prospect_contact = prospect.contact
        updateData.prospect_telephone = prospect.telephone
        updateData.prospect_ville = prospect.ville
        updateData.prospect_district = prospect.district
        updateData.prospect_secteur = prospect.secteur
      }
    }
    
    const updatedRdv = db.updateRdv(id, updateData)
    
    if (!updatedRdv) {
      console.error(`❌ RDV ${id} non trouvé`)
      return NextResponse.json(
        { error: `RDV ${id} non trouvé` },
        { status: 404 }
      )
    }
    
    console.log(`✅ RDV ${id} mis à jour avec succès`)
    
    return NextResponse.json(updatedRdv)
    
  } catch (error) {
    console.error('❌ Erreur PATCH /api/rdv:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du RDV' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un RDV
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    console.log(`🗑️ DELETE /rdv?id=${id}`)
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du RDV requis' },
        { status: 400 }
      )
    }
    
    const rdv = db.getRdvById(parseInt(id))
    if (!rdv) {
      console.error(`❌ RDV ${id} non trouvé`)
      return NextResponse.json(
        { error: `RDV ${id} non trouvé` },
        { status: 404 }
      )
    }
    
    const deleted = db.deleteRdv(parseInt(id))
    
    console.log(`✅ RDV ${id} supprimé avec succès`)
    console.log(`  Titre: ${rdv.titre}`)
    console.log(`  Date: ${rdv.date_time}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'RDV supprimé avec succès',
      id: parseInt(id)
    })
    
  } catch (error) {
    console.error('❌ Erreur DELETE /api/rdv:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du RDV' },
      { status: 500 }
    )
  }
}

// OPTIONS - Pour CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
