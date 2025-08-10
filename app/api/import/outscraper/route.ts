// app/api/import/outscraper/route.ts
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// ============================================
// VERSION QUI GÉNÈRE LE SQL SANS DÉPENDANCES
// ============================================

interface OutscraperRow {
  name?: string
  site?: string
  phone?: string
  full_address?: string
  city?: string
  postal_code?: string
  latitude?: number
  longitude?: number
  google_id?: string
  place_id?: string
  cid?: string
  business_status?: string
  rating?: string
  reviews?: string
  photos_count?: string
  
  // Emails multiples
  email_1?: string
  'email_1.emails_validator.status'?: string
  'email_1.emails_validator.status_details'?: string
  email_1_full_name?: string
  email_1_first_name?: string
  email_1_last_name?: string
  email_1_title?: string
  
  email_2?: string
  'email_2.emails_validator.status'?: string
  email_2_full_name?: string
  
  email_3?: string
  'email_3.emails_validator.status'?: string
  
  // Téléphones multiples
  phone_1?: string
  'phone_1.phones_enricher.carrier_name'?: string
  'phone_1.phones_enricher.carrier_type'?: string
  
  phone_2?: string
  'phone_2.phones_enricher.carrier_type'?: string
  
  // Réseaux sociaux
  facebook?: string
  instagram?: string
  linkedin?: string
  twitter?: string
  youtube?: string
  whatsapp?: string
  
  [key: string]: any
}

interface ProcessedProspect {
  mainData: any
  emails: any[]
  phones: any[]
  socialMedia: any[]
  metrics: any
  enrichmentData: any
}

// ============================================
// FONCTION PRINCIPALE D'IMPORT
// ============================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const options = JSON.parse(formData.get('options') as string || '{}')
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }
    
    // Lire le fichier
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rawData = XLSX.utils.sheet_to_json<OutscraperRow>(sheet)
    
    console.log(`📊 Traitement de ${rawData.length} lignes depuis ${file.name}`)
    
    // Créer un batch ID
    const batchId = `outscraper_${Date.now()}`
    
    // Générer toutes les requêtes SQL
    const sqlQueries: string[] = []
    const processedData: ProcessedProspect[] = []
    const stats = {
      total: rawData.length,
      processed: 0,
      withEmails: 0,
      withPhones: 0,
      withSocial: 0,
      withCoordinates: 0
    }
    
    // Commencer la transaction
    sqlQueries.push('BEGIN;')
    
    // Créer le batch d'import
    sqlQueries.push(`
      INSERT INTO import_batches (
        id, filename, file_type, source, total_rows, 
        status, started_at, created_at
      ) VALUES (
        '${batchId}', 
        '${file.name.replace(/'/g, "''")}', 
        'xlsx', 
        'outscraper', 
        ${rawData.length},
        'processing', 
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      );
    `)
    
    // Traiter chaque ligne
    rawData.forEach((row, index) => {
      try {
        const processed = processRow(row, batchId, index + 1)
        processedData.push(processed)
        
        // Générer les requêtes SQL pour ce prospect
        const prospectSql = generateProspectSQL(processed, index + 1)
        sqlQueries.push(...prospectSql)
        
        // Mettre à jour les stats
        stats.processed++
        if (processed.emails.length > 0) stats.withEmails++
        if (processed.phones.length > 0) stats.withPhones++
        if (processed.socialMedia.length > 0) stats.withSocial++
        if (processed.mainData.latitude && processed.mainData.longitude) stats.withCoordinates++
        
      } catch (error) {
        console.error(`Erreur ligne ${index + 1}:`, error)
      }
    })
    
    // Finaliser le batch
    sqlQueries.push(`
      UPDATE import_batches
      SET 
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        imported_rows = ${stats.processed},
        skipped_rows = ${rawData.length - stats.processed}
      WHERE id = '${batchId}';
    `)
    
    // Mettre à jour les scores de qualité
    sqlQueries.push(`
      UPDATE prospects p
      SET quality_score = calculate_quality_score(p.id)
      WHERE p.import_batch_id = '${batchId}';
    `)
    
    // Rafraîchir la vue matérialisée
    sqlQueries.push('REFRESH MATERIALIZED VIEW prospect_full_view;')
    
    // Commit
    sqlQueries.push('COMMIT;')
    
    // Option 1: Retourner le SQL à exécuter
    if (options.returnSQL) {
      return NextResponse.json({
        success: true,
        batchId,
        stats,
        sql: sqlQueries.join('\n'),
        message: 'SQL généré avec succès. Copiez et exécutez dans votre base de données.'
      })
    }
    
    // Option 2: Sauvegarder dans un fichier
    const sqlContent = sqlQueries.join('\n')
    const sqlBlob = new Blob([sqlContent], { type: 'text/sql' })
    
    // Option 3: Retourner les données transformées en JSON
    return NextResponse.json({
      success: true,
      batchId,
      stats,
      data: processedData,
      sqlFile: {
        content: sqlContent,
        filename: `import_${batchId}.sql`,
        lines: sqlQueries.length
      },
      message: `${stats.processed} prospects traités. Téléchargez le fichier SQL pour importer dans votre base.`
    })
    
  } catch (error: any) {
    console.error('Erreur import:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement', details: error.message },
      { status: 500 }
    )
  }
}

// ============================================
// TRAITEMENT DES DONNÉES
// ============================================

function processRow(row: OutscraperRow, batchId: string, rowIndex: number): ProcessedProspect {
  // Données principales du prospect
  const mainData = {
    nom: escapeSql(row.name || `Sans nom #${rowIndex}`),
    secteur: detectSector(row.name || ''),
    ville: escapeSql(row.city || ''),
    district: detectDistrict(row.city || row.full_address || ''),
    statut: 'nouveau',
    contact: escapeSql(extractMainContact(row)),
    telephone: escapeSql(row.phone || row.phone_1 || ''),
    email: escapeSql(row.email_1 || ''),
    score: 3,
    budget: 'À définir',
    notes: escapeSql(`Import Outscraper ${new Date().toLocaleDateString('fr-FR')}`),
    adresse: escapeSql(row.full_address || ''),
    website: escapeSql(row.site || ''),
    latitude: row.latitude ? parseFloat(String(row.latitude)) : null,
    longitude: row.longitude ? parseFloat(String(row.longitude)) : null,
    google_place_id: escapeSql(row.place_id || ''),
    google_cid: escapeSql(row.google_id || row.cid || ''),
    business_status: row.business_status || 'OPERATIONAL',
    data_source: 'outscraper',
    import_batch_id: batchId,
    is_verified: false
  }
  
  // Emails
  const emails = []
  if (row.email_1) {
    emails.push({
      email: escapeSql(row.email_1),
      email_type: 'primary',
      is_valid: row['email_1.emails_validator.status'] === 'valid',
      validation_status: row['email_1.emails_validator.status'] || null,
      validation_details: escapeSql(row['email_1.emails_validator.status_details'] || ''),
      full_name: escapeSql(row.email_1_full_name || ''),
      first_name: escapeSql(row.email_1_first_name || ''),
      last_name: escapeSql(row.email_1_last_name || ''),
      job_title: escapeSql(row.email_1_title || ''),
      priority: 1,
      is_active: true
    })
  }
  if (row.email_2) {
    emails.push({
      email: escapeSql(row.email_2),
      email_type: 'secondary',
      is_valid: row['email_2.emails_validator.status'] === 'valid',
      validation_status: row['email_2.emails_validator.status'] || null,
      full_name: escapeSql(row.email_2_full_name || ''),
      priority: 2,
      is_active: true
    })
  }
  if (row.email_3) {
    emails.push({
      email: escapeSql(row.email_3),
      email_type: 'secondary',
      is_valid: row['email_3.emails_validator.status'] === 'valid',
      validation_status: row['email_3.emails_validator.status'] || null,
      priority: 3,
      is_active: true
    })
  }
  
  // Téléphones
  const phones = []
  if (row.phone) {
    phones.push({
      phone_number: escapeSql(row.phone),
      phone_type: 'main',
      formatted_number: formatMauritianPhone(row.phone),
      carrier_name: escapeSql(row['phone.phones_enricher.carrier_name'] || ''),
      carrier_type: row['phone.phones_enricher.carrier_type'] || null,
      is_whatsapp: row['phone.phones_enricher.carrier_type'] === 'mobile',
      priority: 1
    })
  }
  if (row.phone_1 && row.phone_1 !== row.phone) {
    phones.push({
      phone_number: escapeSql(row.phone_1),
      phone_type: 'secondary',
      formatted_number: formatMauritianPhone(row.phone_1),
      carrier_name: escapeSql(row['phone_1.phones_enricher.carrier_name'] || ''),
      carrier_type: row['phone_1.phones_enricher.carrier_type'] || null,
      priority: 2
    })
  }
  if (row.phone_2) {
    phones.push({
      phone_number: escapeSql(row.phone_2),
      phone_type: 'secondary',
      formatted_number: formatMauritianPhone(row.phone_2),
      carrier_type: row['phone_2.phones_enricher.carrier_type'] || null,
      priority: 3
    })
  }
  
  // Réseaux sociaux
  const socialMedia = []
  const socialPlatforms = [
    { platform: 'facebook', url: row.facebook },
    { platform: 'instagram', url: row.instagram },
    { platform: 'linkedin', url: row.linkedin },
    { platform: 'twitter', url: row.twitter },
    { platform: 'youtube', url: row.youtube },
    { platform: 'whatsapp', url: row.whatsapp }
  ]
  
  socialPlatforms.forEach(social => {
    if (social.url) {
      socialMedia.push({
        platform: social.platform,
        url: escapeSql(social.url)
      })
    }
  })
  
  // Métriques
  const metrics = {
    source: 'google',
    rating: row.rating ? parseFloat(row.rating) : null,
    reviews_count: row.reviews ? parseInt(row.reviews) : 0,
    reviews_link: escapeSql(row.reviews_link || ''),
    photos_count: row.photos_count ? parseInt(row.photos_count) : 0
  }
  
  // Données d'enrichissement
  const enrichmentData = {
    source: 'outscraper',
    data_type: 'full_data',
    raw_data: JSON.stringify(row),
    processed: true
  }
  
  return {
    mainData,
    emails,
    phones,
    socialMedia,
    metrics: (metrics.rating || metrics.reviews_count) ? metrics : null,
    enrichmentData
  }
}

// ============================================
// GÉNÉRATION SQL
// ============================================

function generateProspectSQL(prospect: ProcessedProspect, index: number): string[] {
  const queries: string[] = []
  const tempId = 1000000 + index // ID temporaire pour les relations
  
  // 1. Insérer le prospect principal
  const prospectSQL = `
    -- Prospect ${index}: ${prospect.mainData.nom}
    WITH new_prospect AS (
      INSERT INTO prospects (
        nom, secteur, ville, district, statut, contact, 
        telephone, email, score, budget, notes, adresse, website,
        latitude, longitude, google_place_id, google_cid,
        business_status, data_source, import_batch_id, is_verified,
        created_at, updated_at
      ) VALUES (
        '${prospect.mainData.nom}',
        '${prospect.mainData.secteur}',
        '${prospect.mainData.ville}',
        '${prospect.mainData.district}',
        '${prospect.mainData.statut}',
        '${prospect.mainData.contact}',
        '${prospect.mainData.telephone}',
        '${prospect.mainData.email}',
        ${prospect.mainData.score},
        '${prospect.mainData.budget}',
        '${prospect.mainData.notes}',
        '${prospect.mainData.adresse}',
        '${prospect.mainData.website}',
        ${prospect.mainData.latitude || 'NULL'},
        ${prospect.mainData.longitude || 'NULL'},
        ${prospect.mainData.google_place_id ? `'${prospect.mainData.google_place_id}'` : 'NULL'},
        ${prospect.mainData.google_cid ? `'${prospect.mainData.google_cid}'` : 'NULL'},
        '${prospect.mainData.business_status}',
        '${prospect.mainData.data_source}',
        '${prospect.mainData.import_batch_id}',
        ${prospect.mainData.is_verified},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (google_cid) WHERE google_cid IS NOT NULL DO NOTHING
      RETURNING id
    )
    SELECT id INTO TEMP temp_prospect_id_${index} FROM new_prospect;
  `
  queries.push(prospectSQL)
  
  // 2. Insérer les emails
  prospect.emails.forEach((email, emailIndex) => {
    queries.push(`
      INSERT INTO prospect_emails (
        prospect_id, email, email_type, is_valid, validation_status,
        validation_details, full_name, first_name, last_name, 
        job_title, priority, is_active, created_at
      ) 
      SELECT 
        id,
        '${email.email}',
        '${email.email_type}',
        ${email.is_valid},
        ${email.validation_status ? `'${email.validation_status}'` : 'NULL'},
        ${email.validation_details ? `'${email.validation_details}'` : 'NULL'},
        ${email.full_name ? `'${email.full_name}'` : 'NULL'},
        ${email.first_name ? `'${email.first_name}'` : 'NULL'},
        ${email.last_name ? `'${email.last_name}'` : 'NULL'},
        ${email.job_title ? `'${email.job_title}'` : 'NULL'},
        ${email.priority},
        ${email.is_active},
        CURRENT_TIMESTAMP
      FROM temp_prospect_id_${index}
      ON CONFLICT (prospect_id, email) DO NOTHING;
    `)
  })
  
  // 3. Insérer les téléphones
  prospect.phones.forEach((phone) => {
    queries.push(`
      INSERT INTO prospect_phones (
        prospect_id, phone_number, phone_type, formatted_number,
        carrier_name, carrier_type, is_whatsapp, is_valid, priority, created_at
      )
      SELECT 
        id,
        '${phone.phone_number}',
        '${phone.phone_type}',
        '${phone.formatted_number}',
        ${phone.carrier_name ? `'${phone.carrier_name}'` : 'NULL'},
        ${phone.carrier_type ? `'${phone.carrier_type}'` : 'NULL'},
        ${phone.is_whatsapp || false},
        true,
        ${phone.priority},
        CURRENT_TIMESTAMP
      FROM temp_prospect_id_${index}
      ON CONFLICT (prospect_id, phone_number) DO NOTHING;
    `)
  })
  
  // 4. Insérer les réseaux sociaux
  prospect.socialMedia.forEach((social) => {
    queries.push(`
      INSERT INTO prospect_social_media (
        prospect_id, platform, url, created_at
      )
      SELECT 
        id,
        '${social.platform}',
        '${social.url}',
        CURRENT_TIMESTAMP
      FROM temp_prospect_id_${index}
      ON CONFLICT (prospect_id, platform) DO NOTHING;
    `)
  })
  
  // 5. Insérer les métriques
  if (prospect.metrics) {
    queries.push(`
      INSERT INTO prospect_metrics (
        prospect_id, source, rating, reviews_count, 
        reviews_link, photos_count, updated_at
      )
      SELECT 
        id,
        '${prospect.metrics.source}',
        ${prospect.metrics.rating || 'NULL'},
        ${prospect.metrics.reviews_count},
        ${prospect.metrics.reviews_link ? `'${prospect.metrics.reviews_link}'` : 'NULL'},
        ${prospect.metrics.photos_count},
        CURRENT_TIMESTAMP
      FROM temp_prospect_id_${index}
      ON CONFLICT (prospect_id, source) 
      DO UPDATE SET
        rating = EXCLUDED.rating,
        reviews_count = EXCLUDED.reviews_count,
        photos_count = EXCLUDED.photos_count,
        updated_at = CURRENT_TIMESTAMP;
    `)
  }
  
  // 6. Nettoyer la table temporaire
  queries.push(`DROP TABLE IF EXISTS temp_prospect_id_${index};`)
  
  return queries
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function escapeSql(str: string | null | undefined): string {
  if (!str) return ''
  return String(str).replace(/'/g, "''")
}

function detectSector(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('hotel') || n.includes('resort')) return 'hotel'
  if (n.includes('restaurant')) return 'restaurant'
  if (n.includes('pharmac')) return 'pharmacie'
  if (n.includes('clinic') || n.includes('hospital')) return 'clinique'
  if (n.includes('assurance') || n.includes('insurance')) return 'assurance'
  if (n.includes('bank') || n.includes('banque')) return 'banque'
  if (n.includes('immobilier') || n.includes('real estate')) return 'immobilier'
  return 'autre'
}

function detectDistrict(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('port louis')) return 'port-louis'
  if (t.includes('curepipe') || t.includes('quatre bornes')) return 'plaines-wilhems'
  if (t.includes('grand baie') || t.includes('pereybere')) return 'riviere-du-rempart'
  if (t.includes('mahebourg') || t.includes('blue bay')) return 'grand-port'
  if (t.includes('flic en flac') || t.includes('tamarin')) return 'black-river'
  if (t.includes('belle mare') || t.includes('flacq')) return 'flacq'
  if (t.includes('moka')) return 'moka'
  if (t.includes('pamplemousses')) return 'pamplemousses'
  if (t.includes('souillac') || t.includes('savanne')) return 'savanne'
  return 'port-louis'
}

function extractMainContact(row: OutscraperRow): string {
  if (row.email_1_full_name) return row.email_1_full_name
  if (row.email_2_full_name) return row.email_2_full_name
  if (row.owner_title) return row.owner_title
  return 'Direction'
}

function formatMauritianPhone(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('230')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
  }
  if (cleaned.length === 7 || cleaned.length === 8) {
    return `+230 ${cleaned}`
  }
  return phone
}

// ============================================
// ROUTE POUR TÉLÉCHARGER LE SQL
// ============================================

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API d\'import Outscraper',
    endpoints: {
      POST: 'Envoyer un fichier Excel/CSV pour générer le SQL d\'import',
      options: {
        returnSQL: 'Retourne le SQL directement dans la réponse',
        skipDuplicates: 'Ignore les doublons basés sur Google ID'
      }
    },
    example: 'POST /api/import/outscraper avec FormData contenant file et options'
  })
}
