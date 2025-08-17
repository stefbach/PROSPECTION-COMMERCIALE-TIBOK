// lib/dataStore.ts
// Système simple de persistance des données avec localStorage et cache mémoire

class DataStore {
  private cache: Map<string, any> = new Map()
  private lastFetch: Map<string, number> = new Map()
  private CACHE_DURATION = 30000 // 30 secondes

  // Sauvegarder dans localStorage et cache mémoire
  private saveToStorage(key: string, data: any) {
    try {
      // Sauvegarder dans le cache mémoire
      this.cache.set(key, data)
      this.lastFetch.set(key, Date.now())
      
      // Sauvegarder dans localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`prospectmed_${key}`, JSON.stringify(data))
        localStorage.setItem(`prospectmed_${key}_timestamp`, Date.now().toString())
      }
    } catch (error) {
      console.error(`Erreur sauvegarde ${key}:`, error)
    }
  }

  // Récupérer depuis localStorage ou cache
  private getFromStorage(key: string): any {
    // D'abord vérifier le cache mémoire
    if (this.cache.has(key)) {
      const lastFetch = this.lastFetch.get(key) || 0
      if (Date.now() - lastFetch < this.CACHE_DURATION) {
        return this.cache.get(key)
      }
    }

    // Sinon récupérer depuis localStorage
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(`prospectmed_${key}`)
        const timestamp = localStorage.getItem(`prospectmed_${key}_timestamp`)
        
        if (data && timestamp) {
          const age = Date.now() - parseInt(timestamp)
          if (age < this.CACHE_DURATION * 2) { // 1 minute pour localStorage
            const parsed = JSON.parse(data)
            this.cache.set(key, parsed)
            this.lastFetch.set(key, parseInt(timestamp))
            return parsed
          }
        }
      } catch (error) {
        console.error(`Erreur lecture ${key}:`, error)
      }
    }
    
    return null
  }

  // Prospects
  async getProspects(forceRefresh = false): Promise<any[]> {
    if (!forceRefresh) {
      const cached = this.getFromStorage('prospects')
      if (cached) return cached
    }

    try {
      const res = await fetch('/api/prospects?limit=1000', { cache: 'no-store' })
      const result = await res.json()
      const data = result.data || result || []
      const prospects = Array.isArray(data) ? data : []
      
      this.saveToStorage('prospects', prospects)
      return prospects
    } catch (error) {
      console.error('Erreur chargement prospects:', error)
      return this.getFromStorage('prospects') || []
    }
  }

  // RDV et Propositions
  async getRdvs(forceRefresh = false): Promise<{ rdvs: any[], propositions: any[] }> {
    if (!forceRefresh) {
      const cachedRdvs = this.getFromStorage('rdvs')
      const cachedProps = this.getFromStorage('propositions')
      if (cachedRdvs && cachedProps) {
        return { rdvs: cachedRdvs, propositions: cachedProps }
      }
    }

    try {
      const res = await fetch('/api/rdv?include_propositions=true', { cache: 'no-store' })
      if (!res.ok) throw new Error('Erreur chargement RDV')
      
      const data = await res.json()
      
      const propositions = data.filter((r: any) => r.statut === 'proposition')
      const rdvs = data.filter((r: any) => r.statut !== 'proposition')
      
      this.saveToStorage('rdvs', rdvs)
      this.saveToStorage('propositions', propositions)
      
      return { rdvs, propositions }
    } catch (error) {
      console.error('Erreur chargement RDV:', error)
      return {
        rdvs: this.getFromStorage('rdvs') || [],
        propositions: this.getFromStorage('propositions') || []
      }
    }
  }

  // Créer un RDV
  async createRdv(data: any): Promise<boolean> {
    try {
      const res = await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error('Erreur création RDV')
      
      // Rafraîchir le cache
      await this.getRdvs(true)
      return true
    } catch (error) {
      console.error('Erreur création RDV:', error)
      return false
    }
  }

  // Modifier un RDV
  async updateRdv(id: number, updates: any): Promise<boolean> {
    try {
      const res = await fetch('/api/rdv', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })

      if (!res.ok) throw new Error('Erreur mise à jour RDV')
      
      // Rafraîchir le cache
      await this.getRdvs(true)
      return true
    } catch (error) {
      console.error('Erreur mise à jour RDV:', error)
      return false
    }
  }

  // Supprimer un RDV
  async deleteRdv(id: number): Promise<boolean> {
    try {
      const res = await fetch(`/api/rdv?id=${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Erreur suppression RDV')
      
      // Rafraîchir le cache
      await this.getRdvs(true)
      return true
    } catch (error) {
      console.error('Erreur suppression RDV:', error)
      return false
    }
  }

  // Commercial Info
  getCommercialInfo(): any {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('planning_commercial_info')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Erreur lecture commercial info:', e)
        }
      }
    }
    
    return {
      nom: 'Karine MOMUS',
      adresse: '',
      ville: '',
      district: 'port-louis',
      telephone: '',
      email: '',
      startHour: '08:00',
      endHour: '18:00'
    }
  }

  saveCommercialInfo(info: any) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('planning_commercial_info', JSON.stringify(info))
    }
  }

  // Nettoyer le cache
  clearCache() {
    this.cache.clear()
    this.lastFetch.clear()
    
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('prospectmed_')) {
          localStorage.removeItem(key)
        }
      })
    }
  }
}

// Instance unique (singleton)
const dataStore = new DataStore()

export default dataStore
