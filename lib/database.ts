// lib/database.ts
import { Prospect } from './mauritius-config'

// Stockage en mémoire pour l'environnement serveur
let inMemoryStorage: { [key: string]: any } = {
  prospects: []
}

// Détection de l'environnement
const isServer = typeof window === 'undefined'

class Database {
  private storageKey = 'mauritius_prospects_db'
  
  constructor() {
    if (!isServer) {
      // Côté client uniquement
      this.loadFromLocalStorage()
    } else {
      // Côté serveur - initialiser avec des données par défaut si nécessaire
      this.initializeServerData()
    }
  }
  
  private initializeServerData() {
    // Initialiser avec quelques données de démonstration si vide
    if (!inMemoryStorage.prospects || inMemoryStorage.prospects.length === 0) {
      inMemoryStorage.prospects = [
        {
          id: 1,
          nom: "Clinique du Nord",
          secteur: "sante",
          ville: "Port Louis",
          district: "port-louis",
          statut: "nouveau",
          contact: "Dr. Jean Martin",
          telephone: "+230 5123 4567",
          email: "contact@cliniquenord.mu",
          score: 4,
          budget: "Rs 500,000",
          notes: "Intéressé par nos solutions de gestion",
          website: "www.cliniquenord.mu",
          adresse: "123 Royal Road",
          priority: "Haute",
          quality_score: 75,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          nom: "Hotel Paradise",
          secteur: "tourisme",
          ville: "Grand Baie",
          district: "pamplemousses",
          statut: "qualifie",
          contact: "Marie Dupont",
          telephone: "+230 5234 5678",
          email: "marie@hotelparadise.mu",
          score: 5,
          budget: "Rs 1,000,000",
          notes: "Besoin urgent de modernisation",
          website: "www.hotelparadise.mu",
          adresse: "456 Coastal Road",
          priority: "Normale",
          quality_score: 85,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    }
  }
  
  private loadFromLocalStorage() {
    if (!isServer && typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(this.storageKey)
        if (stored) {
          const data = JSON.parse(stored)
          inMemoryStorage = data
        }
      } catch (error) {
        console.error('Erreur chargement localStorage:', error)
      }
    }
  }
  
  private saveToLocalStorage() {
    if (!isServer && typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(inMemoryStorage))
      } catch (error) {
        console.error('Erreur sauvegarde localStorage:', error)
      }
    }
  }
  
  // Méthodes publiques
  getProspects(): Prospect[] {
    return inMemoryStorage.prospects || []
  }
  
  getProspect(id: number): Prospect | undefined {
    const prospects = this.getProspects()
    return prospects.find(p => p.id === id)
  }
  
  createProspect(prospect: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>): Prospect {
    const prospects = this.getProspects()
    const newProspect: Prospect = {
      ...prospect,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    inMemoryStorage.prospects = [newProspect, ...prospects]
    this.saveToLocalStorage()
    
    return newProspect
  }
  
  updateProspect(id: number, updates: Partial<Prospect>): Prospect | null {
    const prospects = this.getProspects()
    const index = prospects.findIndex(p => p.id === id)
    
    if (index === -1) {
      return null
    }
    
    const updated = {
      ...prospects[index],
      ...updates,
      id: prospects[index].id, // Garder l'ID original
      created_at: prospects[index].created_at, // Garder la date de création
      updated_at: new Date().toISOString()
    }
    
    prospects[index] = updated
    inMemoryStorage.prospects = prospects
    this.saveToLocalStorage()
    
    return updated
  }
  
  deleteProspect(id: number): boolean {
    const prospects = this.getProspects()
    const filtered = prospects.filter(p => p.id !== id)
    
    if (filtered.length === prospects.length) {
      return false // Aucun prospect supprimé
    }
    
    inMemoryStorage.prospects = filtered
    this.saveToLocalStorage()
    
    return true
  }
  
  // Méthode pour importer des prospects en masse
  importProspects(newProspects: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>[]): Prospect[] {
    const prospects = this.getProspects()
    const imported = newProspects.map(p => ({
      ...p,
      id: Date.now() + Math.random(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    
    inMemoryStorage.prospects = [...imported, ...prospects]
    this.saveToLocalStorage()
    
    return imported
  }
  
  // Méthode pour réinitialiser la base de données
  reset() {
    inMemoryStorage.prospects = []
    this.saveToLocalStorage()
  }
  
  // Méthode pour obtenir des statistiques
  getStats() {
    const prospects = this.getProspects()
    return {
      total: prospects.length,
      nouveau: prospects.filter(p => p.statut === 'nouveau').length,
      qualifie: prospects.filter(p => p.statut === 'qualifie').length,
      rdv_planifie: prospects.filter(p => p.statut === 'rdv-planifie').length,
      en_negociation: prospects.filter(p => p.statut === 'en-negociation').length,
      signe: prospects.filter(p => p.statut === 'signe').length,
      perdu: prospects.filter(p => p.statut === 'perdu').length,
      par_secteur: Object.entries(
        prospects.reduce((acc, p) => {
          acc[p.secteur] = (acc[p.secteur] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      ),
      par_district: Object.entries(
        prospects.reduce((acc, p) => {
          acc[p.district] = (acc[p.district] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      )
    }
  }
}

// Instance unique (singleton)
export const db = new Database()

// Export des types pour TypeScript
export type { Prospect }
