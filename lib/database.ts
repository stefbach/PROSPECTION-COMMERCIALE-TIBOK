// lib/database.ts
// VERSION SIMPLE - Connexion Supabase pour récupérer TOUS les prospects

import { createClient } from '@supabase/supabase-js'

// Types
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
  statut: string
  notes?: string
  created_at?: string
  updated_at?: string
  contact?: string
  budget?: string
  score?: number
  website?: string
  priority?: string
  quality_score?: number
  region?: string
}

// Connexion à Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

class Database {
  
  // Récupérer TOUS les prospects (même plus de 1000)
  async getAllProspects(): Promise<Prospect[]> {
    console.log('📊 Récupération de tous les prospects...')
    
    let allProspects: Prospect[] = []
    let from = 0
    const batchSize = 1000
    let continuer = true
    
    // Récupérer par batch de 1000
    while (continuer) {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .range(from, from + batchSize - 1)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Erreur:', error)
        break
      }
      
      if (data && data.length > 0) {
        allProspects = [...allProspects, ...data]
        console.log(`✅ ${allProspects.length} prospects récupérés`)
        
        // Continuer si on a récupéré exactement 1000 (il y en a peut-être plus)
        if (data.length === batchSize) {
          from += batchSize
        } else {
          continuer = false
        }
      } else {
        continuer = false
      }
    }
    
    console.log(`✅ Total: ${allProspects.length} prospects`)
    return allProspects
  }
  
  // Version compatible avec l'ancien code
  getProspects(): Prospect[] {
    console.warn('⚠️ Utilisez getAllProspects() pour récupérer les données de Supabase')
    return []
  }
  
  // Récupérer un prospect par ID
  async getProspectById(id: number): Promise<Prospect | undefined> {
    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Erreur:', error)
      return undefined
    }
    
    return data
  }
  
  // Créer un prospect
  async createProspect(prospect: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>): Promise<Prospect> {
    const { data, error } = await supabase
      .from('prospects')
      .insert([{
        ...prospect,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Erreur création:', error)
      throw error
    }
    
    return data
  }
  
  // Mettre à jour un prospect
  async updateProspect(id: number, updates: Partial<Prospect>): Promise<Prospect | null> {
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
      console.error('Erreur mise à jour:', error)
      return null
    }
    
    return data
  }
  
  // Supprimer un prospect
  async deleteProspect(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('prospects')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Erreur suppression:', error)
      return false
    }
    
    return true
  }
  
  // Importer plusieurs prospects
  async importProspects(prospects: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>[]): Promise<Prospect[]> {
    const toImport = prospects.map(p => ({
      ...p,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    
    const { data, error } = await supabase
      .from('prospects')
      .insert(toImport)
      .select()
    
    if (error) {
      console.error('Erreur import:', error)
      throw error
    }
    
    return data || []
  }
  
  // Statistiques
  async getStats() {
    const { count: total } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true })
    
    const { count: nouveau } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'nouveau')
    
    const { count: qualifie } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'qualifie')
    
    const { count: signe } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'signe')
    
    return {
      total: total || 0,
      nouveau: nouveau || 0,
      qualifie: qualifie || 0,
      signe: signe || 0,
      'en-negociation': 0,
      'rdv-planifie': 0,
      perdu: 0
    }
  }
  
  // Réinitialiser (désactivé pour Supabase)
  reset() {
    console.warn('Reset non disponible avec Supabase')
  }
}

// Exporter une instance
export const db = new Database()
