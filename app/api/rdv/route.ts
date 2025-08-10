// app/api/rdv/route.ts
// API pour la gestion des RDV - VERSION CORRIGÉE AVEC CONNEXION AUX PROSPECTS

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
  resultat?: {
    decision: 'positif' | 'negatif' | 'a-revoir' | 'en-attente'
    prochaine_action?: string
    date_suivi?: string
    montant_potentiel?: number
    probabilite?: number
  }
}

// Stockage global des RDV
declare global {
  var mauritiusRdvs: RDV[] | undefined
  var lastRdvId: number | undefined
}

// ===========================
// CONNEXION À L'API PROSPECTS
// ===========================

// Fonction pour obtenir les prospects depuis l'API prospects
async function getProspectsFromAPI(): Promise<any[]> {
  try {
    // Construction de l'URL absolue pour l'API prospects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const url = `${baseUrl}/api/prospects`
    
    console.log('📡 Récupération des prospects depuis:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store' // Éviter le cache pour avoir les données à jour
    })
    
    if (!response.ok) {
      console.error('❌ Erreur API prospects:', response.status)
      return []
    }
    
    const prospects = await response.json()
    console.log(`✅ ${prospects.length} prospects récupérés de l'API`)
    return prospects
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des prospects:', error)
    // Retourner des données de démonstration en cas d'erreur
    return getDemoProspects()
  }
}

// Fonction pour obtenir un prospect par ID
async function getProspectById(id: number): Promise<any> {
  const prospects = await getProspectsFromAPI()
  return prospects.find((p: any) => p.id === id)
}

// Données de démonstration en cas d'échec de connexion
function getDemoProspects(): any[] {
  return [
    {
      id: 1,
      nom: "Hotel Le Meridien",
      contact: "Jean-Marc Duval",
      telephone: "+230 5234 5678",
      email: "jm.duval@meridien.mu",
      ville: "Port Louis",
      district: "Port Louis",
      secteur: "hotel",
      statut: "qualifie",
      adresse: "Caudan Waterfront"
    },
    {
      id: 2,
      nom: "Restaurant Le Capitaine",
      contact: "Sophie Martin",
      telephone: "+230 5345 6789",
      email: "sophie@lecapitaine.mu",
      ville: "Curepipe",
      district: "Plaines Wilhems",
      secteur: "restaurant",
      statut: "en-negociation",
      adresse: "Royal Road"
    },
    {
      id: 3,
      nom: "Winners Supermarket",
      contact: "Ahmed Hassan",
      telephone: "+230 5456 7890",
      email: "ahmed@winners.mu",
      ville: "Phoenix",
      district: "Plaines Wilhems",
      secteur: "retail",
      statut: "nouveau",
      adresse: "Phoenix Mall"
    }
  ]
}

// Initialiser les RDV avec des données de démonstration
async function initializeRdvs(): Promise<RDV[]> {
  const rdvs: RDV[] = []
  const commerciaux = ['Karine MOMUS', 'Jean Dupont', 'Sophie Martin', 'Ahmed Hassan']
  
  // Récupérer les prospects depuis l'API
  const prospects = await getProspectsFromAPI()
  console.log(`🔄 Initialisation des RDV avec ${prospects.length} prospects`)
  
  if (prospects.length === 0) {
    console.warn('⚠️ Aucun prospect disponible pour créer des RDV de démonstration')
    return []
  }
  
  const today = new Date()
  let rdvId = 1
  
  // Créer des RDV pour les 30 prochains jours
  for (let dayOffset = -5; dayOffset < 25; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() + dayOffset)
    
    // Pas de RDV le dimanche
    if (date.getDay() === 0) continue
    
    // Nombre aléatoire de RDV par jour (1-4)
    const rdvCount = Math.floor(Math.random() * 4) + 1
    
    for (let i = 0; i < rdvCount; i++) {
      const prospect = prospects[Math.floor(Math.random() * Math.min(prospects.length, 20))]
      if (!prospect) continue
      
      const hour = Math.floor(Math.random() * 9) + 8 // Entre 8h et 17h
      const minute = Math.random() > 0.5 ? 30 : 0
      
      const typeVisites: RDV['type_visite'][] = ['decouverte', 'presentation', 'negociation', 'signature', 'suivi']
      const priorites: RDV['priorite'][] = ['normale', 'haute', 'urgente']
      
      // Statuts selon la date
      let statut: RDV['statut'] = 'planifie'
      if (dayOffset < -1) {
        statut = Math.random() > 0.3 ? 'termine' : 'annule'
      } else if (dayOffset === 0) {
        const hour_now = new Date().getHours()
        if (hour < hour_now) {
          statut = 'termine'
        } else if (hour === hour_now) {
          statut = 'en-cours'
        } else {
          statut = Math.random() > 0.5 ? 'confirme' : 'planifie'
        }
      } else {
        statut = Math.random() > 0.6 ? 'confirme' : 'planifie'
      }
      
      rdvs.push({
        id: rdvId++,
        prospect_id: prospect.id,
        prospect_nom: prospect.nom,
        prospect_contact: prospect.contact || '',
        prospect_telephone: prospect.telephone || '',
        prospect_ville: prospect.ville || '',
        prospect_district: prospect.district || '',
        prospect_secteur: prospect.secteur || '',
        commercial: commerciaux[Math.floor(Math.random() * commerciaux.length)],
        titre: `RDV - ${prospect.nom}`,
        date_time: `${date.toISOString().split('T')[0]}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`,
        duree_min: [30, 45, 60, 90, 120][Math.floor(Math.random() * 5)],
        type_visite: typeVisites[Math.floor(Math.random() * typeVisites.length)],
        priorite: priorites[Math.floor(Math.random() * priorites.length)],
        statut: statut,
        notes: Math.random() > 0.5 ? `Discussion sur ${prospect.secteur || 'le projet'}. ${
          prospect.statut === 'qualifie' ? 'Client très intéressé.' : 
          prospect.statut === 'en-negociation' ? 'Négociation en cours.' : 
          'Premier contact à établir.'
        }` : undefined,
        rappel: Math.random() > 0.3,
        rappel_minutes: Math.random() > 0.5 ? 15 : 30,
        lieu: prospect.adresse || `${prospect.ville || 'Maurice'}, ${prospect.district || ''}`,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }
  
  console.log(`✅ ${rdvs.length} RDV de démonstration créés`)
  return rdvs
}

// Fonction pour obtenir les RDV
async function getRdvs(): Promise<RDV[]> {
  if (!global.mauritiusRdvs) {
    console.log('🚀 Initialisation des RDV...')
    global.mauritiusRdvs = await initializeRdvs()
    global.lastRdvId = global.mauritiusRdvs.length
    console.log(`✅ ${global.mauritiusRdvs.length} RDV initialisés`)
  }
  return global.mauritiusRdvs
}

// ===========================
// ENDPOINTS API
// ===========================

// GET - Récupérer les RDV avec filtres
export async function GET(request: NextRequest) {
  try {
    const rdvs = await getRdvs()
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
    
    // Enrichir les RDV avec les données prospects actualisées
    const prospects = await getProspectsFromAPI()
    const enrichedRdvs = filtered.map(rdv => {
      const prospect = prospects.find((p: any) => p.id === rdv.prospect_id)
      if (prospect) {
        return {
          ...rdv,
          prospect_nom: prospect.nom,
          prospect_contact: prospect.contact || rdv.prospect_contact,
          prospect_telephone: prospect.telephone || rdv.prospect_telephone,
          prospect_ville: prospect.ville || rdv.prospect_ville,
          prospect_district: prospect.district || rdv.prospect_district,
          prospect_secteur: prospect.secteur || rdv.prospect_secteur
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
    const rdvs = await getRdvs()
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
    const prospect = await getProspectById(body.prospect_id)
    if (!prospect) {
      console.error(`❌ Prospect ${body.prospect_id} non trouvé`)
      return NextResponse.json(
        { error: `Prospect ${body.prospect_id} non trouvé` },
        { status: 404 }
      )
    }
    
    console.log('✅ Prospect trouvé:', prospect.nom)
    
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
      console.error('❌ Conflit horaire détecté')
      return NextResponse.json(
        { error: `Conflit d'horaire avec un autre RDV à ${conflict.date_time}` },
        { status: 409 }
      )
    }
    
    // Créer le nouveau RDV
    const newId = (global.lastRdvId || 0) + 1
    global.lastRdvId = newId
    
    const newRdv: RDV = {
      id: newId,
      prospect_id: body.prospect_id,
      prospect_nom: prospect.nom,
      prospect_contact: prospect.contact || '',
      prospect_telephone: prospect.telephone || '',
      prospect_ville: prospect.ville || '',
      prospect_district: prospect.district || '',
      prospect_secteur: prospect.secteur || '',
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    rdvs.push(newRdv)
    
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
    const rdvs = await getRdvs()
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
    
    const index = rdvs.findIndex(r => r.id === id)
    if (index === -1) {
      console.error(`❌ RDV ${id} non trouvé`)
      return NextResponse.json(
        { error: `RDV ${id} non trouvé` },
        { status: 404 }
      )
    }
    
    // Si on met à jour le prospect_id, récupérer les infos du nouveau prospect
    if (updateData.prospect_id && updateData.prospect_id !== rdvs[index].prospect_id) {
      const prospect = await getProspectById(updateData.prospect_id)
      if (prospect) {
        updateData.prospect_nom = prospect.nom
        updateData.prospect_contact = prospect.contact || ''
        updateData.prospect_telephone = prospect.telephone || ''
        updateData.prospect_ville = prospect.ville || ''
        updateData.prospect_district = prospect.district || ''
        updateData.prospect_secteur = prospect.secteur || ''
      }
    }
    
    rdvs[index] = {
      ...rdvs[index],
      ...updateData,
      id: rdvs[index].id,
      created_at: rdvs[index].created_at,
      updated_at: new Date().toISOString()
    }
    
    console.log(`✅ RDV ${id} mis à jour avec succès`)
    
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
    const rdvs = await getRdvs()
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
      console.error(`❌ RDV ${id} non trouvé`)
      return NextResponse.json(
        { error: `RDV ${id} non trouvé` },
        { status: 404 }
      )
    }
    
    const deleted = rdvs.splice(index, 1)[0]
    
    console.log(`✅ RDV ${id} supprimé avec succès`)
    console.log(`  Titre: ${deleted.titre}`)
    console.log(`  Date: ${deleted.date_time}`)
    
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
