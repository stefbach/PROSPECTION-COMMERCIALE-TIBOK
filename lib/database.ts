// lib/database.ts
// MODULE PARTAGÉ POUR LA BASE DE DONNÉES MAURICE

// ===========================
// TYPES
// ===========================

export interface Prospect {
  id: number
  nom: string
  email: string
  telephone: string
  adresse: string
  ville: string
  code_postal?: string
  district?: string
  pays?: string
  secteur: string
  statut: 'nouveau' | 'contacte' | 'qualifie' | 'en-negociation' | 'signe' | 'perdu'
  notes?: string
  created_at?: string
  updated_at?: string
  contact?: string
  budget?: string
  score?: number
}

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

// ===========================
// STOCKAGE GLOBAL PARTAGÉ
// ===========================

declare global {
  var mauritiusDB: {
    prospects: Prospect[]
    rdvs: RDV[]
    lastProspectId: number
    lastRdvId: number
    initialized: boolean
  } | undefined
}

// ===========================
// DONNÉES INITIALES
// ===========================

const DISTRICTS_MAURICE = [
  'Port Louis', 'Pamplemousses', 'Rivière du Rempart', 
  'Flacq', 'Grand Port', 'Savanne', 
  'Plaines Wilhems', 'Moka', 'Rivière Noire'
]

const VILLES_MAURICE = {
  'Port Louis': ['Port Louis', 'Caudan', 'Chinatown'],
  'Plaines Wilhems': ['Curepipe', 'Phoenix', 'Vacoas', 'Quatre Bornes', 'Rose Hill'],
  'Pamplemousses': ['Pamplemousses', 'Terre Rouge', 'Arsenal', 'Triolet'],
  'Grand Port': ['Mahebourg', 'Rose Belle', 'New Grove'],
  'Rivière Noire': ['Flic en Flac', 'Tamarin', 'Le Morne', 'La Gaulette'],
  'Savanne': ['Souillac', 'Surinam', 'Chemin Grenier'],
  'Flacq': ['Centre de Flacq', 'Belle Mare', 'Poste de Flacq'],
  'Moka': ['Moka', 'Quartier Militaire', 'Saint Pierre'],
  'Rivière du Rempart': ['Grand Baie', 'Cap Malheureux', 'Poudre d\'Or']
}

const SECTEURS = [
  'hotel', 'restaurant', 'retail', 'clinique', 
  'pharmacie', 'wellness', 'spa', 'tourisme', 'autre'
]

// ===========================
// INITIALISATION
// ===========================

function initializeDatabase() {
  if (global.mauritiusDB?.initialized) {
    return
  }

  console.log('🚀 Initialisation de la base de données Maurice...')

  const prospects: Prospect[] = []
  const rdvs: RDV[] = []
  
  // Générer des prospects de démonstration
  let prospectId = 1
  const noms_hotels = ['Le Meridien', 'Sofitel', 'Hilton', 'Shangri-La', 'Four Seasons', 'St. Regis', 'Oberoi', 'LUX*', 'Beachcomber', 'Constance']
  const noms_restaurants = ['Le Capitaine', 'La Table du Château', 'Escale Créole', 'Le Pescatore', 'Château Mon Désir', 'La Clef des Champs']
  const noms_retail = ['Winners', 'Super U', 'Intermart', 'Shoprite', 'Dream Price', 'Galaxy', 'Courts']
  const noms_cliniques = ['Clinique Darné', 'Wellkin Hospital', 'C-Care', 'Clinique du Nord', 'Apollo Bramwell']
  
  // Créer des prospects
  for (const district of Object.keys(VILLES_MAURICE)) {
    const villes = VILLES_MAURICE[district as keyof typeof VILLES_MAURICE]
    
    for (let i = 0; i < Math.floor(Math.random() * 5) + 3; i++) {
      const ville = villes[Math.floor(Math.random() * villes.length)]
      const secteur = SECTEURS[Math.floor(Math.random() * SECTEURS.length)]
      
      let nom = ''
      if (secteur === 'hotel') {
        nom = noms_hotels[Math.floor(Math.random() * noms_hotels.length)] + ' ' + ville
      } else if (secteur === 'restaurant') {
        nom = noms_restaurants[Math.floor(Math.random() * noms_restaurants.length)]
      } else if (secteur === 'retail') {
        nom = noms_retail[Math.floor(Math.random() * noms_retail.length)] + ' ' + ville
      } else if (secteur === 'clinique') {
        nom = noms_cliniques[Math.floor(Math.random() * noms_cliniques.length)]
      } else {
        nom = `${secteur.charAt(0).toUpperCase() + secteur.slice(1)} ${ville} ${Math.floor(Math.random() * 100)}`
      }
      
      const statuts: Prospect['statut'][] = ['nouveau', 'contacte', 'qualifie', 'en-negociation', 'signe', 'perdu']
      const statut = statuts[Math.floor(Math.random() * statuts.length)]
      
      prospects.push({
        id: prospectId++,
        nom: nom,
        email: `contact${prospectId}@${nom.toLowerCase().replace(/\s/g, '')}.mu`,
        telephone: `+230 5${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        adresse: `${Math.floor(Math.random() * 200) + 1} Royal Road`,
        ville: ville,
        district: district,
        pays: 'Maurice',
        secteur: secteur,
        statut: statut,
        contact: ['Jean Dupont', 'Marie Laurent', 'Ahmed Hassan', 'Sophie Martin', 'Raj Patel'][Math.floor(Math.random() * 5)],
        budget: statut === 'qualifie' || statut === 'en-negociation' ? `${Math.floor(Math.random() * 100) + 20}k Rs` : undefined,
        score: Math.floor(Math.random() * 100),
        notes: Math.random() > 0.5 ? 'Client potentiel intéressant' : undefined,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }
  
  // Créer des RDV de démonstration
  let rdvId = 1
  const commerciaux = ['Karine MOMUS', 'Jean Dupont', 'Sophie Martin', 'Ahmed Hassan']
  const today = new Date()
  
  for (let dayOffset = -5; dayOffset < 25; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() + dayOffset)
    
    if (date.getDay() === 0) continue // Pas de RDV le dimanche
    
    const rdvCount = Math.floor(Math.random() * 4) + 1
    
    for (let i = 0; i < rdvCount; i++) {
      const prospect = prospects[Math.floor(Math.random() * prospects.length)]
      const hour = Math.floor(Math.random() * 9) + 8
      const minute = Math.random() > 0.5 ? 30 : 0
      
      const typeVisites: RDV['type_visite'][] = ['decouverte', 'presentation', 'negociation', 'signature', 'suivi']
      const priorites: RDV['priorite'][] = ['normale', 'haute', 'urgente']
      
      let statut: RDV['statut'] = 'planifie'
      if (dayOffset < 0) {
        statut = Math.random() > 0.3 ? 'termine' : 'annule'
      } else if (dayOffset === 0) {
        statut = Math.random() > 0.5 ? 'confirme' : 'planifie'
      }
      
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
        duree_min: [30, 45, 60, 90][Math.floor(Math.random() * 4)],
        type_visite: typeVisites[Math.floor(Math.random() * typeVisites.length)],
        priorite: priorites[Math.floor(Math.random() * priorites.length)],
        statut: statut,
        notes: Math.random() > 0.5 ? 'Discussion importante sur le projet' : undefined,
        rappel: true,
        rappel_minutes: 15,
        lieu: `${prospect.adresse}, ${prospect.ville}`,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }
  
  global.mauritiusDB = {
    prospects: prospects,
    rdvs: rdvs,
    lastProspectId: prospectId,
    lastRdvId: rdvId,
    initialized: true
  }
  
  console.log(`✅ Base de données initialisée avec ${prospects.length} prospects et ${rdvs.length} RDV`)
}

// ===========================
// API DE LA BASE DE DONNÉES
// ===========================

export class Database {
  constructor() {
    initializeDatabase()
  }
  
  // PROSPECTS
  getProspects(): Prospect[] {
    initializeDatabase()
    return global.mauritiusDB?.prospects || []
  }
  
  getProspectById(id: number): Prospect | undefined {
    initializeDatabase()
    return global.mauritiusDB?.prospects.find(p => p.id === id)
  }
  
  createProspect(data: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>): Prospect {
    initializeDatabase()
    if (!global.mauritiusDB) throw new Error('Database not initialized')
    
    const newProspect: Prospect = {
      ...data,
      id: global.mauritiusDB.lastProspectId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    global.mauritiusDB.prospects.push(newProspect)
    return newProspect
  }
  
  updateProspect(id: number, data: Partial<Prospect>): Prospect | null {
    initializeDatabase()
    if (!global.mauritiusDB) return null
    
    const index = global.mauritiusDB.prospects.findIndex(p => p.id === id)
    if (index === -1) return null
    
    global.mauritiusDB.prospects[index] = {
      ...global.mauritiusDB.prospects[index],
      ...data,
      id: id,
      updated_at: new Date().toISOString()
    }
    
    return global.mauritiusDB.prospects[index]
  }
  
  deleteProspect(id: number): boolean {
    initializeDatabase()
    if (!global.mauritiusDB) return false
    
    const index = global.mauritiusDB.prospects.findIndex(p => p.id === id)
    if (index === -1) return false
    
    global.mauritiusDB.prospects.splice(index, 1)
    return true
  }
  
  // RDV
  getRdvs(): RDV[] {
    initializeDatabase()
    return global.mauritiusDB?.rdvs || []
  }
  
  getRdvById(id: number): RDV | undefined {
    initializeDatabase()
    return global.mauritiusDB?.rdvs.find(r => r.id === id)
  }
  
  createRdv(data: Omit<RDV, 'id' | 'created_at' | 'updated_at'>): RDV {
    initializeDatabase()
    if (!global.mauritiusDB) throw new Error('Database not initialized')
    
    // Enrichir avec les données du prospect
    const prospect = this.getProspectById(data.prospect_id)
    
    const newRdv: RDV = {
      ...data,
      id: global.mauritiusDB.lastRdvId++,
      prospect_nom: prospect?.nom || data.prospect_nom,
      prospect_contact: prospect?.contact || data.prospect_contact,
      prospect_telephone: prospect?.telephone || data.prospect_telephone,
      prospect_ville: prospect?.ville || data.prospect_ville,
      prospect_district: prospect?.district || data.prospect_district,
      prospect_secteur: prospect?.secteur || data.prospect_secteur,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    global.mauritiusDB.rdvs.push(newRdv)
    return newRdv
  }
  
  updateRdv(id: number, data: Partial<RDV>): RDV | null {
    initializeDatabase()
    if (!global.mauritiusDB) return null
    
    const index = global.mauritiusDB.rdvs.findIndex(r => r.id === id)
    if (index === -1) return null
    
    global.mauritiusDB.rdvs[index] = {
      ...global.mauritiusDB.rdvs[index],
      ...data,
      id: id,
      updated_at: new Date().toISOString()
    }
    
    return global.mauritiusDB.rdvs[index]
  }
  
  deleteRdv(id: number): boolean {
    initializeDatabase()
    if (!global.mauritiusDB) return false
    
    const index = global.mauritiusDB.rdvs.findIndex(r => r.id === id)
    if (index === -1) return false
    
    global.mauritiusDB.rdvs.splice(index, 1)
    return true
  }
  
  // Méthode pour enrichir les RDV avec les infos prospects
  enrichRdvs(rdvs: RDV[]): RDV[] {
    const prospects = this.getProspects()
    
    return rdvs.map(rdv => {
      const prospect = prospects.find(p => p.id === rdv.prospect_id)
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
  }
}

// Export une instance unique
export const db = new Database()
