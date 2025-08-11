// lib/rdv-database.ts

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

// Stockage en mémoire pour l'environnement serveur
let rdvStorage: { [key: string]: any } = {
  rdvs: []
}

// Détection de l'environnement
const isServer = typeof window === 'undefined'

class RDVDatabase {
  private storageKey = 'mauritius_rdvs_db'
  
  constructor() {
    if (!isServer) {
      this.loadFromLocalStorage()
    } else {
      this.initializeServerData()
    }
  }
  
  private initializeServerData() {
    if (!rdvStorage.rdvs || rdvStorage.rdvs.length === 0) {
      rdvStorage.rdvs = []
    }
  }
  
  private loadFromLocalStorage() {
    if (!isServer && typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(this.storageKey)
        if (stored) {
          const data = JSON.parse(stored)
          rdvStorage = data
        }
      } catch (error) {
        console.error('Erreur chargement localStorage RDV:', error)
      }
    }
  }
  
  private saveToLocalStorage() {
    if (!isServer && typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(rdvStorage))
      } catch (error) {
        console.error('Erreur sauvegarde localStorage RDV:', error)
      }
    }
  }
  
  getRDVs(prospect_id?: number): RDV[] {
    const rdvs = rdvStorage.rdvs || []
    if (prospect_id) {
      return rdvs.filter((r: RDV) => r.prospect_id === prospect_id)
    }
    return rdvs
  }
  
  getRDV(id: number): RDV | undefined {
    const rdvs = this.getRDVs()
    return rdvs.find(r => r.id === id)
  }
  
  createRDV(rdv: Omit<RDV, 'id' | 'created_at' | 'updated_at'>): RDV {
    const rdvs = this.getRDVs()
    const newRDV: RDV = {
      ...rdv,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    rdvStorage.rdvs = [newRDV, ...rdvs]
    this.saveToLocalStorage()
    
    return newRDV
  }
  
  updateRDV(id: number, updates: Partial<RDV>): RDV | null {
    const rdvs = this.getRDVs()
    const index = rdvs.findIndex(r => r.id === id)
    
    if (index === -1) {
      return null
    }
    
    const updated = {
      ...rdvs[index],
      ...updates,
      id: rdvs[index].id,
      created_at: rdvs[index].created_at,
      updated_at: new Date().toISOString()
    }
    
    rdvs[index] = updated
    rdvStorage.rdvs = rdvs
    this.saveToLocalStorage()
    
    return updated
  }
  
  deleteRDV(id: number): boolean {
    const rdvs = this.getRDVs()
    const filtered = rdvs.filter(r => r.id !== id)
    
    if (filtered.length === rdvs.length) {
      return false
    }
    
    rdvStorage.rdvs = filtered
    this.saveToLocalStorage()
    
    return true
  }
  
  // Supprimer tous les RDV d'un prospect
  deleteProspectRDVs(prospect_id: number): number {
    const rdvs = this.getRDVs()
    const filtered = rdvs.filter(r => r.prospect_id !== prospect_id)
    const deletedCount = rdvs.length - filtered.length
    
    rdvStorage.rdvs = filtered
    this.saveToLocalStorage()
    
    return deletedCount
  }
  
  // Obtenir les prochains RDV
  getUpcomingRDVs(limit: number = 10): RDV[] {
    const now = new Date()
    return this.getRDVs()
      .filter(r => new Date(r.date_time) >= now && r.statut !== 'annule' && r.statut !== 'termine')
      .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
      .slice(0, limit)
  }
  
  // Obtenir les RDV du jour
  getTodayRDVs(): RDV[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return this.getRDVs()
      .filter(r => {
        const rdvDate = new Date(r.date_time)
        return rdvDate >= today && rdvDate < tomorrow
      })
      .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
  }
  
  // Statistiques des RDV
  getStats() {
    const rdvs = this.getRDVs()
    const now = new Date()
    
    return {
      total: rdvs.length,
      planifie: rdvs.filter(r => r.statut === 'planifie').length,
      confirme: rdvs.filter(r => r.statut === 'confirme').length,
      termine: rdvs.filter(r => r.statut === 'termine').length,
      annule: rdvs.filter(r => r.statut === 'annule').length,
      futurs: rdvs.filter(r => new Date(r.date_time) > now && r.statut !== 'annule' && r.statut !== 'termine').length,
      passes: rdvs.filter(r => new Date(r.date_time) <= now || r.statut === 'termine').length,
      aujourdhui: this.getTodayRDVs().length,
      par_type: Object.entries(
        rdvs.reduce((acc, r) => {
          acc[r.type_visite] = (acc[r.type_visite] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      ),
      par_priorite: Object.entries(
        rdvs.reduce((acc, r) => {
          acc[r.priorite] = (acc[r.priorite] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      )
    }
  }
}

export const rdvDB = new RDVDatabase()
export type { RDV as RDVType }
