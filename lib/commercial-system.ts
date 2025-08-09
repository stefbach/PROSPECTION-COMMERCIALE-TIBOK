import { District, Secteur, Prospect } from './mauritius-config'

// ===== TYPES =====

export type UserRole = 'admin' | 'commercial' | 'manager'

export interface User {
  id: string
  email: string
  role: UserRole
  commercialId?: string // Si c'est un commercial
  createdAt: Date
  lastLogin?: Date
}

export interface Commercial {
  id: string
  userId: string
  nom: string
  prenom: string
  email: string
  telephone: string
  
  // Adresse pour calcul des déplacements
  adresse: {
    rue: string
    ville: string
    district: District
    codePostal: string
    latitude?: number
    longitude?: number
  }
  
  // Informations professionnelles
  dateEmbauche: Date
  statut: 'actif' | 'inactif' | 'conge'
  manager?: string // ID du manager
  
  // Véhicule et indemnités
  vehicule?: {
    type: 'personnel' | 'societe'
    marque?: string
    modele?: string
    immatriculation?: string
    tauxKm: number // Rs par km
  }
  
  // Zones d'affectation
  zones: District[]
  secteurs: Secteur[]
  
  // Objectifs
  objectifs: {
    mensuel: {
      ca: number
      nouveauxClients: number
      rdv: number
    }
    annuel: {
      ca: number
      nouveauxClients: number
    }
  }
  
  // Statistiques temps réel
  stats?: CommercialStats
}

export interface CommercialStats {
  // Période actuelle
  periode: 'jour' | 'semaine' | 'mois' | 'annee'
  
  // Chiffres clés
  caGenere: number
  caEnCours: number // Négociations
  nombreProspects: number
  nombreClients: number
  tauxConversion: number
  
  // Activité
  rdvEffectues: number
  rdvPlanifies: number
  appelsEffectues: number
  emailsEnvoyes: number
  
  // Déplacements
  kmParcourus: number
  indemnitesKm: number
  tempsRoute: number // en minutes
  
  // Performance
  scorePerformance: number // 0-100
  ranking?: number // Position dans l'équipe
}

export interface Deplacement {
  id: string
  commercialId: string
  date: Date
  
  // Trajet
  depart: {
    adresse: string
    heure: string
    latitude?: number
    longitude?: number
  }
  arrivee: {
    adresse: string
    heure: string
    latitude?: number
    longitude?: number
  }
  
  // Calculs
  distance: number // km
  duree: number // minutes
  indemnite: number // Rs
  
  // Contexte
  prospectId?: string
  motif: 'rdv' | 'prospection' | 'formation' | 'autre'
  commentaire?: string
  
  // Validation
  statut: 'brouillon' | 'soumis' | 'valide' | 'refuse'
  valideParId?: string
  valideLe?: Date
}

export interface Planning {
  id: string
  commercialId: string
  date: Date
  
  // Événements de la journée
  events: PlanningEvent[]
  
  // Optimisation IA
  optimisationIA?: {
    scoreOptimisation: number // 0-100
    economieKm: number
    economieTemps: number // minutes
    suggestions: string[]
  }
  
  // État
  statut: 'brouillon' | 'confirme' | 'modifie' | 'termine'
  modifiePar?: string
  modifieLe?: Date
}

export interface PlanningEvent {
  id: string
  type: 'rdv' | 'appel' | 'email' | 'prospection' | 'pause' | 'trajet'
  
  // Timing
  heureDebut: string
  heureFin: string
  duree: number // minutes
  
  // Détails selon le type
  prospect?: {
    id: string
    nom: string
    adresse: string
    contact: string
  }
  
  // Pour les trajets
  trajet?: {
    depart: string
    arrivee: string
    distance: number
    duree: number
  }
  
  // État
  statut: 'planifie' | 'en-cours' | 'termine' | 'annule' | 'reporte'
  resultat?: 'succes' | 'echec' | 'a-recontacter'
  commentaire?: string
  
  // IA
  priorite: 'haute' | 'moyenne' | 'basse'
  scoreOpportunite?: number
}

export interface Affectation {
  id: string
  prospectId: string
  commercialId: string
  
  // Dates
  dateAffectation: Date
  dateDebut: Date
  dateFin?: Date
  
  // Contexte
  motif: 'nouvelle' | 'reassignation' | 'remplacement' | 'escalade'
  affectePar: string // ID admin
  
  // État
  statut: 'active' | 'terminee' | 'annulee'
  resultat?: 'signe' | 'perdu' | 'en-cours'
  
  // Historique
  historique: AffectationHistorique[]
}

export interface AffectationHistorique {
  date: Date
  action: string
  parQui: string
  commentaire?: string
}

export interface Note {
  id: string
  prospectId: string
  commercialId: string
  
  date: Date
  type: 'appel' | 'rdv' | 'email' | 'general'
  contenu: string
  
  // Contexte
  sentiment: 'positif' | 'neutre' | 'negatif'
  prochainContact?: Date
  tags?: string[]
}

// ===== CONFIGURATION =====

export const COMMERCIAL_CONFIG = {
  // Indemnités kilométriques (Rs/km)
  indemnitesKm: {
    moto: 15,
    voiture: 25,
    fourgon: 35
  },
  
  // Temps moyens (minutes)
  tempsMoyens: {
    rdv: 45,
    appel: 10,
    email: 5,
    prospection: 30,
    trajet: 20 // par segment
  },
  
  // Objectifs par défaut
  objectifsDefaut: {
    mensuel: {
      ca: 500000, // Rs
      nouveauxClients: 10,
      rdv: 40
    },
    annuel: {
      ca: 6000000, // Rs
      nouveauxClients: 120
    }
  },
  
  // Scoring
  scoring: {
    conversion: {
      excellent: 30, // %
      bon: 20,
      moyen: 10
    },
    activite: {
      rdvJour: 5,
      appelsJour: 20,
      emailsJour: 15
    }
  },
  
  // Districts et distances (km)
  distancesDistricts: {
    'port-louis': {
      'pamplemousses': 15,
      'riviere-du-rempart': 45,
      'flacq': 50,
      'grand-port': 40,
      'savanne': 60,
      'plaines-wilhems': 20,
      'moka': 25,
      'black-river': 30
    },
    'pamplemousses': {
      'port-louis': 15,
      'riviere-du-rempart': 30,
      'flacq': 40,
      'grand-port': 55,
      'savanne': 75,
      'plaines-wilhems': 35,
      'moka': 30,
      'black-river': 45
    },
    'riviere-du-rempart': {
      'port-louis': 45,
      'pamplemousses': 30,
      'flacq': 25,
      'grand-port': 70,
      'savanne': 90,
      'plaines-wilhems': 65,
      'moka': 55,
      'black-river': 75
    },
    'flacq': {
      'port-louis': 50,
      'pamplemousses': 40,
      'riviere-du-rempart': 25,
      'grand-port': 35,
      'savanne': 55,
      'plaines-wilhems': 60,
      'moka': 45,
      'black-river': 80
    },
    'grand-port': {
      'port-louis': 40,
      'pamplemousses': 55,
      'riviere-du-rempart': 70,
      'flacq': 35,
      'savanne': 25,
      'plaines-wilhems': 30,
      'moka': 35,
      'black-river': 50
    },
    'savanne': {
      'port-louis': 60,
      'pamplemousses': 75,
      'riviere-du-rempart': 90,
      'flacq': 55,
      'grand-port': 25,
      'plaines-wilhems': 40,
      'moka': 50,
      'black-river': 45
    },
    'plaines-wilhems': {
      'port-louis': 20,
      'pamplemousses': 35,
      'riviere-du-rempart': 65,
      'flacq': 60,
      'grand-port': 30,
      'savanne': 40,
      'moka': 15,
      'black-river': 25
    },
    'moka': {
      'port-louis': 25,
      'pamplemousses': 30,
      'riviere-du-rempart': 55,
      'flacq': 45,
      'grand-port': 35,
      'savanne': 50,
      'plaines-wilhems': 15,
      'black-river': 35
    },
    'black-river': {
      'port-louis': 30,
      'pamplemousses': 45,
      'riviere-du-rempart': 75,
      'flacq': 80,
      'grand-port': 50,
      'savanne': 45,
      'plaines-wilhems': 25,
      'moka': 35
    }
  }
}

// ===== FONCTIONS UTILITAIRES =====

// Calculer la distance entre deux districts
export function calculateDistance(from: District, to: District): number {
  if (from === to) return 0
  
  const distances = COMMERCIAL_CONFIG.distancesDistricts[from]
  return distances?.[to] || 50 // Distance par défaut si non trouvée
}

// Calculer les indemnités kilométriques
export function calculateIndemnites(km: number, vehiculeType: 'moto' | 'voiture' | 'fourgon' = 'voiture'): number {
  return km * COMMERCIAL_CONFIG.indemnitesKm[vehiculeType]
}

// Calculer le score de performance
export function calculatePerformanceScore(stats: CommercialStats): number {
  let score = 0
  
  // Taux de conversion (40%)
  if (stats.tauxConversion >= COMMERCIAL_CONFIG.scoring.conversion.excellent) {
    score += 40
  } else if (stats.tauxConversion >= COMMERCIAL_CONFIG.scoring.conversion.bon) {
    score += 30
  } else if (stats.tauxConversion >= COMMERCIAL_CONFIG.scoring.conversion.moyen) {
    score += 20
  }
  
  // Activité (30%)
  const rdvScore = Math.min((stats.rdvEffectues / COMMERCIAL_CONFIG.scoring.activite.rdvJour) * 10, 10)
  const appelsScore = Math.min((stats.appelsEffectues / COMMERCIAL_CONFIG.scoring.activite.appelsJour) * 10, 10)
  const emailsScore = Math.min((stats.emailsEnvoyes / COMMERCIAL_CONFIG.scoring.activite.emailsJour) * 10, 10)
  score += rdvScore + appelsScore + emailsScore
  
  // CA généré (30%)
  // À adapter selon les objectifs
  score += 30 // Placeholder
  
  return Math.min(Math.round(score), 100)
}

// Optimiser un circuit de déplacements (algorithme simple)
export function optimizeCircuit(
  depart: District,
  prospects: { id: string; district: District; priorite: number }[]
): { id: string; district: District }[] {
  if (prospects.length === 0) return []
  
  const optimized: typeof prospects = []
  let currentDistrict = depart
  const remaining = [...prospects]
  
  // Algorithme glouton : toujours choisir le plus proche avec la priorité la plus haute
  while (remaining.length > 0) {
    let bestIndex = 0
    let bestScore = -Infinity
    
    remaining.forEach((prospect, index) => {
      const distance = calculateDistance(currentDistrict, prospect.district)
      // Score = priorité / distance (favorise priorité haute et distance courte)
      const score = prospect.priorite / (distance + 1)
      
      if (score > bestScore) {
        bestScore = score
        bestIndex = index
      }
    })
    
    const next = remaining.splice(bestIndex, 1)[0]
    optimized.push(next)
    currentDistrict = next.district
  }
  
  return optimized
}

// Générer un planning quotidien avec IA
export function generateDailyPlanning(
  commercial: Commercial,
  prospects: Prospect[],
  date: Date
): Planning {
  const events: PlanningEvent[] = []
  let currentTime = '08:00'
  
  // Filtrer les prospects par zone du commercial
  const zoneProspects = prospects.filter(p => 
    commercial.zones.includes(p.district) &&
    commercial.secteurs.includes(p.secteur)
  )
  
  // Prioriser les prospects
  const prioritized = zoneProspects
    .map(p => ({
      ...p,
      priorite: p.statut === 'en-negociation' ? 3 : 
                p.statut === 'qualifie' ? 2 : 1
    }))
    .sort((a, b) => b.priorite - a.priorite)
    .slice(0, 8) // Max 8 RDV par jour
  
  // Optimiser le circuit
  const optimizedRoute = optimizeCircuit(
    commercial.adresse.district,
    prioritized.map(p => ({
      id: p.id.toString(),
      district: p.district,
      priorite: p.score
    }))
  )
  
  // Créer les événements
  optimizedRoute.forEach((item, index) => {
    const prospect = prioritized.find(p => p.id.toString() === item.id)
    if (!prospect) return
    
    // Trajet
    if (index > 0) {
      const prevDistrict = index === 0 ? 
        commercial.adresse.district : 
        optimizedRoute[index - 1].district
      
      const distance = calculateDistance(prevDistrict, item.district)
      const dureeTrajet = Math.round(distance * 1.5) // 1.5 min/km
      
      events.push({
        id: `trajet-${index}`,
        type: 'trajet',
        heureDebut: currentTime,
        heureFin: addMinutes(currentTime, dureeTrajet),
        duree: dureeTrajet,
        trajet: {
          depart: prevDistrict,
          arrivee: item.district,
          distance,
          duree: dureeTrajet
        },
        statut: 'planifie',
        priorite: 'moyenne'
      })
      
      currentTime = addMinutes(currentTime, dureeTrajet)
    }
    
    // RDV
    events.push({
      id: `rdv-${index}`,
      type: 'rdv',
      heureDebut: currentTime,
      heureFin: addMinutes(currentTime, 45),
      duree: 45,
      prospect: {
        id: prospect.id.toString(),
        nom: prospect.nom,
        adresse: prospect.adresse || `${prospect.ville}, ${prospect.district}`,
        contact: prospect.contact
      },
      statut: 'planifie',
      priorite: prospect.statut === 'en-negociation' ? 'haute' : 'moyenne',
      scoreOpportunite: prospect.score * 20
    })
    
    currentTime = addMinutes(currentTime, 45)
    
    // Pause déjeuner
    if (index === Math.floor(optimizedRoute.length / 2)) {
      events.push({
        id: 'pause-dejeuner',
        type: 'pause',
        heureDebut: '12:00',
        heureFin: '13:00',
        duree: 60,
        statut: 'planifie',
        priorite: 'basse'
      })
      currentTime = '13:00'
    }
  })
  
  // Calculer les économies
  const distanceTotale = events
    .filter(e => e.type === 'trajet')
    .reduce((sum, e) => sum + (e.trajet?.distance || 0), 0)
  
  return {
    id: `planning-${date.toISOString()}`,
    commercialId: commercial.id,
    date,
    events,
    optimisationIA: {
      scoreOptimisation: 85,
      economieKm: Math.round(distanceTotale * 0.15), // 15% d'économie estimée
      economieTemps: Math.round(events.length * 5), // 5 min par événement
      suggestions: [
        'Regrouper les RDV par zone géographique',
        'Privilégier les appels pour les prospects éloignés',
        'Planifier les RDV importants le matin'
      ]
    },
    statut: 'brouillon'
  }
}

// Helper: Ajouter des minutes à une heure
function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}
