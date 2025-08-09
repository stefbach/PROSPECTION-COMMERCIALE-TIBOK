export const MAURITIUS_CONFIG = {
  // Districts officiels de l'île Maurice
  districts: {
    'port-louis': {
      label: 'Port Louis',
      cities: ['Port Louis', 'Caudan', 'Chinatown', 'Plaine Verte', 'Ward IV'],
      postalCodes: ['11000-11999']
    },
    'pamplemousses': {
      label: 'Pamplemousses', 
      cities: ['Pamplemousses', 'Terre Rouge', 'Arsenal', 'Baie du Tombeau', 'Calebasses'],
      postalCodes: ['20000-21999']
    },
    'riviere-du-rempart': {
      label: 'Rivière du Rempart',
      cities: ['Grand Baie', 'Pereybere', 'Cap Malheureux', 'Calodyne', 'Grand Gaube'],
      postalCodes: ['30000-31999']
    },
    'flacq': {
      label: 'Flacq',
      cities: ['Centre de Flacq', 'Belle Mare', 'Poste de Flacq', 'Trou d\'Eau Douce', 'Quatre Cocos'],
      postalCodes: ['40000-41999']
    },
    'grand-port': {
      label: 'Grand Port',
      cities: ['Mahebourg', 'Blue Bay', 'Plaine Magnien', 'Rose Belle', 'New Grove'],
      postalCodes: ['50000-51999']
    },
    'savanne': {
      label: 'Savanne',
      cities: ['Souillac', 'Surinam', 'Chemin Grenier', 'Rivière des Anguilles', 'Bel Ombre'],
      postalCodes: ['60000-61999']
    },
    'plaines-wilhems': {
      label: 'Plaines Wilhems',
      cities: ['Curepipe', 'Quatre Bornes', 'Vacoas', 'Phoenix', 'Rose Hill'],
      postalCodes: ['70000-74999']
    },
    'moka': {
      label: 'Moka',
      cities: ['Moka', 'Quartier Militaire', 'Saint Pierre', 'Montagne Blanche'],
      postalCodes: ['80000-81999']
    },
    'black-river': {
      label: 'Black River',
      cities: ['Flic en Flac', 'Tamarin', 'Black River', 'Le Morne', 'La Gaulette'],
      postalCodes: ['90000-91999']
    },
    'rodrigues': {
      label: 'Rodrigues',
      cities: ['Port Mathurin', 'La Ferme', 'Quatre Vents'],
      postalCodes: ['R1000-R9999']
    }
  },

  // Secteurs d'activité pour Maurice
  secteurs: {
    'hotel': {
      label: 'Hôtellerie & Tourisme',
      icon: '🏨',
      subTypes: ['Hotel', 'Resort', 'Villa', 'Guest House', 'B&B']
    },
    'restaurant': {
      label: 'Restauration',
      icon: '🍽️',
      subTypes: ['Restaurant', 'Fast Food', 'Café', 'Bar', 'Traiteur']
    },
    'pharmacie': {
      label: 'Pharmacie',
      icon: '💊',
      subTypes: ['Pharmacie', 'Parapharmacie', 'Distributeur médical']
    },
    'clinique': {
      label: 'Santé Privée',
      icon: '🏥',
      subTypes: ['Clinique', 'Centre médical', 'Laboratoire', 'Centre dentaire']
    },
    'assurance': {
      label: 'Assurance',
      icon: '🛡️',
      subTypes: ['Assurance vie', 'Assurance santé', 'Assurance auto', 'Courtier']
    },
    'banque': {
      label: 'Services Financiers',
      icon: '🏦',
      subTypes: ['Banque', 'Institution financière', 'Bureau de change', 'Fintech']
    },
    'immobilier': {
      label: 'Immobilier',
      icon: '🏢',
      subTypes: ['Promoteur', 'Agence', 'Syndic', 'Construction']
    },
    'retail': {
      label: 'Commerce de détail',
      icon: '🛍️',
      subTypes: ['Supermarché', 'Boutique', 'Centre commercial', 'Duty Free']
    },
    'industrie': {
      label: 'Industrie',
      icon: '🏭',
      subTypes: ['Textile', 'Agroalimentaire', 'Manufacturing', 'Zone franche']
    },
    'education': {
      label: 'Éducation',
      icon: '🎓',
      subTypes: ['École privée', 'Université', 'Centre de formation', 'École de langues']
    },
    'transport': {
      label: 'Transport & Logistique',
      icon: '🚚',
      subTypes: ['Transport', 'Logistique', 'Location de voitures', 'Taxi']
    },
    'technologie': {
      label: 'IT & Tech',
      icon: '💻',
      subTypes: ['Software', 'Web agency', 'Cybersécurité', 'Telecom']
    },
    'maison-retraite': {
      label: 'Maison de retraite',
      icon: '🏡',
      subTypes: ['EHPAD', 'Résidence seniors', 'Soins à domicile']
    },
    'autre': {
      label: 'Autre entreprise',
      icon: '🏢',
      subTypes: ['Services', 'Consulting', 'Import/Export', 'Autre']
    }
  },

  // Statuts de prospection
  statuts: {
    'nouveau': { label: 'Nouveau', color: 'gray', description: 'Prospect non contacté' },
    'qualifie': { label: 'Qualifié', color: 'blue', description: 'Besoin identifié' },
    'contacte': { label: 'Contacté', color: 'yellow', description: 'Premier contact établi' },
    'rdv-planifie': { label: 'RDV Planifié', color: 'purple', description: 'Rendez-vous fixé' },
    'en-negociation': { label: 'En Négociation', color: 'orange', description: 'Proposition envoyée' },
    'signe': { label: 'Client Signé', color: 'green', description: 'Contrat signé' },
    'perdu': { label: 'Perdu', color: 'red', description: 'Opportunité perdue' },
    'en-attente': { label: 'En Attente', color: 'gray', description: 'En pause temporaire' }
  },

  // Scoring des prospects
  scoring: {
    factors: {
      taille_entreprise: { weight: 30, options: ['TPE', 'PME', 'Grande entreprise', 'Multinationale'] },
      budget_estime: { weight: 25, options: ['< Rs 50k', 'Rs 50k-200k', 'Rs 200k-500k', '> Rs 500k'] },
      urgence: { weight: 20, options: ['Pas urgent', '6 mois', '3 mois', 'Immédiat'] },
      decision_maker: { weight: 15, options: ['Non identifié', 'Contact établi', 'En relation', 'Engagé'] },
      concurrence: { weight: 10, options: ['Forte', 'Moyenne', 'Faible', 'Aucune'] }
    }
  },

  // Mapping pour l'import Excel
  importMapping: {
    // Détection automatique de la ville basée sur l'adresse
    detectDistrict: (address: string): string => {
      if (!address) return 'port-louis';
      
      const addressLower = address.toLowerCase();
      
      // Vérifier chaque district et ses villes
      for (const [districtKey, district] of Object.entries(MAURITIUS_CONFIG.districts)) {
        for (const city of district.cities) {
          if (addressLower.includes(city.toLowerCase())) {
            return districtKey;
          }
        }
      }
      
      // Détection par code postal si présent
      const postalMatch = address.match(/\b([0-9]{5})\b/);
      if (postalMatch) {
        const postal = parseInt(postalMatch[1]);
        if (postal >= 11000 && postal <= 11999) return 'port-louis';
        if (postal >= 20000 && postal <= 21999) return 'pamplemousses';
        if (postal >= 30000 && postal <= 31999) return 'riviere-du-rempart';
        if (postal >= 40000 && postal <= 41999) return 'flacq';
        if (postal >= 50000 && postal <= 51999) return 'grand-port';
        if (postal >= 60000 && postal <= 61999) return 'savanne';
        if (postal >= 70000 && postal <= 74999) return 'plaines-wilhems';
        if (postal >= 80000 && postal <= 81999) return 'moka';
        if (postal >= 90000 && postal <= 91999) return 'black-river';
      }
      
      return 'port-louis'; // Défaut
    },

    // Détection du secteur basé sur le nom
    detectSecteur: (name: string): string => {
      const nameLower = name.toLowerCase();
      
      if (nameLower.includes('hotel') || nameLower.includes('resort') || nameLower.includes('villa')) {
        return 'hotel';
      }
      if (nameLower.includes('restaurant') || nameLower.includes('resto') || nameLower.includes('café')) {
        return 'restaurant';
      }
      if (nameLower.includes('pharmac')) {
        return 'pharmacie';
      }
      if (nameLower.includes('clinic') || nameLower.includes('clinique') || nameLower.includes('medical')) {
        return 'clinique';
      }
      if (nameLower.includes('assurance') || nameLower.includes('insurance')) {
        return 'assurance';
      }
      if (nameLower.includes('bank') || nameLower.includes('banque') || nameLower.includes('mcb') || nameLower.includes('sbm')) {
        return 'banque';
      }
      if (nameLower.includes('school') || nameLower.includes('école') || nameLower.includes('college')) {
        return 'education';
      }
      
      return 'autre';
    }
  },

  // Configuration des validations
  validation: {
    telephone: {
      patterns: [
        /^(\+230)?[2-9]\d{6}$/,  // Fixe Maurice
        /^(\+230)?5\d{7}$/        // Mobile Maurice
      ],
      format: (tel: string) => {
        // Nettoyer et formater le téléphone
        const cleaned = tel.replace(/\D/g, '');
        if (cleaned.startsWith('230')) {
          return '+230 ' + cleaned.slice(3);
        }
        return cleaned;
      }
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      domains: ['.mu', '.com', '.org', '.net', '.io'] // Domaines courants à Maurice
    }
  },

  // Messages et labels en français/créole
  labels: {
    buttons: {
      add: 'Ajouter Prospect',
      import: 'Importer Excel',
      export: 'Exporter',
      filter: 'Filtrer',
      call: 'Appeler',
      email: 'Envoyer Email',
      schedule: 'Planifier RDV'
    },
    status: {
      loading: 'Chargement...',
      success: 'Succès',
      error: 'Erreur',
      noData: 'Aucune donnée'
    },
    currency: 'Rs', // Roupie mauricienne
    dateFormat: 'DD/MM/YYYY'
  }
};

// Types TypeScript
export type District = keyof typeof MAURITIUS_CONFIG.districts;
export type Secteur = keyof typeof MAURITIUS_CONFIG.secteurs;
export type Statut = keyof typeof MAURITIUS_CONFIG.statuts;

export interface Prospect {
  id: number;
  nom: string;
  secteur: Secteur;
  ville: string;
  district: District;
  statut: Statut;
  contact: string;
  telephone: string;
  email: string;
  score: 1 | 2 | 3 | 4 | 5;
  budget: string;
  notes: string;
  adresse?: string;
  website?: string;
  taille_entreprise?: string;
  date_creation?: Date;
  dernier_contact?: Date;
  prochain_rdv?: Date;
  commercial_assigne?: string;
}
