// lib/database.ts
import { Prospect } from './mauritius-config'
import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey)

class Database {
  // Récupérer tous les prospects
  async getProspects(): Promise<Prospect[]> {
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Erreur récupération prospects:', error)
        return []
      }
      
      console.log(`✅ ${data?.length || 0} prospects chargés depuis Supabase`)
      return data || []
    } catch (error) {
      console.error('Erreur Supabase:', error)
      return []
    }
  }
  
  // Récupérer un prospect par ID
  async getProspect(id: number): Promise<Prospect | undefined> {
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Erreur récupération prospect:', error)
        return undefined
      }
      
      return data
    } catch (error) {
      console.error('Erreur Supabase:', error)
      return undefined
    }
  }
  
  // Créer un nouveau prospect
  async createProspect(prospect: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>): Promise<Prospect> {
    try {
      const newProspect = {
        ...prospect,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('prospects')
        .insert([newProspect])
        .select()
        .single()
      
      if (error) {
        console.error('Erreur création prospect:', error)
        throw error
      }
      
      console.log('✅ Prospect créé dans Supabase')
      return data
    } catch (error) {
      console.error('Erreur création:', error)
      throw error
    }
  }
  
  // Mettre à jour un prospect
  async updateProspect(id: number, updates: Partial<Prospect>): Promise<Prospect | null> {
    try {
      const { data, error } = await supabase
        .from('prospects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Erreur mise à jour prospect:', error)
        return null
      }
      
      console.log('✅ Prospect mis à jour dans Supabase')
      return data
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      return null
    }
  }
  
  // Supprimer un prospect
  async deleteProspect(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('prospects')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Erreur suppression prospect:', error)
        return false
      }
      
      console.log('✅ Prospect supprimé de Supabase')
      return true
    } catch (error) {
      console.error('Erreur suppression:', error)
      return false
    }
  }
  
  // Import en masse
  async importProspects(newProspects: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>[]): Promise<Prospect[]> {
    try {
      const toImport = newProspects.map(p => ({
        ...p,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      const { data, error } = await supabase
        .from('prospects')
        .insert(toImport)
        .select()
      
      if (error) {
        console.error('Erreur import prospects:', error)
        throw error
      }
      
      console.log(`✅ ${data?.length || 0} prospects importés dans Supabase`)
      return data || []
    } catch (error) {
      console.error('Erreur import:', error)
      throw error
    }
  }
  
  // Statistiques
  async getStats() {
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('statut')
      
      if (error) {
        console.error('Erreur stats:', error)
        return {
          total: 0,
          nouveau: 0,
          qualifie: 0,
          'rdv-planifie': 0,
          'en-negociation': 0,
          signe: 0,
          perdu: 0
        }
      }
      
      const stats = {
        total: data?.length || 0,
        nouveau: data?.filter(p => p.statut === 'nouveau').length || 0,
        qualifie: data?.filter(p => p.statut === 'qualifie').length || 0,
        'rdv-planifie': data?.filter(p => p.statut === 'rdv-planifie').length || 0,
        'en-negociation': data?.filter(p => p.statut === 'en-negociation').length || 0,
        signe: data?.filter(p => p.statut === 'signe').length || 0,
        perdu: data?.filter(p => p.statut === 'perdu').length || 0
      }
      
      return stats
    } catch (error) {
      console.error('Erreur stats:', error)
      return {
        total: 0,
        nouveau: 0,
        qualifie: 0,
        'rdv-planifie': 0,
        'en-negociation': 0,
        signe: 0,
        perdu: 0
      }
    }
  }
  
  // Réinitialiser (attention danger!)
  async reset() {
    console.warn('⚠️ Reset non implémenté pour Supabase par sécurité')
    // Si vraiment nécessaire, décommentez :
    // const { error } = await supabase.from('prospects').delete().neq('id', 0)
  }
}

// Version synchrone pour compatibilité (wrapper)
class DatabaseSync {
  private db: Database
  private cache: Prospect[] = []
  private cacheLoaded = false
  
  constructor() {
    this.db = new Database()
    this.loadCache()
  }
  
  private async loadCache() {
    this.cache = await this.db.getProspects()
    this.cacheLoaded = true
    console.log(`📦 Cache chargé: ${this.cache.length} prospects`)
  }
  
  // Méthodes synchrones qui utilisent le cache
  getProspects(): Prospect[] {
    if (!this.cacheLoaded) {
      console.warn('⚠️ Cache pas encore chargé, retour tableau vide')
      // Recharger le cache en arrière-plan
      this.loadCache()
    }
    return [...this.cache]
  }
  
  getProspect(id: number): Prospect | undefined {
    return this.cache.find(p => p.id === id)
  }
  
  createProspect(prospect: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>): Prospect {
    // Créer temporairement avec un ID local
    const tempProspect: Prospect = {
      ...prospect,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Ajouter au cache immédiatement
    this.cache.unshift(tempProspect)
    
    // Sauvegarder dans Supabase en arrière-plan
    this.db.createProspect(prospect).then(created => {
      // Remplacer dans le cache avec le vrai ID
      const index = this.cache.findIndex(p => p.id === tempProspect.id)
      if (index !== -1) {
        this.cache[index] = created
      }
    }).catch(error => {
      // En cas d'erreur, retirer du cache
      this.cache = this.cache.filter(p => p.id !== tempProspect.id)
      console.error('Erreur création prospect:', error)
    })
    
    return tempProspect
  }
  
  updateProspect(id: number, updates: Partial<Prospect>): Prospect | null {
    const index = this.cache.findIndex(p => p.id === id)
    if (index === -1) return null
    
    // Mettre à jour le cache immédiatement
    const updated = {
      ...this.cache[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    this.cache[index] = updated
    
    // Sauvegarder dans Supabase en arrière-plan
    this.db.updateProspect(id, updates).catch(error => {
      console.error('Erreur mise à jour prospect:', error)
      // Recharger le cache en cas d'erreur
      this.loadCache()
    })
    
    return updated
  }
  
  deleteProspect(id: number): boolean {
    const index = this.cache.findIndex(p => p.id === id)
    if (index === -1) return false
    
    // Supprimer du cache immédiatement
    this.cache = this.cache.filter(p => p.id !== id)
    
    // Supprimer de Supabase en arrière-plan
    this.db.deleteProspect(id).catch(error => {
      console.error('Erreur suppression prospect:', error)
      // Recharger le cache en cas d'erreur
      this.loadCache()
    })
    
    return true
  }
  
  importProspects(newProspects: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>[]): Prospect[] {
    // Créer temporairement avec des IDs locaux
    const tempProspects = newProspects.map(p => ({
      ...p,
      id: Date.now() + Math.random(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    
    // Ajouter au cache
    this.cache = [...tempProspects, ...this.cache]
    
    // Importer dans Supabase en arrière-plan
    this.db.importProspects(newProspects).then(imported => {
      // Recharger le cache avec les vraies données
      this.loadCache()
    }).catch(error => {
      console.error('Erreur import prospects:', error)
      // Retirer du cache en cas d'erreur
      const tempIds = tempProspects.map(p => p.id)
      this.cache = this.cache.filter(p => !tempIds.includes(p.id))
    })
    
    return tempProspects
  }
  
  getStats() {
    return {
      total: this.cache.length,
      nouveau: this.cache.filter(p => p.statut === 'nouveau').length,
      qualifie: this.cache.filter(p => p.statut === 'qualifie').length,
      'rdv-planifie': this.cache.filter(p => p.statut === 'rdv-planifie').length,
      'en-negociation': this.cache.filter(p => p.statut === 'en-negociation').length,
      signe: this.cache.filter(p => p.statut === 'signe').length,
      perdu: this.cache.filter(p => p.statut === 'perdu').length
    }
  }
  
  reset() {
    this.cache = []
    console.warn('Cache vidé (Supabase non affecté)')
  }
}

// Export de l'instance
export const db = new DatabaseSync()

// Export des types
export type { Prospect }
