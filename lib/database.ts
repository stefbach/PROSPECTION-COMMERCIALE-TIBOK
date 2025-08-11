// lib/database.ts
import { Prospect } from './mauritius-config'
import fs from 'fs'
import path from 'path'

// Détection de l'environnement
const isServer = typeof window === 'undefined'

// Structure de stockage partagée
let dataStore: {
  prospects: Prospect[]
  lastUpdated: string
} = {
  prospects: [],
  lastUpdated: new Date().toISOString()
}

class Database {
  private initialized = false
  
  constructor() {
    this.initialize()
  }
  
  private initialize() {
    if (this.initialized) return
    
    if (isServer) {
      // Côté serveur : charger depuis le fichier ou la base existante
      this.loadServerData()
    } else {
      // Côté client : charger depuis localStorage si disponible
      this.loadClientData()
    }
    
    this.initialized = true
  }
  
  private loadServerData() {
    try {
      // D'abord, essayer de charger depuis le fichier data/prospects.json s'il existe
      const dataPath = path.join(process.cwd(), 'data', 'prospects.json')
      if (fs.existsSync(dataPath)) {
        const fileContent = fs.readFileSync(dataPath, 'utf-8')
        const data = JSON.parse(fileContent)
        dataStore.prospects = data.prospects || data || []
        console.log(`✅ Base de données existante chargée: ${dataStore.prospects.length} prospects`)
        return
      }
    } catch (error) {
      console.log('Pas de fichier data/prospects.json, recherche d'autres sources...')
    }
    
    // Si pas de fichier, essayer de charger depuis un autre emplacement
    // ou initialiser avec un tableau vide
    try {
      // Vérifier s'il y a un fichier de base de données dans un autre format
      const altPaths = [
        path.join(process.cwd(), 'database.json'),
        path.join(process.cwd(), 'db.json'),
        path.join(process.cwd(), '.data', 'prospects.json')
      ]
      
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          const fileContent = fs.readFileSync(altPath, 'utf-8')
          const data = JSON.parse(fileContent)
          dataStore.prospects = data.prospects || data || []
          console.log(`✅ Base de données trouvée dans ${altPath}: ${dataStore.prospects.length} prospects`)
          return
        }
      }
    } catch (error) {
      console.error('Erreur lors de la recherche de bases alternatives:', error)
    }
    
    // Si toujours rien, initialiser vide
    dataStore.prospects = []
    console.log('⚠️ Aucune base de données existante trouvée, démarrage avec une base vide')
  }
  
  private loadClientData() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('mauritius_prospects_db')
        if (stored) {
          const data = JSON.parse(stored)
          dataStore = data
          console.log('Client: données chargées depuis localStorage')
        }
      } catch (error) {
        console.error('Erreur chargement localStorage:', error)
      }
    }
  }
  
  private saveData() {
    dataStore.lastUpdated = new Date().toISOString()
    
    if (isServer) {
      // Côté serveur : sauvegarder dans le fichier
      try {
        const dataDir = path.join(process.cwd(), 'data')
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true })
        }
        const dataPath = path.join(dataDir, 'prospects.json')
        fs.writeFileSync(dataPath, JSON.stringify(dataStore, null, 2))
      } catch (error) {
        console.error('Erreur sauvegarde serveur:', error)
      }
    } else if (typeof window !== 'undefined' && window.localStorage) {
      // Côté client : sauvegarder dans localStorage
      try {
        localStorage.setItem('mauritius_prospects_db', JSON.stringify(dataStore))
      } catch (error) {
        console.error('Erreur sauvegarde localStorage:', error)
      }
    }
  }
  
  // Méthodes publiques - compatibles avec l'ancienne API
  getProspects(): Prospect[] {
    this.initialize()
    return [...dataStore.prospects]
  }
  
  getProspect(id: number): Prospect | undefined {
    this.initialize()
    return dataStore.prospects.find(p => p.id === id)
  }
  
  createProspect(prospect: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>): Prospect {
    this.initialize()
    
    const newProspect: Prospect = {
      ...prospect,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    dataStore.prospects = [newProspect, ...dataStore.prospects]
    this.saveData()
    
    return newProspect
  }
  
  updateProspect(id: number, updates: Partial<Prospect>): Prospect | null {
    this.initialize()
    
    const index = dataStore.prospects.findIndex(p => p.id === id)
    if (index === -1) return null
    
    const updated: Prospect = {
      ...dataStore.prospects[index],
      ...updates,
      id: dataStore.prospects[index].id,
      created_at: dataStore.prospects[index].created_at,
      updated_at: new Date().toISOString()
    }
    
    dataStore.prospects[index] = updated
    this.saveData()
    
    return updated
  }
  
  deleteProspect(id: number): boolean {
    this.initialize()
    
    const initialLength = dataStore.prospects.length
    dataStore.prospects = dataStore.prospects.filter(p => p.id !== id)
    
    if (dataStore.prospects.length < initialLength) {
      this.saveData()
      return true
    }
    
    return false
  }
  
  // Import en masse
  importProspects(newProspects: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>[]): Prospect[] {
    this.initialize()
    
    const imported = newProspects.map(p => ({
      ...p,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    
    dataStore.prospects = [...imported, ...dataStore.prospects]
    this.saveData()
    
    return imported
  }
  
  // Générer un ID unique
  private generateId(): number {
    const maxId = dataStore.prospects.reduce((max, p) => Math.max(max, p.id || 0), 0)
    return maxId + 1
  }
  
  // Réinitialiser (pour les tests)
  reset() {
    dataStore.prospects = []
    this.saveData()
  }
  
  // Statistiques
  getStats() {
    this.initialize()
    return {
      total: dataStore.prospects.length,
      nouveau: dataStore.prospects.filter(p => p.statut === 'nouveau').length,
      qualifie: dataStore.prospects.filter(p => p.statut === 'qualifie').length,
      'rdv-planifie': dataStore.prospects.filter(p => p.statut === 'rdv-planifie').length,
      'en-negociation': dataStore.prospects.filter(p => p.statut === 'en-negociation').length,
      signe: dataStore.prospects.filter(p => p.statut === 'signe').length,
      perdu: dataStore.prospects.filter(p => p.statut === 'perdu').length
    }
  }
}

// Export de l'instance unique
export const db = new Database()

// Export des types
export type { Prospect }
