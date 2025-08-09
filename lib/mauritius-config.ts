// lib/mauritius-config.ts
// Configuration simplifiée pour le CRM Maurice

export const MAURITIUS_CONFIG = {
  // Districts de Maurice
  districts: {
    'port-louis': { label: 'Port Louis', cities: ['Port Louis', 'Caudan'] },
    'pamplemousses': { label: 'Pamplemousses', cities: ['Pamplemousses', 'Terre Rouge'] },
    'riviere-du-rempart': { label: 'Rivière du Rempart', cities: ['Grand Baie', 'Pereybere'] },
    'flacq': { label: 'Flacq', cities: ['Belle Mare', 'Centre de Flacq'] },
    'grand-port': { label: 'Grand Port', cities: ['Mahebourg', 'Blue Bay'] },
    'savanne': { label: 'Savanne', cities: ['Souillac', 'Bel Ombre'] },
    'plaines-wilhems': { label: 'Plaines Wilhems', cities: ['Curepipe', 'Quatre Bornes'] },
    'moka': { label: 'Moka', cities: ['Moka', 'Saint Pierre'] },
    'black-river': { label: 'Black River', cities: ['Flic en Flac', 'Tamarin'] }
  },

  // Secteurs d'activité
  secteurs: {
    'hotel': { label: 'Hôtellerie', icon: '🏨' },
    'restaurant': { label: 'Restauration', icon: '🍽️' },
    'pharmacie': { label: 'Pharmacie', icon: '💊' },
    'clinique': { label: 'Santé', icon: '🏥' },
    'assurance': { label: 'Assurance', icon: '🛡️' },
    'banque': { label: 'Banque', icon: '🏦' },
    'immobilier': { label: 'Immobilier', icon: '🏢' },
    'retail': { label: 'Commerce', icon: '🛍️' },
    'industrie': { label: 'Industrie', icon: '🏭' },
    'education': { label: 'Éducation', icon: '🎓' },
    'transport': { label: 'Transport', icon: '🚚' },
    'technologie': { label: 'IT/Tech', icon: '💻' },
    'autre': { label: 'Autre', icon: '🏢' }
  },
// Régions de Maurice
  regions: {
    centre: { label: 'Centre', districts: ['port-louis', 'plaines-wilhems', 'moka'] },
    nord: { label: 'Nord', districts: ['pamplemousses', 'riviere-du-rempart'] },
    est: { label: 'Est', districts: ['flacq', 'grand-port'] },
    sud: { label: 'Sud', districts: ['savanne'] },
    ouest: { label: 'Ouest', districts: ['black-river'] }
  },
  // Statuts
  statuts: {
    'nouveau': { label: 'Nouveau', color: 'gray' },
    'qualifie': { label: 'Qualifié', color: 'blue' },
    'contacte': { label: 'Contacté', color: 'yellow' },
    'rdv-planifie': { label: 'RDV Planifié', color: 'purple' },
    'en-negociation': { label: 'En Négociation', color: 'orange' },
    'signe': { label: 'Client Signé', color: 'green' },
    'perdu': { label: 'Perdu', color: 'red' }
  },

  // Fonctions de mapping
  importMapping: {
    detectDistrict: (address: string): string => {
      if (!address) return 'port-louis'
      const addr = address.toLowerCase()
      
      if (addr.includes('port louis')) return 'port-louis'
      if (addr.includes('grand baie')) return 'riviere-du-rempart'
      if (addr.includes('curepipe') || addr.includes('quatre bornes')) return 'plaines-wilhems'
      if (addr.includes('mahebourg') || addr.includes('blue bay')) return 'grand-port'
      if (addr.includes('flic en flac')) return 'black-river'
      if (addr.includes('belle mare')) return 'flacq'
      
      return 'port-louis'
    },
    
    detectSecteur: (name: string): string => {
      const n = name.toLowerCase()
      
      if (n.includes('hotel') || n.includes('resort')) return 'hotel'
      if (n.includes('restaurant')) return 'restaurant'
      if (n.includes('pharmac')) return 'pharmacie'
      if (n.includes('clinic')) return 'clinique'
      if (n.includes('assurance')) return 'assurance'
      if (n.includes('bank') || n.includes('banque')) return 'banque'
      
      return 'autre'
    }
  },

  // Validation
  validation: {
    telephone: {
      format: (tel: string) => {
        const cleaned = tel.replace(/\D/g, '')
        if (cleaned.length === 7 || cleaned.length === 8) {
          return '+230 ' + cleaned
        }
        return cleaned
      }
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  },

  labels: {
    currency: 'Rs'
  }
}

// Types TypeScript
export type District = keyof typeof MAURITIUS_CONFIG.districts
export type Secteur = keyof typeof MAURITIUS_CONFIG.secteurs
export type Statut = keyof typeof MAURITIUS_CONFIG.statuts

export interface Prospect {
  id: number
  nom: string
  secteur: Secteur
  ville: string
  district: District
  statut: Statut
  contact: string
  telephone: string
  email: string
  score: 1 | 2 | 3 | 4 | 5
  budget: string
  notes: string
  adresse?: string
  website?: string
}
