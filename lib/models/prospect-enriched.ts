// lib/models/prospect-enriched.ts

import { District, Secteur, Statut } from '@/lib/mauritius-config'

// ===== INTERFACES DE BASE =====

export interface ProspectEmail {
  id?: number
  prospectId?: number
  email: string
  emailType: 'primary' | 'secondary' | 'billing' | 'support'
  isValid?: boolean
  validationStatus?: 'valid' | 'invalid' | 'catch-all' | 'unknown'
  validationDetails?: string
  validationDate?: Date
  fullName?: string
  firstName?: string
  lastName?: string
  jobTitle?: string
  priority: number
  isActive: boolean
}

export interface ProspectPhone {
  id?: number
  prospectId?: number
  phoneNumber: string
  phoneType: 'main' | 'mobile' | 'fax' | 'whatsapp'
  formattedNumber?: string
  carrierName?: string
  carrierType?: 'mobile' | 'landline' | 'voip'
  isWhatsapp: boolean
  isValid: boolean
  priority: number
}

export interface ProspectSocialMedia {
  id?: number
  prospectId?: number
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'youtube' | 'tiktok' | 'whatsapp'
  url?: string
  username?: string
  followersCount?: number
  isVerified: boolean
  lastChecked?: Date
}

export interface ProspectMetrics {
  id?: number
  prospectId?: number
  source: 'google' | 'tripadvisor' | 'facebook' | 'internal'
  rating?: number
  reviewsCount: number
  reviewsLink?: string
  photosCount?: number
  lastReviewDate?: Date
  sentimentScore?: number // -1 à 1
  responseRate?: number // pourcentage
  averageResponseTime?: number // heures
}

export interface ProspectCoordinates {
  latitude: number
  longitude: number
  googlePlaceId?: string
  googleCid?: string
}

export interface ProspectEnrichmentData {
  id?: number
  prospectId?: number
  source: string
  dataType: string
  rawData: any // JSONB
  processed: boolean
  createdAt?: Date
}

// ===== INTERFACE PRINCIPALE ENRICHIE =====

export interface ProspectEnriched {
  // Données de base (compatibles avec l'ancien système)
  id: number
  nom: string
  secteur: Secteur
  ville: string
  district: District
  statut: Statut
  contact: string
  telephone: string
  email: string
  score: number
  budget: string
  notes: string
  adresse?: string
  website?: string
  
  // Nouvelles données enrichies
  coordinates?: ProspectCoordinates
  businessStatus: 'OPERATIONAL' | 'CLOSED_PERMANENTLY' | 'CLOSED_TEMPORARILY' | 'UNKNOWN'
  dataSource: 'manual' | 'outscraper' | 'google_places' | 'import' | 'api'
  importBatchId?: string
  qualityScore: number
  lastEnrichmentDate?: Date
  isVerified: boolean
  parentCompanyId?: number
  
  // Relations (chargées à la demande)
  emails: ProspectEmail[]
  phones: ProspectPhone[]
  socialMedia: ProspectSocialMedia[]
  metrics: ProspectMetrics[]
  enrichmentData?: ProspectEnrichmentData[]
  
  // Métadonnées
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

// ===== TYPES POUR L'IMPORT =====

export interface ImportBatch {
  id: string
  filename?: string
  fileType?: string
  source: string
  totalRows: number
  importedRows: number
  skippedRows: number
  errorRows: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  mappingConfig?: any
  options?: ImportOptions
  errors?: ImportError[]
  startedAt?: Date
  completedAt?: Date
  createdBy?: string
  createdAt: Date
}

export interface ImportOptions {
  skipDuplicates: boolean
  updateExisting: boolean
  autoDetectSector: boolean
  autoDetectDistrict: boolean
  validateEmails: boolean
  geocodeAddresses: boolean
  enrichWithGoogle: boolean
  defaultSector?: Secteur
  defaultDistrict?: District
  qualityThreshold?: number
}

export interface ImportError {
  row: number
  field?: string
  value?: any
  error: string
  severity: 'error' | 'warning'
}

export interface DuplicateMatch {
  prospectId: number
  matchScore: number
  matchCriteria: {
    email?: boolean
    phone?: boolean
    googleCid?: boolean
    coordinates?: boolean
    name?: boolean
  }
}

// ===== MAPPERS ET TRANSFORMERS =====

export class ProspectDataMapper {
  /**
   * Mapper les données Outscraper vers notre modèle
   */
  static fromOutscraper(data: any): Partial<ProspectEnriched> {
    const prospect: Partial<ProspectEnriched> = {
      nom: data.name || data.name_for_emails,
      ville: data.city,
      adresse: data.full_address || data.street,
      website: data.site,
      businessStatus: data.business_status || 'UNKNOWN',
      dataSource: 'outscraper',
      
      // Coordonnées
      coordinates: data.latitude && data.longitude ? {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        googlePlaceId: data.place_id,
        googleCid: data.google_id || data.cid
      } : undefined,
      
      // Collections
      emails: [],
      phones: [],
      socialMedia: [],
      metrics: []
    }
    
    // Mapper les emails
    if (data.email_1) {
      prospect.emails!.push({
        email: data.email_1,
        emailType: 'primary',
        validationStatus: data['email_1.emails_validator.status'],
        validationDetails: data['email_1.emails_validator.status_details'],
        fullName: data.email_1_full_name,
        firstName: data.email_1_first_name,
        lastName: data.email_1_last_name,
        jobTitle: data.email_1_title,
        priority: 1,
        isActive: true
      })
    }
    
    if (data.email_2) {
      prospect.emails!.push({
        email: data.email_2,
        emailType: 'secondary',
        validationStatus: data['email_2.emails_validator.status'],
        fullName: data.email_2_full_name,
        priority: 2,
        isActive: true
      })
    }
    
    // Mapper les téléphones
    if (data.phone) {
      prospect.phones!.push({
        phoneNumber: data.phone,
        phoneType: 'main',
        carrierName: data['phone.phones_enricher.carrier_name'],
        carrierType: data['phone.phones_enricher.carrier_type'],
        isWhatsapp: false,
        isValid: true,
        priority: 1
      })
    }
    
    // Mapper les réseaux sociaux
    const socialPlatforms = ['facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'whatsapp']
    socialPlatforms.forEach(platform => {
      if (data[platform]) {
        prospect.socialMedia!.push({
          platform: platform as any,
          url: data[platform],
          isVerified: false
        })
      }
    })
    
    // Mapper les métriques Google
    if (data.rating || data.reviews) {
      prospect.metrics!.push({
        source: 'google',
        rating: parseFloat(data.rating) || undefined,
        reviewsCount: parseInt(data.reviews) || 0,
        reviewsLink: data.reviews_link,
        photosCount: parseInt(data.photos_count) || 0
      })
    }
    
    return prospect
  }
  
  /**
   * Mapper depuis un CSV générique
   */
  static fromGenericCSV(data: any, mapping: Record<string, string>): Partial<ProspectEnriched> {
    const prospect: Partial<ProspectEnriched> = {
      emails: [],
      phones: [],
      socialMedia: [],
      metrics: [],
      dataSource: 'import'
    }
    
    // Appliquer le mapping personnalisé
    Object.entries(mapping).forEach(([sourceField, targetField]) => {
      const value = data[sourceField]
      if (!value) return
      
      switch (targetField) {
        case 'email':
          prospect.emails!.push({
            email: value,
            emailType: 'primary',
            priority: 1,
            isActive: true
          })
          break
        case 'telephone':
          prospect.phones!.push({
            phoneNumber: value,
            phoneType: 'main',
            priority: 1,
            isValid: true,
            isWhatsapp: false
          })
          break
        default:
          (prospect as any)[targetField] = value
      }
    })
    
    return prospect
  }
}

// ===== SERVICES =====

export class ProspectEnrichmentService {
  /**
   * Calculer le score de qualité
   */
  static calculateQualityScore(prospect: ProspectEnriched): number {
    let score = 0
    
    // Emails validés (+20)
    const validEmails = prospect.emails.filter(e => e.isValid).length
    score += Math.min(validEmails * 10, 20)
    
    // Téléphones (+15)
    const phones = prospect.phones.length
    score += Math.min(phones * 10, 15)
    
    // Réseaux sociaux (+15)
    const social = prospect.socialMedia.length
    score += Math.min(social * 5, 15)
    
    // Coordonnées GPS (+10)
    if (prospect.coordinates) score += 10
    
    // Métriques Google (+20)
    const googleMetric = prospect.metrics.find(m => m.source === 'google')
    if (googleMetric?.rating && googleMetric.rating > 4.0) score += 20
    
    // Business actif (+20)
    if (prospect.businessStatus === 'OPERATIONAL') score += 20
    
    return Math.min(score, 100)
  }
  
  /**
   * Détecter les doublons potentiels
   */
  static findDuplicates(
    prospect: Partial<ProspectEnriched>,
    existingProspects: ProspectEnriched[]
  ): DuplicateMatch[] {
    const matches: DuplicateMatch[] = []
    
    existingProspects.forEach(existing => {
      let score = 0
      const criteria: any = {}
      
      // Match sur Google CID (40 points)
      if (prospect.coordinates?.googleCid && 
          existing.coordinates?.googleCid === prospect.coordinates.googleCid) {
        score += 40
        criteria.googleCid = true
      }
      
      // Match sur email (30 points)
      const prospectEmails = prospect.emails?.map(e => e.email.toLowerCase()) || []
      const existingEmails = existing.emails.map(e => e.email.toLowerCase())
      if (prospectEmails.some(e => existingEmails.includes(e))) {
        score += 30
        criteria.email = true
      }
      
      // Match sur téléphone (20 points)
      const prospectPhones = prospect.phones?.map(p => p.phoneNumber.replace(/\D/g, '')) || []
      const existingPhones = existing.phones.map(p => p.phoneNumber.replace(/\D/g, ''))
      if (prospectPhones.some(p => existingPhones.includes(p))) {
        score += 20
        criteria.phone = true
      }
      
      // Match sur proximité géographique (10 points)
      if (prospect.coordinates && existing.coordinates) {
        const distance = this.calculateDistance(
          prospect.coordinates.latitude,
          prospect.coordinates.longitude,
          existing.coordinates.latitude,
          existing.coordinates.longitude
        )
        if (distance < 0.1) { // 100 mètres
          score += 10
          criteria.coordinates = true
        }
      }
      
      if (score >= 30) { // Seuil minimum
        matches.push({
          prospectId: existing.id,
          matchScore: score,
          matchCriteria: criteria
        })
      }
    })
    
    return matches.sort((a, b) => b.matchScore - a.matchScore)
  }
  
  /**
   * Calculer la distance entre deux points (en km)
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
  
  /**
   * Fusionner deux prospects
   */
  static mergeProspects(
    primary: ProspectEnriched,
    secondary: ProspectEnriched
  ): ProspectEnriched {
    // Prendre les données du primaire comme base
    const merged = { ...primary }
    
    // Fusionner les emails (sans doublons)
    const emailSet = new Set(primary.emails.map(e => e.email.toLowerCase()))
    secondary.emails.forEach(email => {
      if (!emailSet.has(email.email.toLowerCase())) {
        merged.emails.push({ ...email, priority: merged.emails.length + 1 })
      }
    })
    
    // Fusionner les téléphones
    const phoneSet = new Set(primary.phones.map(p => p.phoneNumber.replace(/\D/g, '')))
    secondary.phones.forEach(phone => {
      if (!phoneSet.has(phone.phoneNumber.replace(/\D/g, ''))) {
        merged.phones.push({ ...phone, priority: merged.phones.length + 1 })
      }
    })
    
    // Fusionner les réseaux sociaux
    const socialMap = new Map(primary.socialMedia.map(s => [s.platform, s]))
    secondary.socialMedia.forEach(social => {
      if (!socialMap.has(social.platform)) {
        merged.socialMedia.push(social)
      }
    })
    
    // Prendre les meilleures métriques
    secondary.metrics.forEach(metric => {
      const existing = merged.metrics.find(m => m.source === metric.source)
      if (!existing) {
        merged.metrics.push(metric)
      } else if ((metric.reviewsCount || 0) > (existing.reviewsCount || 0)) {
        Object.assign(existing, metric)
      }
    })
    
    // Recalculer le score de qualité
    merged.qualityScore = this.calculateQualityScore(merged)
    
    return merged
  }
}
