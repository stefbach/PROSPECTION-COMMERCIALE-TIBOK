// lib/database.ts
// Base de données en mémoire pour synchroniser Prospects, RDV et Contrats

interface Prospect {
  id: number
  nom: string
  secteur: string
  ville: string
  district: string
  statut: string
  contact?: string
  telephone?: string
  email?: string
  score: number
  budget?: string
  notes?: string
  website?: string
  adresse?: string
  priority?: string
  quality_score?: number
  created_at?: string
  updated_at?: string
}

interface RDV {
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

interface Contrat {
  id: number
  prospect_id: number
  numero: string
  titre: string
  date_debut: string
  date_fin: string
  montant: number
  devise: string
  statut: 'brouillon' | 'envoye' | 'negocie' | 'signe' | 'actif' | 'termine' | 'annule'
  type: 'vente' | 'service' | 'maintenance' | 'location' | 'autre'
  conditions?: string
  fichier_url?: string
  created_at: string
  updated_at: string
}

class Database {
  private prospects: Map<number, Prospect> = new Map()
  private rdvs: Map<number, RDV> = new Map()
  private contrats: Map<number, Contrat> = new Map()
  private nextProspectId = 1
  private nextRdvId = 1
  private nextContratId = 1

  constructor() {
    // Charger les données depuis localStorage au démarrage
    this.loadFromLocalStorage()
  }

  private loadFromLocalStorage() {
    // Charger les prospects
    const savedProspects = localStorage.getItem('db_prospects')
    if (savedProspects) {
      try {
        const data = JSON.parse(savedProspects)
        data.forEach((p: Prospect) => {
          this.prospects.set(p.id, p)
          if (p.id >= this.nextProspectId) {
            this.nextProspectId = p.id + 1
          }
        })
      } catch (e) {
        console.error('Erreur chargement prospects:', e)
      }
    }

    // Charger les RDV
    const savedRdvs = localStorage.getItem('db_rdvs')
    if (savedRdvs) {
      try {
        const data = JSON.parse(savedRdvs)
        data.forEach((r: RDV) => {
          this.rdvs.set(r.id, r)
          if (r.id >= this.nextRdvId) {
            this.nextRdvId = r.id + 1
          }
        })
      } catch (e) {
        console.error('Erreur chargement RDV:', e)
      }
    }

    // Charger les contrats
    const savedContrats = localStorage.getItem('db_contrats')
    if (savedContrats) {
      try {
        const data = JSON.parse(savedContrats)
        data.forEach((c: Contrat) => {
          this.contrats.set(c.id, c)
          if (c.id >= this.nextContratId) {
            this.nextContratId = c.id + 1
          }
        })
      } catch (e) {
        console.error('Erreur chargement contrats:', e)
      }
    }

    // Si aucune donnée, créer des données de démonstration
    if (this.prospects.size === 0) {
      this.createDemoData()
    }
  }

  private saveToLocalStorage() {
    // Sauvegarder les prospects
    localStorage.setItem('db_prospects', JSON.stringify(Array.from(this.prospects.values())))
    
    // Sauvegarder les RDV
    localStorage.setItem('db_rdvs', JSON.stringify(Array.from(this.rdvs.values())))
    
    // Sauvegarder les contrats
    localStorage.setItem('db_contrats', JSON.stringify(Array.from(this.contrats.values())))
  }

  private createDemoData() {
    // Créer quelques prospects de démonstration
    const demoProspects = [
      {
        nom: "Hôtel Mauricia Beachcomber",
        secteur: "hotel",
        ville: "Grand Baie",
        district: "pamplemousses",
        statut: "qualifie",
        contact: "Jean Dupont",
        telephone: "+230 5789 1234",
        email: "contact@mauricia.mu",
        score: 4,
        budget: "50000",
        notes: "Intéressé par notre solution de gestion",
        adresse: "Royal Road, Grand Baie"
      },
      {
        nom: "Restaurant Le Château",
        secteur: "restaurant",
        ville: "Curepipe",
        district: "plaines-wilhems",
        statut: "nouveau",
        contact: "Marie Claire",
        telephone: "+230 5432 9876",
        score: 3,
        adresse: "Route Royale, Curepipe"
      },
      {
        nom: "Clinique du Nord",
        secteur: "clinique",
        ville: "Port Louis",
        district: "port-louis",
        statut: "proposition",
        contact: "Dr. Ramgoolam",
        telephone: "+230 5123 4567",
        email: "info@cliniquenord.mu",
        score: 5,
        budget: "100000",
        priority: "Haute",
        adresse: "Rue St Georges, Port Louis"
      }
    ]

    demoProspects.forEach(data => {
      this.createProspect(data)
    })

    // Créer quelques RDV de démonstration
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    this.createRdv({
      prospect_id: 1,
      commercial: "Karine MOMUS",
      titre: "RDV - Hôtel Mauricia Beachcomber",
      date_time: tomorrow.toISOString(),
      duree_min: 60,
      type_visite: 'presentation',
      priorite: 'haute',
      statut: 'confirme',
      notes: "Présentation de la solution complète",
      lieu: "Royal Road, Grand Baie"
    })

    this.createRdv({
      prospect_id: 3,
      commercial: "Karine MOMUS",
      titre: "RDV - Clinique du Nord",
      date_time: today.toISOString(),
      duree_min: 90,
      type_visite: 'negociation',
      priorite: 'urgente',
      statut: 'planifie',
      notes: "Négociation finale du contrat",
      lieu: "Rue St Georges, Port Louis"
    })
  }

  // CRUD Prospects
  getProspects(): Prospect[] {
    return Array.from(this.prospects.values())
  }

  getProspect(id: number): Prospect | undefined {
    return this.prospects.get(id)
  }

  createProspect(data: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>): Prospect {
    const prospect: Prospect = {
      ...data,
      id: this.nextProspectId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.prospects.set(prospect.id, prospect)
    this.saveToLocalStorage()
    return prospect
  }

  updateProspect(id: number, data: Partial<Prospect>): Prospect | null {
    const prospect = this.prospects.get(id)
    if (!prospect) return null
    
    const updated = {
      ...prospect,
      ...data,
      id: prospect.id, // Garder l'ID original
      updated_at: new Date().toISOString()
    }
    this.prospects.set(id, updated)
    this.saveToLocalStorage()
    return updated
  }

  deleteProspect(id: number): boolean {
    // Supprimer aussi les RDV et contrats associés
    const rdvsToDelete = Array.from(this.rdvs.values()).filter(r => r.prospect_id === id)
    rdvsToDelete.forEach(rdv => this.rdvs.delete(rdv.id))
    
    const contratsToDelete = Array.from(this.contrats.values()).filter(c => c.prospect_id === id)
    contratsToDelete.forEach(contrat => this.contrats.delete(contrat.id))
    
    const result = this.prospects.delete(id)
    this.saveToLocalStorage()
    return result
  }

  // CRUD RDV
  getRdvs(): RDV[] {
    return Array.from(this.rdvs.values())
  }

  getRdv(id: number): RDV | undefined {
    return this.rdvs.get(id)
  }

  createRdv(data: Omit<RDV, 'id' | 'created_at' | 'updated_at'>): RDV {
    const rdv: RDV = {
      ...data,
      id: this.nextRdvId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Ajouter le nom du prospect si disponible
    const prospect = this.prospects.get(data.prospect_id)
    if (prospect) {
      rdv.prospect_nom = prospect.nom
    }
    
    this.rdvs.set(rdv.id, rdv)
    this.saveToLocalStorage()
    return rdv
  }

  updateRdv(id: number, data: Partial<RDV>): RDV | null {
    const rdv = this.rdvs.get(id)
    if (!rdv) return null
    
    const updated = {
      ...rdv,
      ...data,
      id: rdv.id, // Garder l'ID original
      updated_at: new Date().toISOString()
    }
    this.rdvs.set(id, updated)
    this.saveToLocalStorage()
    return updated
  }

  deleteRdv(id: number): boolean {
    const result = this.rdvs.delete(id)
    this.saveToLocalStorage()
    return result
  }

  // Enrichir les RDV avec les données des prospects
  enrichRdvs(rdvs: RDV[]): any[] {
    return rdvs.map(rdv => {
      const prospect = this.prospects.get(rdv.prospect_id)
      return {
        ...rdv,
        prospect: prospect || null
      }
    })
  }

  // CRUD Contrats
  getContrats(): Contrat[] {
    return Array.from(this.contrats.values())
  }

  getContrat(id: number): Contrat | undefined {
    return this.contrats.get(id)
  }

  createContrat(data: Omit<Contrat, 'id' | 'created_at' | 'updated_at'>): Contrat {
    const contrat: Contrat = {
      ...data,
      id: this.nextContratId++,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.contrats.set(contrat.id, contrat)
    this.saveToLocalStorage()
    return contrat
  }

  updateContrat(id: number, data: Partial<Contrat>): Contrat | null {
    const contrat = this.contrats.get(id)
    if (!contrat) return null
    
    const updated = {
      ...contrat,
      ...data,
      id: contrat.id, // Garder l'ID original
      updated_at: new Date().toISOString()
    }
    this.contrats.set(id, updated)
    this.saveToLocalStorage()
    return updated
  }

  deleteContrat(id: number): boolean {
    const result = this.contrats.delete(id)
    this.saveToLocalStorage()
    return result
  }

  // Méthodes utilitaires
  getProspectRdvs(prospectId: number): RDV[] {
    return Array.from(this.rdvs.values()).filter(r => r.prospect_id === prospectId)
  }

  getProspectContrats(prospectId: number): Contrat[] {
    return Array.from(this.contrats.values()).filter(c => c.prospect_id === prospectId)
  }

  // Statistiques
  getStats() {
    const prospects = this.getProspects()
    const rdvs = this.getRdvs()
    const contrats = this.getContrats()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const rdvToday = rdvs.filter(r => {
      const rdvDate = new Date(r.date_time)
      return rdvDate >= today && rdvDate < tomorrow
    })
    
    const rdvUpcoming = rdvs.filter(r => {
      const rdvDate = new Date(r.date_time)
      return rdvDate >= today && r.statut !== 'annule' && r.statut !== 'termine'
    })
    
    return {
      totalProspects: prospects.length,
      totalRdvs: rdvs.length,
      rdvToday: rdvToday.length,
      rdvUpcoming: rdvUpcoming.length,
      totalContrats: contrats.length,
      contratsActifs: contrats.filter(c => c.statut === 'actif').length,
      prospectsByStatus: {
        nouveau: prospects.filter(p => p.statut === 'nouveau').length,
        contacte: prospects.filter(p => p.statut === 'contacte').length,
        qualifie: prospects.filter(p => p.statut === 'qualifie').length,
        proposition: prospects.filter(p => p.statut === 'proposition').length,
        negociation: prospects.filter(p => p.statut === 'negociation').length,
        signe: prospects.filter(p => p.statut === 'signe').length,
        perdu: prospects.filter(p => p.statut === 'perdu').length
      }
    }
  }

  // Réinitialiser la base de données
  reset() {
    this.prospects.clear()
    this.rdvs.clear()
    this.contrats.clear()
    this.nextProspectId = 1
    this.nextRdvId = 1
    this.nextContratId = 1
    localStorage.removeItem('db_prospects')
    localStorage.removeItem('db_rdvs')
    localStorage.removeItem('db_contrats')
    this.createDemoData()
  }
}

// Instance unique de la base de données
export const db = new Database()
