// lib/rdv-database.ts
import fs from 'fs'
import path from 'path'

export interface RDV {
  id: number
  prospect_id: number
  prospect_nom?: string
  commercial: string
  titre: string
  date_time: string
  duree_min: number
  type_visite: 'decouverte' | 'presentation' | 'negociation' | 'signature' | 'suivi'
  priorite: 'normale' | 'haute' | 'urgente'
  statut: 'planifie' | 'confirme' | 'en-cours' | 'termine' | 'annule' | 'reporte'
  notes?: string
  lieu?: string
  created_at: string
  updated_at: string
}

// Détection de l'environnement
const isServer = typeof window === 'undefined'

// Structure de stockage partagée
let rdvStore: {
  rdvs: RDV[]
  lastUpdated: string
} = {
  rdvs: [],
  lastUpdated: new Date().toISOString()
}

class RDVDatabase {
  private initialized = false
  
  constructor() {
    this.initialize()
  }
  
  private initialize() {
    if (this.initialized) return
    
    if (isServer) {
      this.loadServerData()
    } else {
      this.loadClientData()
    }
    
    this.initialized = true
  }
  
  private loadServerData() {
    try {
      // Charger depuis le fichier data/rdvs.json s'il existe
      const dataPath = path.join(process.cwd(), 'data', 'rdvs.json')
      if (fs.existsSync(dataPath)) {
        const fileContent = fs.readFileSync(dataPath, 'utf-8')
        const data = JSON.parse(fileContent)
        rdvStore.rdvs = data.rdvs || data || []
        console.log(`✅ Base RDV chargée: ${rdvStore.rdvs.length} rendez-vous`)
        return
      }
    } catch (error) {
      console.log('Pas de fichier data/rdvs.json')
    }
    
    // Initialiser vide si pas de fichier
    rdvStore.rdvs = []
    console.log('⚠️ Base RDV initialisée vide')
  }
  
  private loadClientData() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('mauritius_rdvs_db')
        if (stored) {
          const data = JSON.parse(stored)
          rdvStore = data
        }
      } catch (error) {
        console.error('Erreur chargement localStorage RDV:', error)
      }
    }
  }
  
  private saveData() {
    rdvStore.lastUpdated = new Date().toISOString()
    
    if (isServer) {
      try {
        const dataDir = path.join(process.cwd(), 'data')
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true })
        }
        const dataPath = path.join(dataDir, 'rdvs.json')
        fs.writeFileSync(dataPath, JSON.stringify(rdvStore, null, 2))
      } catch (error) {
        console.error('Erreur sauvegarde RDV:', error)
      }
    } else if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('mauritius_rdvs_db', JSON.stringify(rdvStore))
      } catch (error) {
        console.error('Erreur sauvegarde localStorage RDV:', error)
      }
    }
  }
  
  getRDVs(prospect_id?: number): RDV[] {
    this.initialize()
    if (prospect_id) {
      return rdvStore.rdvs.filter(r => r.prospect_id === prospect_id)
    }
    return [...rdvStore.rdvs]
  }
  
  getRDV(id: number): RDV | undefined {
    this.initialize()
    return rdvStore.rdvs.find(r => r.id === id)
  }
  
  createRDV(rdv: Omit<RDV, 'id' | 'created_at' | 'updated_at'>): RDV {
    this.initialize()
    
    const newRDV: RDV = {
      ...rdv,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    rdvStore.rdvs = [newRDV, ...rdvStore.rdvs]
    this.saveData()
    
    return newRDV
  }
  
  updateRDV(id: number, updates: Partial<RDV>): RDV | null {
    this.initialize()
    
    const index = rdvStore.rdvs.findIndex(r => r.id === id)
    if (index === -1) return null
    
    const updated: RDV = {
      ...rdvStore.rdvs[index],
      ...updates,
      id: rdvStore.rdvs[index].id,
      created_at: rdvStore.rdvs[index].created_at,
      updated_at: new Date().toISOString()
    }
    
    rdvStore.rdvs[index] = updated
    this.saveData()
    
    return updated
  }
  
  deleteRDV(id: number): boolean {
    this.initialize()
    
    const initialLength = rdvStore.rdvs.length
    rdvStore.rdvs = rdvStore.rdvs.filter(r => r.id !== id)
    
    if (rdvStore.rdvs.length < initialLength) {
      this.saveData()
      return true
    }
    
    return false
  }
  
  deleteProspectRDVs(prospect_id: number): number {
    this.initialize()
    
    const initialLength = rdvStore.rdvs.length
    rdvStore.rdvs = rdvStore.rdvs.filter(r => r.prospect_id !== prospect_id)
    const deletedCount = initialLength - rdvStore.rdvs.length
    
    if (deletedCount > 0) {
      this.saveData()
    }
    
    return deletedCount
  }
  
  private generateId(): number {
    const maxId = rdvStore.rdvs.reduce((max, r) => Math.max(max, r.id || 0), 0)
    return maxId + 1
  }
  
  getUpcomingRDVs(limit: number = 10): RDV[] {
    this.initialize()
    const now = new Date()
    return rdvStore.rdvs
      .filter(r => new Date(r.date_time) >= now && r.statut !== 'annule' && r.statut !== 'termine')
      .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
      .slice(0, limit)
  }
  
  getTodayRDVs(): RDV[] {
    this.initialize()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return rdvStore.rdvs
      .filter(r => {
        const rdvDate = new Date(r.date_time)
        return rdvDate >= today && rdvDate < tomorrow
      })
      .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
  }
  
  getStats() {
    this.initialize()
    const now = new Date()
    
    return {
      total: rdvStore.rdvs.length,
      planifie: rdvStore.rdvs.filter(r => r.statut === 'planifie').length,
      confirme: rdvStore.rdvs.filter(r => r.statut === 'confirme').length,
      termine: rdvStore.rdvs.filter(r => r.statut === 'termine').length,
      annule: rdvStore.rdvs.filter(r => r.statut === 'annule').length,
      futurs: rdvStore.rdvs.filter(r => new Date(r.date_time) > now && r.statut !== 'annule' && r.statut !== 'termine').length,
      passes: rdvStore.rdvs.filter(r => new Date(r.date_time) <= now || r.statut === 'termine').length,
      aujourdhui: this.getTodayRDVs().length
    }
  }
  
  reset() {
    rdvStore.rdvs = []
    this.saveData()
  }
}

// Export de l'instance unique
export const rdvDB = new RDVDatabase()

// Export des types
export type { RDV as RDVType }
