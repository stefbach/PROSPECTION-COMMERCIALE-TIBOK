// lib/rdv-database.ts
// VERSION SIMPLE - Gestion des RDV avec Supabase

import { createClient } from '@supabase/supabase-js'

// Type RDV
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

// Connexion Supabase (réutiliser la même)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

class RDVDatabase {
  
  // Récupérer tous les RDV (ou ceux d'un prospect)
  async getRDVs(prospect_id?: number): Promise<RDV[]> {
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
  }
  
  // Récupérer un RDV par ID
  async getRDV(id: number): Promise<RDV | undefined> {
    const { data, error } = await supabase
      .from('rdvs')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Erreur:', error)
      return undefined
    }
    
    return data
  }
  
  // Créer un RDV
  async createRDV(rdv: Omit<RDV, 'id' | 'created_at' | 'updated_at'>): Promise<RDV> {
    const { data, error } = await supabase
      .from('rdvs')
      .insert([{
        ...rdv,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Erreur création RDV:', error)
      throw error
    }
    
    return data
  }
  
  // Mettre à jour un RDV
  async updateRDV(id: number, updates: Partial<RDV>): Promise<RDV | null> {
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
  }
  
  // Supprimer un RDV
  async deleteRDV(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('rdvs')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Erreur suppression RDV:', error)
      return false
    }
    
    return true
  }
  
  // Supprimer tous les RDV d'un prospect
  async deleteProspectRDVs(prospect_id: number): Promise<number> {
    // Compter d'abord
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
  }
  
  // RDV à venir
  async getUpcomingRDVs(limit: number = 10): Promise<RDV[]> {
    const now = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('rdvs')
      .select('*')
      .gte('date_time', now)
      .in('statut', ['planifie', 'confirme'])
      .order('date_time', { ascending: true })
      .limit(limit)
    
    if (error) {
      console.error('Erreur:', error)
      return []
    }
    
    return data || []
  }
  
  // RDV du jour
  async getTodayRDVs(): Promise<RDV[]> {
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
      console.error('Erreur:', error)
      return []
    }
    
    return data || []
  }
  
  // Statistiques
  async getStats() {
    const { data } = await supabase
      .from('rdvs')
      .select('statut, date_time')
    
    const rdvs = data || []
    const now = new Date()
    
    return {
      total: rdvs.length,
      planifie: rdvs.filter(r => r.statut === 'planifie').length,
      confirme: rdvs.filter(r => r.statut === 'confirme').length,
      termine: rdvs.filter(r => r.statut === 'termine').length,
      annule: rdvs.filter(r => r.statut === 'annule').length,
      futurs: rdvs.filter(r => new Date(r.date_time) > now).length,
      passes: rdvs.filter(r => new Date(r.date_time) <= now).length,
      aujourdhui: 0
    }
  }
  
  reset() {
    console.warn('Reset non disponible avec Supabase')
  }
}

// Exporter l'instance
export const rdvDB = new RDVDatabase()
export type { RDV as RDVType }
