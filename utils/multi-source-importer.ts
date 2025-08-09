import { MAURITIUS_CONFIG } from '@/lib/mauritius-config'

export interface ImportSource {
  type: 'hotels' | 'general' | 'medical' | 'retail' | 'custom'
  name: string
  description: string
  expectedColumns: string[]
  mappingRules: Record<string, string>
  defaultValues: Record<string, any>
}

// Configuration pour différents types de fichiers
export const IMPORT_SOURCES: Record<string, ImportSource> = {
  // Pour ton fichier d'hôtels
  hotels: {
    type: 'hotels',
    name: 'Hôtels & Hébergements',
    description: 'Import de données hôtelières (format standard)',
    expectedColumns: ['Nom commercial', 'Adresse', 'Téléphone', 'Email', 'Code postal', 'Personne de contact'],
    mappingRules: {
      'Nom commercial': 'nom',
      'Adresse': 'adresse',
      'Téléphone': 'telephone',
      'Email': 'email',
      'Code postal': 'code_postal',
      'Personne de contact': 'contact'
    },
    defaultValues: {
      secteur: 'hotel',
      statut: 'nouveau',
      score: 3,
      budget: 'À définir'
    }
  },

  // Pour des prospects généraux (avant prospects)
  general: {
    type: 'general',
    name: 'Prospects Généraux',
    description: 'Import de prospects multi-secteurs',
    expectedColumns: ['Entreprise', 'Contact', 'Tel', 'Mail', 'Ville', 'Type', 'Commentaire'],
    mappingRules: {
      'Entreprise': 'nom',
      'Contact': 'contact',
      'Tel': 'telephone',
      'Mail': 'email',
      'Ville': 'ville',
      'Type': 'secteur',
      'Commentaire': 'notes'
    },
    defaultValues: {
      statut: 'nouveau',
      score: 3,
      budget: 'À évaluer',
      district: 'port-louis'
    }
  },

  // Pour des données médicales/pharmacies
  medical: {
    type: 'medical',
    name: 'Santé & Pharmacies',
    description: 'Import de cliniques, pharmacies, cabinets médicaux',
    expectedColumns: ['Nom', 'Type', 'Responsable', 'Telephone', 'Email', 'Adresse', 'Region'],
    mappingRules: {
      'Nom': 'nom',
      'Type': 'sous_type',
      'Responsable': 'contact',
      'Telephone': 'telephone',
      'Email': 'email',
      'Adresse': 'adresse',
      'Region': 'district'
    },
    defaultValues: {
      secteur: 'clinique',
      statut: 'nouveau',
      score: 3
    }
  },

  // Pour des commerces de détail
  retail: {
    type: 'retail',
    name: 'Commerce & Distribution',
    description: 'Import de supermarchés, boutiques, centres commerciaux',
    expectedColumns: ['Enseigne', 'Gérant', 'Contact', 'Email', 'Localisation', 'CA'],
    mappingRules: {
      'Enseigne': 'nom',
      'Gérant': 'contact',
      'Contact': 'telephone',
      'Email': 'email',
      'Localisation': 'adresse',
      'CA': 'budget'
    },
    defaultValues: {
      secteur: 'retail',
      statut: 'nouveau',
      score: 3
    }
  }
}

// Classe pour gérer l'import multi-sources
export class MultiSourceImporter {
  private source: ImportSource
  private data: any[]
  
  constructor(sourceType: string) {
    this.source = IMPORT_SOURCES[sourceType] || IMPORT_SOURCES.general
    this.data = []
  }

  // Détecter automatiquement le type de fichier
  static detectSourceType(headers: string[]): string {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim())
    
    // Vérifier chaque type de source
    for (const [key, source] of Object.entries(IMPORT_SOURCES)) {
      const expectedNormalized = source.expectedColumns.map(c => c.toLowerCase())
      const matchCount = expectedNormalized.filter(exp => 
        normalizedHeaders.some(h => h.includes(exp.split(' ')[0]))
      ).length
      
      // Si plus de 50% des colonnes correspondent
      if (matchCount >= source.expectedColumns.length * 0.5) {
        return key
      }
    }
    
    return 'general' // Par défaut
  }

  // Parser les données selon le type de source
  parseData(rawData: any[]): any[] {
    return rawData.map((row, index) => {
      const transformed: any = {
        ...this.source.defaultValues,
        import_source: this.source.name,
        import_date: new Date().toISOString()
      }
      
      // Appliquer les règles de mapping
      for (const [sourceCol, targetCol] of Object.entries(this.source.mappingRules)) {
        if (row[sourceCol]) {
          transformed[targetCol] = this.cleanValue(row[sourceCol], targetCol)
        }
      }
      
      // Post-traitement spécifique
      transformed.district = this.detectDistrict(transformed.adresse || transformed.ville || '')
      transformed.secteur = this.validateSecteur(transformed.secteur)
      transformed.telephone = this.formatPhone(transformed.telephone)
      
      return transformed
    })
  }

  // Nettoyer les valeurs
  private cleanValue(value: any, field: string): any {
    if (typeof value === 'string') {
      value = value.trim()
      
      // Nettoyer les guillemets
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }
    }
    
    // Validation spécifique par champ
    switch(field) {
      case 'email':
        return value?.toLowerCase() || ''
      case 'telephone':
        return value?.replace(/\D/g, '') || ''
      case 'budget':
        return value || 'À définir'
      default:
        return value || ''
    }
  }

  // Détecter le district
  private detectDistrict(location: string): string {
    return MAURITIUS_CONFIG.importMapping.detectDistrict(location)
  }

  // Valider le secteur
  private validateSecteur(secteur: string): string {
    const secteurLower = secteur?.toLowerCase() || ''
    
    // Mapping des variantes communes
    const mappings: Record<string, string> = {
      'hôtel': 'hotel',
      'hotel': 'hotel',
      'restaurant': 'restaurant',
      'resto': 'restaurant',
      'pharmacie': 'pharmacie',
      'pharmacy': 'pharmacie',
      'clinique': 'clinique',
      'clinic': 'clinique',
      'medical': 'clinique',
      'assurance': 'assurance',
      'insurance': 'assurance',
      'banque': 'banque',
      'bank': 'banque',
      'retail': 'retail',
      'supermarché': 'retail',
      'boutique': 'retail',
      'école': 'education',
      'school': 'education',
      'transport': 'transport',
      'logistique': 'transport',
      'it': 'technologie',
      'tech': 'technologie',
      'software': 'technologie'
    }
    
    for (const [key, value] of Object.entries(mappings)) {
      if (secteurLower.includes(key)) {
        return value
      }
    }
    
    // Si le secteur existe déjà dans la config
    if (MAURITIUS_CONFIG.secteurs[secteur]) {
      return secteur
    }
    
    // Sinon, utiliser la détection par nom
    return MAURITIUS_CONFIG.importMapping.detectSecteur(secteur)
  }

  // Formater le téléphone
  private formatPhone(phone: string): string {
    if (!phone) return ''
    
    const cleaned = phone.replace(/\D/g, '')
    
    // Ajouter le préfixe +230 si nécessaire
    if (cleaned.length === 7 || cleaned.length === 8) {
      return `+230 ${cleaned}`
    }
    if (cleaned.startsWith('230')) {
      return `+${cleaned}`
    }
    
    return cleaned
  }

  // Valider les données
  validateData(data: any[]): {
    valid: any[]
    errors: string[]
    warnings: string[]
    stats: any
  } {
    const valid: any[] = []
    const errors: string[] = []
    const warnings: string[] = []
    const stats = {
      total: data.length,
      byDistrict: {} as Record<string, number>,
      bySecteur: {} as Record<string, number>,
      withEmail: 0,
      withPhone: 0,
      withContact: 0
    }
    
    data.forEach((item, index) => {
      const lineNum = index + 2 // +2 car ligne 1 = headers
      
      // Vérifications obligatoires
      if (!item.nom) {
        errors.push(`Ligne ${lineNum}: Nom d'entreprise manquant`)
        return
      }
      
      // Avertissements
      if (!item.telephone && !item.email) {
        warnings.push(`Ligne ${lineNum}: Aucun moyen de contact (${item.nom})`)
      }
      
      if (!item.contact || item.contact === 'Direction') {
        warnings.push(`Ligne ${lineNum}: Contact non spécifié (${item.nom})`)
      }
      
      if (item.email && !this.isValidEmail(item.email)) {
        warnings.push(`Ligne ${lineNum}: Email invalide (${item.email})`)
      }
      
      // Statistiques
      stats.byDistrict[item.district] = (stats.byDistrict[item.district] || 0) + 1
      stats.bySecteur[item.secteur] = (stats.bySecteur[item.secteur] || 0) + 1
      if (item.email) stats.withEmail++
      if (item.telephone) stats.withPhone++
      if (item.contact && item.contact !== 'Direction') stats.withContact++
      
      valid.push(item)
    })
    
    return { valid, errors, warnings, stats }
  }

  // Vérifier la validité d'un email
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Exporter en CSV
  exportToCSV(data: any[]): string {
    const headers = [
      'Nom', 'Secteur', 'Ville', 'District', 'Contact', 
      'Téléphone', 'Email', 'Score', 'Budget', 'Notes'
    ]
    
    const rows = data.map(item => [
      item.nom,
      item.secteur,
      item.ville,
      item.district,
      item.contact,
      item.telephone,
      item.email,
      item.score,
      item.budget,
      item.notes
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n')
    
    return csv
  }
}

// Fonction helper pour identifier et merger les doublons
export function findDuplicates(existingData: any[], newData: any[]): {
  duplicates: any[]
  unique: any[]
} {
  const duplicates: any[] = []
  const unique: any[] = []
  
  for (const newItem of newData) {
    const isDuplicate = existingData.some(existing => {
      // Critères de duplication
      return (
        // Même nom d'entreprise
        existing.nom?.toLowerCase() === newItem.nom?.toLowerCase() ||
        // Même email
        (existing.email && existing.email === newItem.email) ||
        // Même téléphone
        (existing.telephone && existing.telephone === newItem.telephone)
      )
    })
    
    if (isDuplicate) {
      duplicates.push(newItem)
    } else {
      unique.push(newItem)
    }
  }
  
  return { duplicates, unique }
}

// Fonction pour merger les données (mise à jour)
export function mergeProspectData(existing: any, update: any): any {
  return {
    ...existing,
    // Mettre à jour seulement les champs non vides
    contact: update.contact || existing.contact,
    telephone: update.telephone || existing.telephone,
    email: update.email || existing.email,
    adresse: update.adresse || existing.adresse,
    website: update.website || existing.website,
    notes: existing.notes 
      ? `${existing.notes}\n---\n${update.notes || ''}` 
      : update.notes,
    // Conserver le meilleur score
    score: Math.max(existing.score || 3, update.score || 3),
    // Mettre à jour la date de modification
    derniere_modification: new Date().toISOString()
  }
}
