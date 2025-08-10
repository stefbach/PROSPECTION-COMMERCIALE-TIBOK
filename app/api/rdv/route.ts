// app/api/rdv/route.ts
// API complète pour la gestion des RDV avec les 4070 prospects mauriciens

import { NextRequest, NextResponse } from 'next/server'

// Types pour les RDV
export interface RDV {
  id: number
  prospect_id: number
  prospect_nom?: string
  prospect_contact?: string
  prospect_telephone?: string
  prospect_ville?: string
  prospect_district?: string
  prospect_secteur?: string
  commercial: string
  titre: string
  date_time: string
  duree_min: number
  type_visite: 'decouverte' | 'presentation' | 'negociation' | 'signature' | 'suivi'
  priorite: 'normale' | 'haute' | 'urgente'
  statut: 'planifie' | 'confirme' | 'en-cours' | 'termine' | 'annule' | 'reporte'
  notes?: string
  rappel?: boolean
  rappel_minutes?: number
  lieu?: string
  created_at: string
  updated_at: string
  
  // Résultats après RDV
  resultat?: {
    decision: 'positif' | 'negatif' | 'a-revoir' | 'en-attente'
    prochaine_action?: string
    date_suivi?: string
    montant_potentiel?: number
    probabilite?: number // 0-100%
  }
}

// Stockage global des RDV
declare global {
  var mauritiusRdvs: RDV[] | undefined
  var lastRdvId: number | undefined
}

// Fonction pour obtenir les prospects depuis l'API prospects
function getProspects(): any[] {
  try {
    // Accès direct aux prospects globaux depuis l'autre API
    return (global as any).mauritiusProspects || []
  } catch (error) {
    console.error('Erreur accès prospects:', error)
    return []
  }
}

// Fonction pour obtenir un prospect par ID
function getProspectById(id: number): any {
  const prospects = getProspects()
  return prospects.find((p: any) => p.id === id)
}

// Initialiser les RDV avec des données de démonstration
function initializeRdvs(): RDV[] {
  const rdvs: RDV[] = []
  const commerciaux = ['Karine MOMUS', 'Jean Dupont', 'Sophie Martin', 'Ahmed Hassan']
  const prospects = getProspects().slice(0, 100) // Prendre les 100 premiers pour la démo
  
  // Générer des RDV pour les 30 prochains jours
  const today = new Date()
  let rdvId = 1
  
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() + dayOffset)
    
    // Ignorer les weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue
    
    // 3 à 8 RDV par jour
    const rdvCount = Math.floor(Math.random() * 6) + 3
    
    for (let i = 0; i < rdvCount; i++) {
      const prospect = prospects[Math.floor(Math.random() * prospects.length)]
      if (!prospect) continue
      
      // Heures de RDV entre 8h et 18h
      const hour = Math.floor(Math.random() * 9) + 8
      const minute = Math.random() > 0.5 ? 30 : 0
      
      const typeVisites: RDV['type_visite'][] = ['decouverte', 'presentation', 'negociation', 'signature', 'suivi']
      const priorites: RDV['priorite'][] = ['normale', 'haute', 'urgente']
      const statuts: RDV['statut'][] = dayOffset < 0 ? ['termine', 'annule'] : 
                                       dayOffset === 0 ? ['planifie', 'confirme', 'en-cours'] : 
                                       ['planifie', 'confirme']
      
      rdvs.push({
        id: rdvId++,
        prospect_id: prospect.id,
        prospect_nom: prospect.nom,
        prospect_contact: prospect.contact,
        prospect_telephone: prospect.telephone,
        prospect_ville: prospect.ville,
        prospect_district: prospect.district,
        prospect_secteur: prospect.secteur,
        commercial: commerciaux[Math.floor(Math.random() * commerciaux.length)],
        titre: `RDV - ${prospect.nom}`,
        date_time: `${date.toISOString().split('T')[0]}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`,
        duree_min: [30, 45, 60, 90, 120][Math.floor(Math.random() * 5)],
        type_visite: typeVisites[Math.floor(Math.random() * typeVisites.length)],
        priorite: priorites[Math.floor(Math.random() * priorites.length)],
        statut: statuts[Math.floor(Math.random() * statuts.length)],
        notes: Math.random() > 0.5 ? `Discussion sur ${prospect.secteur}. ${
          prospect.statut === 'qualifie' ? 'Client très intéressé.' : 
          prospect.statut === 'en-negociation' ? 'Négociation en cours.' : 
          'Premier contact à établir.'
        }` : undefined,
        rappel: Math.random() > 0.5,
        rappel_minutes: Math.random() > 0.5 ? 15 : 30,
        lieu: prospect.adresse || `${prospect.ville}, ${prospect.district}`,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }
  
  return rdvs
}

// Fonction pour obtenir les RDV
function getRdvs(): RDV[] {
  if (!global.mauritiusRdvs) {
    console.log('🚀 Initialisation des RDV...')
    global.mauritiusRdvs = initializeRdvs()
    global.lastRdvId = global.mauritiusRdvs.length
    console.log(`✅ ${global.mauritiusRdvs.length} RDV initialisés`)
  }
  return global.mauritiusRdvs
}

// GET - Récupérer les RDV avec filtres
export async function GET(request: NextRequest) {
  try {
    const rdvs = getRdvs()
    const prospects = getProspects()
    const { searchParams } = new URL(request.url)
    
    // Paramètres de filtrage
    const commercial = searchParams.get('commercial')
    const prospect_id = searchParams.get('prospect_id')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const statut = searchParams.get('statut')
    const type_visite = searchParams.get('type_visite')
    const priorite = searchParams.get('priorite')
    const district = searchParams.get('district')
    
    console.log(`📅 GET /rdv - Total: ${rdvs.length} RDV`)
    
    // Filtrage
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
    
    // Enrichir avec les données prospects actuelles
    const enrichedRdvs = filtered.map(rdv => {
      const prospect = getProspectById(rdv.prospect_id)
      if (prospect) {
        return {
          ...rdv,
          prospect_nom: prospect.nom,
          prospect_contact: prospect.contact,
          prospect_telephone: prospect.telephone,
          prospect_ville: prospect.ville,
          prospect_district: prospect.district,
          prospect_secteur: prospect.secteur
        }
      }
      return rdv
    })
    
    // Trier par date
    enrichedRdvs.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
    
    console.log(`📊 Résultat: ${enrichedRdvs.length} RDV retournés`)
    
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
    const rdvs = getRdvs()
    const body = await request.json()
    
    console.log('📝 POST /rdv - Nouveau RDV')
    
    // Validation
    if (!body.prospect_id || !body.commercial || !body.date_time) {
      return NextResponse.json(
        { error: 'Données requises: prospect_id, commercial, date_time' },
        { status: 400 }
      )
    }
    
    // Récupérer les infos du prospect
    const prospect = getProspectById(body.prospect_id)
    if (!prospect) {
      return NextResponse.json(
        { error: `Prospect ${body.prospect_id} non trouvé` },
        { status: 404 }
      )
    }
    
    // Vérifier les conflits d'horaire
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
      return NextResponse.json(
        { error: `Conflit d'horaire avec un autre RDV à ${conflict.date_time}` },
        { status: 409 }
      )
    }
    
    // Créer le RDV
    const newId = (global.lastRdvId || 0) + 1
    global.lastRdvId = newId
    
    const newRdv: RDV = {
      id: newId,
      prospect_id: body.prospect_id,
      prospect_nom: prospect.nom,
      prospect_contact: prospect.contact,
      prospect_telephone: prospect.telephone,
      prospect_ville: prospect.ville,
      prospect_district: prospect.district,
      prospect_secteur: prospect.secteur,
      commercial: body.commercial,
      titre: body.titre || `RDV - ${prospect.nom}`,
      date_time: body.date_time,
      duree_min: body.duree_min || 60,
      type_visite: body.type_visite || 'decouverte',
      priorite: body.priorite || 'normale',
      statut: body.statut || 'planifie',
      notes: body.notes,
      rappel: body.rappel || true,
      rappel_minutes: body.rappel_minutes || 15,
      lieu: body.lieu || `${prospect.ville}, ${prospect.district}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    rdvs.push(newRdv)
    
    console.log(`✅ RDV créé: ${newRdv.titre} (ID: ${newRdv.id})`)
    console.log(`📅 Date: ${newRdv.date_time}, Commercial: ${newRdv.commercial}`)
    
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
    const rdvs = getRdvs()
    const body = await request.json()
    const { id, ...updateData } = body
    
    console.log(`📝 PATCH /rdv/${id}`)
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du RDV requis' },
        { status: 400 }
      )
    }
    
    const index = rdvs.findIndex(r => r.id === id)
    if (index === -1) {
      return NextResponse.json(
        { error: `RDV ${id} non trouvé` },
        { status: 404 }
      )
    }
    
    // Mettre à jour
    rdvs[index] = {
      ...rdvs[index],
      ...updateData,
      id: rdvs[index].id, // L'ID ne peut pas être modifié
      created_at: rdvs[index].created_at, // La date de création ne peut pas être modifiée
      updated_at: new Date().toISOString()
    }
    
    console.log(`✅ RDV ${id} mis à jour`)
    
    return NextResponse.json(rdvs[index])
    
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
    const rdvs = getRdvs()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    console.log(`🗑️ DELETE /rdv?id=${id}`)
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du RDV requis' },
        { status: 400 }
      )
    }
    
    const index = rdvs.findIndex(r => r.id === parseInt(id))
    if (index === -1) {
      return NextResponse.json(
        { error: `RDV ${id} non trouvé` },
        { status: 404 }
      )
    }
    
    const deleted = rdvs.splice(index, 1)[0]
    
    console.log(`✅ RDV ${id} supprimé: ${deleted.titre}`)
    
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
