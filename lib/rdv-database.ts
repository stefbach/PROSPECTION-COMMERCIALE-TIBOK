// lib/rdv-database.ts
import { createClient } from '@supabase/supabase-js'

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

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey)

class RDVDatabase {
  // Récupérer tous les RDV ou ceux d'un prospect
  async getRDVs(prospect_id?: number): Promise<RDV[]> {
    try {
      let query = supabase.from('rdvs').select('*')
      
      if (prospect_id) {
        query = query.eq('prospect_id', prospect_id)
      }
      
      const { data, error } = await query.order('date_time', { ascending: true })
      
      if (error) {
        console.error('Erreur récupération RDV:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Erreur Supabase RDV:', error)
      return []
    }
  }
  
  // Récupérer un RDV par ID
  async getRDV(id: number): Promise<RDV | undefined> {
    try {
      const { data, error } = await supabase
        .from('rdvs')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Erreur récupération RDV:', error)
        return undefined
      }
      
      return data
    } catch (error) {
      console.error('Erreur Supabase RDV:', error)
      return undefined
    }
  }
  
  // Créer un nouveau RDV
  async createRDV(rdv: Omit<RDV, 'id' | 'created_at' | 'updated_at'>): Promise<RDV> {
    try {
      const newRDV = {
        ...rdv,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('rdvs')
        .insert([newRDV])
        .select()
        .single()
      
      if (error) {
        console.error('Erreur création RDV:', error)
        throw error
      }
      
      console.log('✅ RDV créé dans Supabase')
      return data
    } catch (error) {
      console.error('Erreur création RDV:', error)
      throw error
    }
  }
  
  // Mettre à jour un RDV
  async updateRDV(id: number, updates: Partial<RDV>): Promise<RDV | null> {
    try {
      const { data, error } = await supabase
        .from('rdvs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Erreur mise à jour RDV:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Erreur mise à jour RDV:', error)
      return null
    }
  }
  
  // Supprimer un RDV
  async deleteRDV(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('rdvs')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Erreur suppression RDV:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Erreur suppression RDV:', error)
      return false
    }
  }
  
  // Supprimer tous les RDV d'un prospect
  async deleteProspectRDVs(prospect_id: number): Promise<number> {
    try {
      // D'abord compter
      const { count } = await supabase
        .from('rdvs')
        .select('*', { count: 'exact', head: true })
        .eq('prospect_id', prospect_id)
      
      // Puis supprimer
      const { error } = await supabase
        .from('rdvs')
        .delete()
        .eq('prospect_id', prospect_id)
      
      if (error) {
        console.error('Erreur suppression RDV prospect:', error)
        return 0
      }
      
      return count || 0
    } catch (error) {
      console.error('Erreur suppression RDV prospect:', error)
      return 0
    }
  }
  
  // Obtenir les prochains RDV
  async getUpcomingRDVs(limit: number = 10): Promise<RDV[]> {
    try {
      const now = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('rdvs')
        .select('*')
        .gte('date_time', now)
        .in('statut', ['planifie', 'confirme'])
        .order('date_time', { ascending: true })
        .limit(limit)
      
      if (error) {
        console.error('Erreur récupération RDV à venir:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Erreur:', error)
      return []
    }
  }
  
  // Obtenir les RDV du jour
  async getTodayRDVs(): Promise<RDV[]> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const { data, error } = await supabase
        .from('rdvs')
        .select('*')
        .gte('date_time', today.toISOString())
        .lt('date_time', tomorrow.toISOString())
        .order('date_time', { ascending: true })
      
      if (error) {
        console.error('Erreur récupération RDV du jour:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Erreur:', error)
      return []
    }
  }
  
  // Statistiques
  async getStats() {
    try {
      const { data, error } = await supabase
        .from('rdvs')
        .select('statut, date_time')
      
      if (error) {
        console.error('Erreur stats RDV:', error)
        return {
          total: 0,
          planifie: 0,
          confirme: 0,
          termine: 0,
          annule: 0,
          futurs: 0,
          passes: 0,
          aujourdhui: 0
        }
      }
      
      const now = new Date()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const rdvs = data || []
      
      return {
        total: rdvs.length,
        planifie: rdvs.filter(r => r.statut === 'planifie').length,
        confirme: rdvs.filter(r => r.statut === 'confirme').length,
        termine: rdvs.filter(r => r.statut === 'termine').length,
        annule: rdvs.filter(r => r.statut === 'annule').length,
        futurs: rdvs.filter(r => new Date(r.date_time) > now && r.statut !== 'annule' && r.statut !== 'termine').length,
        passes: rdvs.filter(r => new Date(r.date_time) <= now || r.statut === 'termine').length,
        aujourdhui: rdvs.filter(r => {
          const rdvDate = new Date(r.date_time)
          return rdvDate >= today && rdvDate < tomorrow
        }).length
      }
    } catch (error) {
      console.error('Erreur stats:', error)
      return {
        total: 0,
        planifie: 0,
        confirme: 0,
        termine: 0,
        annule: 0,
        futurs: 0,
        passes: 0,
        aujourdhui: 0
      }
    }
  }
  
  reset() {
    console.warn('⚠️ Reset non implémenté pour Supabase par sécurité')
  }
}

// Version synchrone pour compatibilité
class RDVDatabaseSync {
  private db: RDVDatabase
  private cache: RDV[] = []
  private cacheLoaded = false
  
  constructor() {
    this.db = new RDVDatabase()
    this.loadCache()
  }
  
  private async loadCache() {
    this.cache = await this.db.getRDVs()
    this.cacheLoaded = true
    console.log(`📦 Cache RDV chargé: ${this.cache.length} rendez-vous`)
  }
  
  getRDVs(prospect_id?: number): RDV[] {
    if (!this.cacheLoaded) {
      this.loadCache()
      return []
    }
    
    if (prospect_id) {
      return this.cache.filter(r => r.prospect_id === prospect_id)
    }
    return [...this.cache]
  }
  
  getRDV(id: number): RDV | undefined {
    return this.cache.find(r => r.id === id)
  }
  
  createRDV(rdv: Omit<RDV, 'id' | 'created_at' | 'updated_at'>): RDV {
    const tempRDV: RDV = {
      ...rdv,
      id: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    this.cache.unshift(tempRDV)
    
    this.db.createRDV(rdv).then(created => {
      const index = this.cache.findIndex(r => r.id === tempRDV.id)
      if (index !== -1) {
        this.cache[index] = created
      }
    }).catch(error => {
      this.cache = this.cache.filter(r => r.id !== tempRDV.id)
      console.error('Erreur création RDV:', error)
    })
    
    return tempRDV
  }
  
  updateRDV(id: number, updates: Partial<RDV>): RDV | null {
    const index = this.cache.findIndex(r => r.id === id)
    if (index === -1) return null
    
    const updated = {
      ...this.cache[index],
      ...updates,
      updated_at: new Date().toISOString()
    }
    this.cache[index] = updated
    
    this.db.updateRDV(id, updates).catch(error => {
      console.error('Erreur mise à jour RDV:', error)
      this.loadCache()
    })
    
    return updated
  }
  
  deleteRDV(id: number): boolean {
    const index = this.cache.findIndex(r => r.id === id)
    if (index === -1) return false
    
    this.cache = this.cache.filter(r => r.id !== id)
    
    this.db.deleteRDV(id).catch(error => {
      console.error('Erreur suppression RDV:', error)
      this.loadCache()
    })
    
    return true
  }
  
  deleteProspectRDVs(prospect_id: number): number {
    const count = this.cache.filter(r => r.prospect_id === prospect_id).length
    this.cache = this.cache.filter(r => r.prospect_id !== prospect_id)
    
    this.db.deleteProspectRDVs(prospect_id).catch(error => {
      console.error('Erreur suppression RDV prospect:', error)
      this.loadCache()
    })
    
    return count
  }
  
  getUpcomingRDVs(limit: number = 10): RDV[] {
    const now = new Date()
    return this.cache
      .filter(r => new Date(r.date_time) >= now && r.statut !== 'annule' && r.statut !== 'termine')
      .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
      .slice(0, limit)
  }
  
  getTodayRDVs(): RDV[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return this.cache
      .filter(r => {
        const rdvDate = new Date(r.date_time)
        return rdvDate >= today && rdvDate < tomorrow
      })
      .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
  }
  
  getStats() {
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return {
      total: this.cache.length,
      planifie: this.cache.filter(r => r.statut === 'planifie').length,
      confirme: this.cache.filter(r => r.statut === 'confirme').length,
      termine: this.cache.filter(r => r.statut === 'termine').length,
      annule: this.cache.filter(r => r.statut === 'annule').length,
      futurs: this.cache.filter(r => new Date(r.date_time) > now && r.statut !== 'annule' && r.statut !== 'termine').length,
      passes: this.cache.filter(r => new Date(r.date_time) <= now || r.statut === 'termine').length,
      aujourdhui: this.cache.filter(r => {
        const rdvDate = new Date(r.date_time)
        return rdvDate >= today && rdvDate < tomorrow
      }).length
    }
  }
  
  reset() {
    this.cache = []
    console.warn('Cache RDV vidé (Supabase non affecté)')
  }
}

// Export de l'instance
export const rdvDB = new RDVDatabaseSync()

// Export des types
export type { RDV as RDVType }
