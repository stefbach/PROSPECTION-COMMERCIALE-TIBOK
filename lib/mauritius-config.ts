// lib/mauritius-config.ts

// Types
export type District = 
  | 'port-louis'
  | 'pamplemousses'
  | 'riviere-du-rempart'
  | 'flacq'
  | 'grand-port'
  | 'savanne'
  | 'plaines-wilhems'
  | 'moka'
  | 'black-river'

export type Secteur = 
  | 'hotel'
  | 'restaurant'
  | 'transport'
  | 'tourisme'
  | 'loisirs'
  | 'retail'
  | 'pharmacie'
  | 'clinique'
  | 'assurance'
  | 'banque'
  | 'immobilier'
  | 'education'
  | 'technologie'
  | 'autre'

export type Statut = 
  | 'nouveau'
  | 'contacte'
  | 'qualifie'
  | 'en-negociation'
  | 'signe'
  | 'perdu'
  | 'inactif'

// Configuration complète AVANT les autres exports
export const MAURITIUS_CONFIG = {
  districts: {
    'port-louis': { 
      label: 'Port-Louis', 
      villes: ['Port Louis', 'Chinatown', 'Caudan'] 
    },
    'pamplemousses': { 
      label: 'Pamplemousses', 
      villes: ['Pamplemousses', 'Terre Rouge', 'Triolet', 'Trou aux Biches'] 
    },
    'riviere-du-rempart': { 
      label: 'Rivière du Rempart', 
      villes: ['Grand Baie', 'Pereybere', 'Cap Malheureux', 'Goodlands'] 
    },
    'flacq': { 
      label: 'Flacq', 
      villes: ['Belle Mare', 'Centre de Flacq', 'Quatre Cocos', 'Trou d\'Eau Douce'] 
    },
    'grand-port': { 
      label: 'Grand Port', 
      villes: ['Mahebourg', 'Blue Bay', 'Rose Belle', 'Plaine Magnien'] 
    },
    'savanne': { 
      label: 'Savanne', 
      villes: ['Souillac', 'Bel Ombre', 'Surinam', 'Chemin Grenier'] 
    },
    'plaines-wilhems': { 
      label: 'Plaines Wilhems', 
      villes: ['Curepipe', 'Quatre Bornes', 'Vacoas', 'Phoenix', 'Rose Hill'] 
    },
    'moka': { 
      label: 'Moka', 
      villes: ['Moka', 'Quartier Militaire', 'Saint Pierre'] 
    },
    'black-river': { 
      label: 'Black River', 
      villes: ['Flic en Flac', 'Black River', 'Tamarin', 'Le Morne', 'La Gaulette'] 
    }
  },

  secteurs: {
    hotel: { label: 'Hôtellerie', icon: '🏨', color: 'blue' },
    restaurant: { label: 'Restaurant', icon: '🍽️', color: 'green' },
    transport: { label: 'Transport', icon: '🚗', color: 'purple' },
    tourisme: { label: 'Tourisme', icon: '✈️', color: 'yellow' },
    loisirs: { label: 'Loisirs', icon: '🎯', color: 'pink' },
    retail: { label: 'Commerce', icon: '🛍️', color: 'cyan' },
    pharmacie: { label: 'Pharmacie', icon: '💊', color: 'red' },
    clinique: { label: 'Santé', icon: '🏥', color: 'teal' },
    assurance: { label: 'Assurance', icon: '🛡️', color: 'indigo' },
    banque: { label: 'Banque', icon: '🏦', color: 'amber' },
    immobilier: { label: 'Immobilier', icon: '🏢', color: 'brown' },
    education: { label: 'Éducation', icon: '🎓', color: 'lime' },
    technologie: { label: 'Technologie', icon: '💻', color: 'violet' },
    autre: { label: 'Autre', icon: '📍', color: 'gray' }
  },

  statuts: {
    nouveau: { label: 'Nouveau', color: 'blue' },
    contacte: { label: 'Contacté', color: 'yellow' },
    qualifie: { label: 'Qualifié', color: 'orange' },
    'en-negociation': { label: 'En négociation', color: 'purple' },
    signe: { label: 'Client signé', color: 'green' },
    perdu: { label: 'Perdu', color: 'red' },
    inactif: { label: 'Inactif', color: 'gray' }
  },

  labels: {
    currency: 'Rs',
    country: 'Maurice',
    countryCode: 'MU'
  }
}

// Interface Prospect
export interface Prospect {
  id: number
  
  // Informations principales
  nom: string
  secteur: Secteur
  type?: string
  category?: string
  statut: Statut
  business_status?: 'OPERATIONAL' | 'CLOSED_PERMANENTLY' | 'CLOSED_TEMPORARILY' | 'UNKNOWN'
  
  // Localisation
  district: District
  ville: string
  quartier?: string
  adresse: string
  adresse_originale?: string
  rue?: string
  code_postal?: string
  pays?: string
  code_pays?: string
  
  // Coordonnées GPS
  latitude?: number
  longitude?: number
  has_valid_coordinates?: boolean
  
  // Contacts
  contact: string
  telephone: string
  telephone_2?: string
  telephone_3?: string
  email: string
  emails_additionnels?: string[]
  
  // Web & Social
  website?: string
  facebook?: string
  instagram?: string
  linkedin?: string
  twitter?: string
  whatsapp?: string
  
  // Google Data
  google_place_id?: string
  google_id?: string
  google_cid?: string
  google_maps_url?: string
  rating?: number
  reviews_count?: number
  star_rating?: string
  photos_count?: number
  
  // Scoring
  score: 1 | 2 | 3 | 4 | 5
  quality_score?: number
  priority?: 'Haute' | 'Moyenne' | 'Basse'
  
  // Métadonnées
  budget: string
  notes: string
  description?: string
  
  // Import
  data_source?: 'manual' | 'outscraper' | 'excel' | 'csv'
  import_batch_id?: string
  import_date?: string
  is_verified?: boolean
  
  // Commercial
  zone_commerciale?: string
  statut_visite?: 'À visiter' | 'Visité' | 'En cours' | 'Reporté'
  date_derniere_visite?: string
  prochain_rdv?: string
  notes_commercial?: string
}

// Mapping ville -> district (APRÈS MAURITIUS_CONFIG)
export const CITY_TO_DISTRICT_MAP: Record<string, District> = {
  // Port-Louis
  'Port Louis': 'port-louis',
  'Chinatown': 'port-louis',
  'Caudan': 'port-louis',
  
  // Pamplemousses
  'Pamplemousses': 'pamplemousses',
  'Terre Rouge': 'pamplemousses',
  'Triolet': 'pamplemousses',
  'Trou aux Biches': 'pamplemousses',
  'Mont Choisy': 'pamplemousses',
  'Pointe aux Piments': 'pamplemousses',
  'Balaclava': 'pamplemousses',
  
  // Rivière du Rempart
  'Grand Baie': 'riviere-du-rempart',
  'Pereybere': 'riviere-du-rempart',
  'Cap Malheureux': 'riviere-du-rempart',
  'Grand Gaube': 'riviere-du-rempart',
  'Goodlands': 'riviere-du-rempart',
  'Mapou': 'riviere-du-rempart',
  'Roches Noires': 'riviere-du-rempart',
  'Poste Lafayette': 'riviere-du-rempart',
  
  // Flacq
  'Belle Mare': 'flacq',
  'Poste de Flacq': 'flacq',
  'Centre de Flacq': 'flacq',
  'Quatre Cocos': 'flacq',
  'Trou d\'Eau Douce': 'flacq',
  'Bel Air': 'flacq',
  'Palmar': 'flacq',
  'GRSE': 'flacq',
  
  // Grand Port
  'Mahebourg': 'grand-port',
  'Blue Bay': 'grand-port',
  'Rose Belle': 'grand-port',
  'Plaine Magnien': 'grand-port',
  'Vieux Grand Port': 'grand-port',
  
  // Savanne
  'Souillac': 'savanne',
  'Bel Ombre': 'savanne',
  'Surinam': 'savanne',
  'Chemin Grenier': 'savanne',
  'Rivière des Anguilles': 'savanne',
  
  // Plaines Wilhems
  'Curepipe': 'plaines-wilhems',
  'Quatre Bornes': 'plaines-wilhems',
  'Vacoas': 'plaines-wilhems',
  'Phoenix': 'plaines-wilhems',
  'Rose Hill': 'plaines-wilhems',
  'Beau Bassin': 'plaines-wilhems',
  'Floreal': 'plaines-wilhems',
  
  // Moka
  'Moka': 'moka',
  'Quartier Militaire': 'moka',
  'Saint Pierre': 'moka',
  
  // Black River
  'Flic en Flac': 'black-river',
  'Black River': 'black-river',
  'Tamarin': 'black-river',
  'Le Morne': 'black-river',
  'La Gaulette': 'black-river',
  'Albion': 'black-river',
  'Petite Rivière': 'black-river',
  'Grande Rivière Noire': 'black-river'
}

// Mots-clés secteurs
export const SECTOR_KEYWORDS: Record<Secteur, string[]> = {
  'hotel': ['hotel', 'hôtel', 'resort', 'villa', 'lodge', 'guest house', 'guesthouse', 'b&b', 'bed and breakfast', 'inn', 'motel'],
  'restaurant': ['restaurant', 'resto', 'café', 'cafe', 'bistro', 'brasserie', 'pizzeria', 'snack', 'fast food', 'bar', 'pub', 'grill'],
  'transport': ['taxi', 'transport', 'location', 'car rental', 'rent a car', 'transfer', 'shuttle', 'bus'],
  'tourisme': ['tour', 'excursion', 'voyage', 'travel', 'agency', 'agence', 'tourism', 'guide', 'cruise'],
  'loisirs': ['spa', 'wellness', 'massage', 'gym', 'fitness', 'sport', 'golf', 'tennis', 'diving', 'plongée', 'casino'],
  'retail': ['shop', 'boutique', 'store', 'magasin', 'market', 'marché', 'mall', 'supermarket'],
  'pharmacie': ['pharmac', 'drug', 'medicament', 'drugstore'],
  'clinique': ['clinic', 'medical', 'health', 'sante', 'hopital', 'hospital'],
  'assurance': ['assurance', 'insurance', 'assur'],
  'banque': ['bank', 'banque', 'finance', 'credit'],
  'immobilier': ['immobil', 'real estate', 'property', 'promoteur'],
  'education': ['school', 'école', 'college', 'university', 'formation'],
  'technologie': ['tech', 'software', 'digital', 'web', 'it'],
  'autre': []
}

// Couleurs pour les secteurs (pour KML et visualisation)
export const SECTOR_COLORS: Record<Secteur, string> = {
  'hotel': '#3B82F6',      // blue
  'restaurant': '#10B981',  // green
  'transport': '#8B5CF6',   // purple
  'tourisme': '#EAB308',    // yellow
  'loisirs': '#EC4899',     // pink
  'retail': '#06B6D4',      // cyan
  'pharmacie': '#EF4444',   // red
  'clinique': '#14B8A6',    // teal
  'assurance': '#6366F1',   // indigo
  'banque': '#F59E0B',      // amber
  'immobilier': '#92400E',  // brown
  'education': '#84CC16',   // lime
  'technologie': '#7C3AED', // violet
  'autre': '#6B7280'        // gray
}

// Export par défaut pour éviter les erreurs
export default MAURITIUS_CONFIG
