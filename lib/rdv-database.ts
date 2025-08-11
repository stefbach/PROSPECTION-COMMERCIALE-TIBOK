// lib/rdv-database.ts
// MODULE HYBRIDE RDV : SUPABASE + BASE EN MÉMOIRE

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
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (url && key) {
    supabaseClient = createClient(url, key)
    return supabaseClient
  }
  
  return null
}

// Utiliser le stockage global de database.ts
declare global {
  var mauritiusDB: {
    prospects: any[]
    rdvs: RDV[]
    lastProspectId: number
    lastRdvId: number
    initialized: boolean
  } | undefined
}

class RDVDatabase {
  private supabase: ReturnType<typeof createClient> | null
  private useSupabase: boolean = false
  
  constructor() {
    this.supabase = getSupabaseClient()
    this.useSupabase = !!this.supabase
    
    if (!this.useSupabase && !global.mauritiusDB) {
      // Initialiser la base mémoire si nécessaire
      global.mauritiusDB = {
        prospects: [],
        rdvs: [],
        lastProspectId: 1,
        lastRdvId: 1,
        initialized: true
      }
    }
  }
  
  async getRDVs(prospect_id?: number): Promise<RDV[]> {
    if (this.useSupabase && this.supabase) {
      try {
        let query = this.supabase.from('rdvs').select('*')
        
        if (prospect_id) {
          query = query.eq('prospect_id', prospect_id)
        }
        
        const { data, error } = await query.order('date_time', { ascending: true })
        
        if (error) {
          console.error('Erreur Supabase RDV:', error)
          // Fallback sur la base mémoire
          const rdvs = global.mauritiusDB?.rdvs || []
          return prospect_id ? rdvs.filter(r => r.prospect_id === prospect_id) : rdvs
        }
        
        return data || []
      } catch (error) {
        console.error('Erreur connexion Supabase:', error)
        const rdvs = global.mauritiusDB?.rdvs || []
        return prospect_id ? rdvs.filter(r => r.prospect_id === prospect_id) : rdvs
      }
    }
    
    const rdvs = global.mauritiusDB?.rdvs || []
    return prospect_id ? rdvs.filter(r => r.prospect_id === prospect_id) : rdvs
  }
  
  async getRDV(id: number): Promise<RDV | undefined> {
    if (this.useSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('rdvs')
          .select('*')
          .eq('id', id)
          .single()
        
        if (error) {
          console.error('Erreur récupération RDV:', error)
          return global.mauritiusDB?.rdvs.find(r => r.id === id)
        }
        
        return data
      } catch (error) {
        console.error('Erreur:', error)
        return global.mauritiusDB?.rdvs.find(r => r.id === id)
      }
    }
    
    return global.mauritiusDB?.rdvs.find(r => r.id === id)
  }
  
  async createRDV(rdv: Omit<RDV, 'id' | 'created_at' | 'updated_at'>): Promise<RDV> {
    const newRDV = {
      ...rdv,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (this.useSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('rdvs')
          .insert([newRDV])
          .select()
          .single()
        
        if (error) {
          console.error('Erreur création RDV Supabase:', error)
          throw error
        }
        
        return data
      } catch (error) {
        console.error('Erreur:', error)
        // Fallback sur la base mémoire
        if (!global.mauritiusDB) throw new Error('Database not initialized')
        
        const rdvWithId: RDV = {
          ...newRDV,
          id: global.mauritiusDB.lastRdvId++
        }
        
        global.mauritiusDB.rdvs.push(rdvWithId)
        return rdvWithId
      }
    }
    
    if (!global.mauritiusDB) throw new Error('Database not initialized')
    
    const rdvWithId: RDV = {
      ...newRDV,
      id: global.mauritiusDB.lastRdvId++
    }
    
    global.mauritiusDB.rdvs.push(rdvWithId)
    return rdvWithId
  }
  
  async updateRDV(id: number, updates: Partial<RDV>): Promise<RDV | null> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    if (this.useSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('rdvs')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()
        
        if (error) {
          console.error('Erreur mise à jour RDV:', error)
          return null
        }
        
        return data
      } catch (error) {
        console.error('Erreur:', error)
        // Fallback sur la base mémoire
        if (!global.mauritiusDB) return null
        
        const index = global.mauritiusDB.rdvs.findIndex(r => r.id === id)
        if (index === -1) return null
        
        global.mauritiusDB.rdvs[index] = {
          ...global.mauritiusDB.rdvs[index],
          ...updateData,
          id: id
        }
        
        return global.mauritiusDB.rdvs[index]
      }
    }
    
    if (!global.mauritiusDB) return null
    
    const index = global.mauritiusDB.rdvs.findIndex(r => r.id === id)
    if (index === -1) return null
    
    global.mauritiusDB.rdvs[index] = {
      ...global.mauritiusDB.rdvs[index],
      ...updateData,
      id: id
    }
    
    return global.mauritiusDB.rdvs[index]
  }
  
  async deleteRDV(id: number): Promise<boolean> {
    if (this.useSupabase && this.supabase) {
      try {
        const { error } = await this.supabase
          .from('rdvs')
          .delete()
          .eq('id', id)
        
        if (error) {
          console.error('Erreur suppression RDV:', error)
          return false
        }
        
        return true
      } catch (error) {
        console.error('Erreur:', error)
        // Fallback sur la base mémoire
        if (!global.mauritiusDB) return false
        
        const index = global.mauritiusDB.rdvs.findIndex(r => r.id === id)
        if (index === -1) return false
        
        global.mauritiusDB.rdvs.splice(index, 1)
        return true
      }
    }
    
    if (!global.mauritiusDB) return false
    
    const index = global.mauritiusDB.rdvs.findIndex(r => r.id === id)
    if (index === -1) return false
    
    global.mauritiusDB.rdvs.splice(index, 1)
    return true
  }
  
  async deleteProspectRDVs(prospect_id: number): Promise<number> {
    if (this.useSupabase && this.supabase) {
      try {
        // D'abord compter
        const { count } = await this.supabase
          .from('rdvs')
          .select('*', { count: 'exact', head: true })
          .eq('prospect_id', prospect_id)
        
        // Puis supprimer
        const { error } = await this.supabase
          .from('rdvs')
          .delete()
          .eq('prospect_id', prospect_id)
        
        if (error) {
          console.error('Erreur suppression RDV prospect:', error)
          return 0
        }
        
        return count || 0
      } catch (error) {
        console.error('Erreur:', error)
        // Fallback
        if (!global.mauritiusDB) return 0
        
        const initialLength = global.mauritiusDB.rdvs.length
        global.mauritiusDB.rdvs = global.mauritiusDB.rdvs.filter(r => r.prospect_id !== prospect_id)
        return initialLength - global.mauritiusDB.rdvs.length
      }
    }
    
    if (!global.mauritiusDB) return 0
    
    const initialLength = global.mauritiusDB.rdvs.length
    global.mauritiusDB.rdvs = global.mauritiusDB.rdvs.filter(r => r.prospect_id !== prospect_id)
    return initialLength - global.mauritiusDB.rdvs.length
  }
  
  async getUpcomingRDVs(limit: number = 10): Promise<RDV[]> {
    const rdvs = await this.getRDVs()
    const now = new Date()
    
    return rdvs
      .filter(r => new Date(r.date_time) >= now && r.statut !== 'annule' && r.statut !== 'termine')
      .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
      .slice(0, limit)
  }
  
  async getTodayRDVs(): Promise<RDV[]> {
    const rdvs = await this.getRDVs()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return rdvs
      .filter(r => {
        const rdvDate = new Date(r.date_time)
        return rdvDate >= today && rdvDate < tomorrow
      })
      .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
  }
  
  async getStats() {
    const rdvs = await this.getRDVs()
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
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
  }
  
  reset() {
    if (this.useSupabase) {
      console.warn('⚠️ Reset non implémenté pour Supabase par sécurité')
      return
    }
    
    if (global.mauritiusDB) {
      global.mauritiusDB.rdvs = []
      global.mauritiusDB.lastRdvId = 1
    }
  }
}

// Export de l'instance unique
export const rdvDB = new RDVDatabase()

// Export des types
export type { RDV as RDVType }
