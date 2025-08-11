// lib/database.ts
// MODULE HYBRIDE : SUPABASE + BASE EN MÉMOIRE

import { createClient } from '@supabase/supabase-js'

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
  // Ajout pour compatibilité avec mauritius-config
  website?: string
  priority?: string
  quality_score?: number
  region?: string
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
// CONFIGURATION SUPABASE
// ===========================

let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (url && key) {
    console.log('🔌 Connexion à Supabase...')
    supabaseClient = createClient(url, key)
    return supabaseClient
  }
  
  console.log('⚠️ Supabase non configuré, utilisation de la base en mémoire')
  return null
}

// ===========================
// STOCKAGE GLOBAL PARTAGÉ (FALLBACK)
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
  'pharmacie', 'wellness', 'spa', 'tourisme', 'autre',
  'sante', 'technologie', 'commerce', 'restauration', 
  'education', 'industrie', 'finance', 'energie'
]

// ===========================
// INITIALISATION BASE MÉMOIRE
// ===========================

function initializeMemoryDatabase() {
  if (global.mauritiusDB?.initialized) {
    return
  }

  console.log('🚀 Initialisation de la base de données en mémoire...')

  const prospects: Prospect[] = []
  const rdvs: RDV[] = []
  
  // Générer quelques prospects de démonstration (moins qu'avant)
  let prospectId = 1
  const noms_hotels = ['Le Meridien', 'Sofitel', 'Hilton']
  const noms_restaurants = ['Le Capitaine', 'La Table du Château']
  const noms_retail = ['Winners', 'Super U']
  const noms_cliniques = ['Clinique Darné', 'Wellkin Hospital']
  
  // Créer quelques prospects de démo
  for (const district of Object.keys(VILLES_MAURICE).slice(0, 3)) {
    const villes = VILLES_MAURICE[district as keyof typeof VILLES_MAURICE]
    
    for (let i = 0; i < 2; i++) {
      const ville = villes[Math.floor(Math.random() * villes.length)]
      const secteur = SECTEURS[Math.floor(Math.random() * SECTEURS.length)]
      
      let nom = ''
      if (secteur === 'hotel') {
        nom = noms_hotels[Math.floor(Math.random() * noms_hotels.length)] + ' ' + ville
      } else if (secteur === 'restaurant') {
        nom = noms_restaurants[Math.floor(Math.random() * noms_restaurants.length)]
      } else if (secteur === 'retail') {
        nom = noms_retail[Math.floor(Math.random() * noms_retail.length)] + ' ' + ville
      } else if (secteur === 'clinique' || secteur === 'sante') {
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
        contact: ['Jean Dupont', 'Marie Laurent', 'Ahmed Hassan'][Math.floor(Math.random() * 3)],
        budget: statut === 'qualifie' || statut === 'en-negociation' ? `${Math.floor(Math.random() * 100) + 20}k Rs` : undefined,
        score: Math.floor(Math.random() * 5) + 1,
        notes: Math.random() > 0.5 ? 'Client potentiel intéressant' : undefined,
        created_at: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }
  
  global.mauritiusDB = {
    prospects: prospects,
    rdvs: rdvs,
    lastProspectId: prospectId,
    lastRdvId: 1,
    initialized: true
  }
  
  console.log(`✅ Base mémoire initialisée avec ${prospects.length} prospects de démonstration`)
}

// ===========================
// API DE LA BASE DE DONNÉES HYBRIDE
// ===========================

export class Database {
  private supabase: ReturnType<typeof createClient> | null
  private useSupabase: boolean = false
  
  constructor() {
    this.supabase = getSupabaseClient()
    this.useSupabase = !!this.supabase
    
    if (!this.useSupabase) {
      initializeMemoryDatabase()
    }
  }
  
  // ===== PROSPECTS =====
  
  async getProspects(): Promise<Prospect[]> {
    if (this.useSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('prospects')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Erreur Supabase:', error)
          // Fallback sur la base mémoire
          initializeMemoryDatabase()
          return global.mauritiusDB?.prospects || []
        }
        
        return data || []
      } catch (error) {
        console.error('Erreur connexion Supabase:', error)
        initializeMemoryDatabase()
        return global.mauritiusDB?.prospects || []
      }
    }
    
    initializeMemoryDatabase()
    return global.mauritiusDB?.prospects || []
  }
  
  // Version synchrone pour compatibilité
  getProspectsSync(): Prospect[] {
    if (!this.useSupabase) {
      initializeMemoryDatabase()
      return global.mauritiusDB?.prospects || []
    }
    
    // Si Supabase, retourner le cache ou tableau vide
    console.warn('⚠️ getProspectsSync appelé avec Supabase actif - utilisez getProspects() à la place')
    return []
  }
  
  async getProspectById(id: number): Promise<Prospect | undefined> {
    if (this.useSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('prospects')
          .select('*')
          .eq('id', id)
          .single()
        
        if (error) {
          console.error('Erreur Supabase:', error)
          initializeMemoryDatabase()
          return global.mauritiusDB?.prospects.find(p => p.id === id)
        }
        
        return data
      } catch (error) {
        console.error('Erreur:', error)
        initializeMemoryDatabase()
        return global.mauritiusDB?.prospects.find(p => p.id === id)
      }
    }
    
    initializeMemoryDatabase()
    return global.mauritiusDB?.prospects.find(p => p.id === id)
  }
  
  // Version synchrone
  getProspect(id: number): Prospect | undefined {
    if (!this.useSupabase) {
      initializeMemoryDatabase()
      return global.mauritiusDB?.prospects.find(p => p.id === id)
    }
    
    console.warn('⚠️ getProspect synchrone avec Supabase - utilisez getProspectById() à la place')
    return undefined
  }
  
  async createProspect(data: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>): Promise<Prospect> {
    const newProspect = {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (this.useSupabase && this.supabase) {
      try {
        const { data: created, error } = await this.supabase
          .from('prospects')
          .insert([newProspect])
          .select()
          .single()
        
        if (error) {
          console.error('Erreur création Supabase:', error)
          throw error
        }
        
        return created
      } catch (error) {
        console.error('Erreur:', error)
        // Fallback sur la base mémoire
        initializeMemoryDatabase()
        if (!global.mauritiusDB) throw new Error('Database not initialized')
        
        const prospect: Prospect = {
          ...newProspect,
          id: global.mauritiusDB.lastProspectId++
        }
        
        global.mauritiusDB.prospects.push(prospect)
        return prospect
      }
    }
    
    initializeMemoryDatabase()
    if (!global.mauritiusDB) throw new Error('Database not initialized')
    
    const prospect: Prospect = {
      ...newProspect,
      id: global.mauritiusDB.lastProspectId++
    }
    
    global.mauritiusDB.prospects.push(prospect)
    return prospect
  }
  
  async updateProspect(id: number, data: Partial<Prospect>): Promise<Prospect | null> {
    const updates = {
      ...data,
      updated_at: new Date().toISOString()
    }
    
    if (this.useSupabase && this.supabase) {
      try {
        const { data: updated, error } = await this.supabase
          .from('prospects')
          .update(updates)
          .eq('id', id)
          .select()
          .single()
        
        if (error) {
          console.error('Erreur mise à jour Supabase:', error)
          return null
        }
        
        return updated
      } catch (error) {
        console.error('Erreur:', error)
        // Fallback sur la base mémoire
        initializeMemoryDatabase()
        if (!global.mauritiusDB) return null
        
        const index = global.mauritiusDB.prospects.findIndex(p => p.id === id)
        if (index === -1) return null
        
        global.mauritiusDB.prospects[index] = {
          ...global.mauritiusDB.prospects[index],
          ...updates,
          id: id
        }
        
        return global.mauritiusDB.prospects[index]
      }
    }
    
    initializeMemoryDatabase()
    if (!global.mauritiusDB) return null
    
    const index = global.mauritiusDB.prospects.findIndex(p => p.id === id)
    if (index === -1) return null
    
    global.mauritiusDB.prospects[index] = {
      ...global.mauritiusDB.prospects[index],
      ...updates,
      id: id
    }
    
    return global.mauritiusDB.prospects[index]
  }
  
  async deleteProspect(id: number): Promise<boolean> {
    if (this.useSupabase && this.supabase) {
      try {
        const { error } = await this.supabase
          .from('prospects')
          .delete()
          .eq('id', id)
        
        if (error) {
          console.error('Erreur suppression Supabase:', error)
          return false
        }
        
        return true
      } catch (error) {
        console.error('Erreur:', error)
        // Fallback sur la base mémoire
        initializeMemoryDatabase()
        if (!global.mauritiusDB) return false
        
        const index = global.mauritiusDB.prospects.findIndex(p => p.id === id)
        if (index === -1) return false
        
        global.mauritiusDB.prospects.splice(index, 1)
        return true
      }
    }
    
    initializeMemoryDatabase()
    if (!global.mauritiusDB) return false
    
    const index = global.mauritiusDB.prospects.findIndex(p => p.id === id)
    if (index === -1) return false
    
    global.mauritiusDB.prospects.splice(index, 1)
    return true
  }
  
  // Méthodes utilitaires
  async getStats() {
    const prospects = await this.getProspects()
    
    return {
      total: prospects.length,
      nouveau: prospects.filter(p => p.statut === 'nouveau').length,
      contacte: prospects.filter(p => p.statut === 'contacte').length,
      qualifie: prospects.filter(p => p.statut === 'qualifie').length,
      'en-negociation': prospects.filter(p => p.statut === 'en-negociation').length,
      signe: prospects.filter(p => p.statut === 'signe').length,
      perdu: prospects.filter(p => p.statut === 'perdu').length,
      // Pour compatibilité avec l'ancien format
      'rdv-planifie': 0
    }
  }
  
  // Import en masse
  async importProspects(newProspects: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>[]): Promise<Prospect[]> {
    const toImport = newProspects.map(p => ({
      ...p,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    
    if (this.useSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('prospects')
          .insert(toImport)
          .select()
        
        if (error) {
          console.error('Erreur import Supabase:', error)
          throw error
        }
        
        return data || []
      } catch (error) {
        console.error('Erreur import:', error)
        throw error
      }
    }
    
    // Fallback sur la base mémoire
    initializeMemoryDatabase()
    if (!global.mauritiusDB) throw new Error('Database not initialized')
    
    const imported = toImport.map(p => ({
      ...p,
      id: global.mauritiusDB!.lastProspectId++
    }))
    
    global.mauritiusDB.prospects.push(...imported)
    return imported
  }
  
  reset() {
    if (this.useSupabase) {
      console.warn('⚠️ Reset non implémenté pour Supabase par sécurité')
      return
    }
    
    if (global.mauritiusDB) {
      global.mauritiusDB.prospects = []
      global.mauritiusDB.rdvs = []
      global.mauritiusDB.lastProspectId = 1
      global.mauritiusDB.lastRdvId = 1
    }
  }
}

// Export une instance unique
export const db = new Database()
