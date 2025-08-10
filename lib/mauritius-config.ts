// lib/mauritius-config.ts
export interface Prospect {
  id: number
  
  // Informations principales
  nom: string
  secteur: Secteur
  type?: string
  category?: string
  statut: Statut
  business_status?: 'OPERATIONAL' | 'CLOSED_PERMANENTLY' | 'CLOSED_TEMPORARILY' | 'UNKNOWN'
  
  // Localisation détaillée
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
  
  // Contacts multiples
  contact: string
  telephone: string
  telephone_2?: string
  telephone_3?: string
  email: string
  emails_additionnels?: string[]
  
  // Présence web
  website?: string
  facebook?: string
  instagram?: string
  linkedin?: string
  twitter?: string
  whatsapp?: string
  
  // Données Google
  google_place_id?: string
  google_id?: string
  google_cid?: string
  google_maps_url?: string
  rating?: number
  reviews_count?: number
  star_rating?: string
  photos_count?: number
  
  // Scoring et priorité
  score: 1 | 2 | 3 | 4 | 5
  quality_score?: number
  priority?: 'Haute' | 'Moyenne' | 'Basse'
  
  // Métadonnées
  budget: string
  notes: string
  description?: string
  
  // Import et tracking
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

// Mapping complet ville -> district
export const CITY_TO_DISTRICT_MAP: Record<string, District> = {
  // Flacq
  'Belle Mare': 'flacq',
  'Poste de Flacq': 'flacq',
  'Centre de Flacq': 'flacq',
  'Quatre Cocos': 'flacq',
  'Trou d\'Eau Douce': 'flacq',
  'Bel Air': 'flacq',
  'Palmar': 'flacq',
  'GRSE': 'flacq',
  
  // Rivière du Rempart
  'Grand Baie': 'riviere-du-rempart',
  'Pereybere': 'riviere-du-rempart',
  'Cap Malheureux': 'riviere-du-rempart',
  'Grand Gaube': 'riviere-du-rempart',
  'Goodlands': 'riviere-du-rempart',
  'Mapou': 'riviere-du-rempart',
  'Roches Noires': 'riviere-du-rempart',
  'Poste Lafayette': 'riviere-du-rempart',
  
  // Pamplemousses
  'Pamplemousses': 'pamplemousses',
  'Terre Rouge': 'pamplemousses',
  'Triolet': 'pamplemousses',
  'Trou aux Biches': 'pamplemousses',
  'Mont Choisy': 'pamplemousses',
  'Pointe aux Piments': 'pamplemousses',
  'Balaclava': 'pamplemousses',
  
  // Black River
  'Flic en Flac': 'black-river',
  'Black River': 'black-river',
  'Tamarin': 'black-river',
  'Le Morne': 'black-river',
  'La Gaulette': 'black-river',
  'Albion': 'black-river',
  'Petite Rivière': 'black-river',
  'Grande Rivière Noire': 'black-river',
  
  // Port Louis
  'Port Louis': 'port-louis',
  'Chinatown': 'port-louis',
  'Caudan': 'port-louis',
  
  // Plaines Wilhems
  'Curepipe': 'plaines-wilhems',
  'Quatre Bornes': 'plaines-wilhems',
  'Vacoas': 'plaines-wilhems',
  'Phoenix': 'plaines-wilhems',
  'Rose Hill': 'plaines-wilhems',
  'Beau Bassin': 'plaines-wilhems',
  'Floreal': 'plaines-wilhems',
  
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
  
  // Moka
  'Moka': 'moka',
  'Quartier Militaire': 'moka',
  'Saint Pierre': 'moka'
}

// Mots-clés pour identifier les secteurs
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

// Ajout de nouveaux secteurs
export const MAURITIUS_CONFIG = {
  // ... config existante ...
  
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
  }
}
