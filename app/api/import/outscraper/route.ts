// app/api/import/outscraper/route.ts
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// ============================================
// ADAPTEZ CES IMPORTS À VOTRE CONFIGURATION
// ============================================

// Option 1: Si vous utilisez Prisma
// import { prisma } from '@/lib/prisma'

// Option 2: Si vous utilisez pg directement
// import { Pool } from 'pg'
// const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// Option 3: Si vous utilisez Drizzle
// import { db } from '@/lib/db'

// Pour cet exemple, j'utilise pg directement
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// ============================================
// TYPES
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

// ============================================
// FONCTION PRINCIPALE D'IMPORT
// ============================================

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  
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
    
    console.log(`📊 Import de ${rawData.length} lignes depuis ${file.name}`)
    
    // Démarrer une transaction
    await client.query('BEGIN')
    
    // Créer un batch d'import
    const batchId = `outscraper_${Date.now()}`
    await createImportBatch(client, batchId, file.name, rawData.length)
    
    // Statistiques
    const stats = {
      total: rawData.length,
      imported: 0,
      skipped: 0,
      errors: 0,
      duplicates: [] as any[]
    }
    
    // Traiter par chunks pour éviter timeout
    const CHUNK_SIZE = 50
    for (let i = 0; i < rawData.length; i += CHUNK_SIZE) {
      const chunk = rawData.slice(i, i + CHUNK_SIZE)
      
      try {
        const results = await processChunk(client, chunk, batchId, options)
        stats.imported += results.imported
        stats.skipped += results.skipped
        stats.duplicates.push(...results.duplicates)
      } catch (error) {
        console.error(`Erreur chunk ${i}-${i + CHUNK_SIZE}:`, error)
        stats.errors += chunk.length
      }
      
      // Mettre à jour la progression
      await updateImportProgress(client, batchId, stats)
    }
    
    // Finaliser l'import
    await finalizeImport(client, batchId, stats)
    
    // Commit la transaction
    await client.query('COMMIT')
    
    // Rafraîchir la vue matérialisée
    await client.query('REFRESH MATERIALIZED VIEW prospect_full_view')
    
    return NextResponse.json({
      success: true,
      batchId,
      stats,
      message: `Import terminé: ${stats.imported} prospects importés, ${stats.skipped} ignorés`
    })
    
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error('Erreur import:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'import', details: error.message },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

// ============================================
// FONCTIONS DE TRAITEMENT
// ============================================

async function processChunk(
  client: any,
  chunk: OutscraperRow[],
  batchId: string,
  options: any
) {
  const results = { imported: 0, skipped: 0, duplicates: [] as any[] }
  
  for (const row of chunk) {
    try {
      // 1. Vérifier les doublons
      if (options.skipDuplicates) {
        const duplicate = await checkDuplicate(client, row)
        if (duplicate) {
          results.duplicates.push({
            name: row.name,
            matchedWith: duplicate.prospect_id,
            score: duplicate.match_score
          })
          results.skipped++
          continue
        }
      }
      
      // 2. Transformer les données
      const prospectData = transformOutscraperData(row, batchId)
      
      // 3. Insérer le prospect principal
      const prospect = await insertProspect(client, prospectData)
      
      if (prospect) {
        // 4. Insérer les données relationnelles
        await Promise.all([
          insertEmails(client, prospect.id, row),
          insertPhones(client, prospect.id, row),
          insertSocialMedia(client, prospect.id, row),
          insertMetrics(client, prospect.id, row),
          insertEnrichmentData(client, prospect.id, row)
        ])
        
        // 5. Calculer le score de qualité
        await client.query(
          'UPDATE prospects SET quality_score = calculate_quality_score($1) WHERE id = $1',
          [prospect.id]
        )
        
        results.imported++
      }
    } catch (error) {
      console.error('Erreur traitement ligne:', error, row.name)
      results.skipped++
    }
  }
  
  return results
}

// Transformer les données Outscraper
function transformOutscraperData(row: OutscraperRow, batchId: string) {
  return {
    nom: row.name || 'Sans nom',
    secteur: detectSector(row.name || ''),
    ville: row.city || '',
    district: detectDistrict(row.city || row.full_address || ''),
    statut: 'nouveau',
    contact: extractMainContact(row),
    telephone: row.phone || row.phone_1 || '',
    email: row.email_1 || '',
    score: 3,
    budget: 'À définir',
    notes: `Import Outscraper ${new Date().toLocaleDateString('fr-FR')}`,
    adresse: row.full_address || '',
    website: row.site || '',
    latitude: row.latitude ? parseFloat(String(row.latitude)) : null,
    longitude: row.longitude ? parseFloat(String(row.longitude)) : null,
    google_place_id: row.place_id || null,
    google_cid: row.google_id || row.cid || null,
    business_status: row.business_status || 'OPERATIONAL',
    data_source: 'outscraper',
    import_batch_id: batchId,
    is_verified: false
  }
}

// Insérer le prospect principal
async function insertProspect(client: any, data: any) {
  try {
    const query = `
      INSERT INTO prospects (
        nom, secteur, ville, district, statut, contact, 
        telephone, email, score, budget, notes, adresse, website,
        latitude, longitude, google_place_id, google_cid,
        business_status, data_source, import_batch_id, is_verified
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21
      )
      RETURNING id, nom
    `
    
    const values = [
      data.nom, data.secteur, data.ville, data.district, data.statut,
      data.contact, data.telephone, data.email, data.score, data.budget,
      data.notes, data.adresse, data.website, data.latitude, data.longitude,
      data.google_place_id, data.google_cid, data.business_status,
      data.data_source, data.import_batch_id, data.is_verified
    ]
    
    const result = await client.query(query, values)
    return result.rows[0]
  } catch (error) {
    console.error('Erreur insertion prospect:', error)
    return null
  }
}

// Insérer les emails
async function insertEmails(client: any, prospectId: number, row: OutscraperRow) {
  const emails = []
  
  // Email 1
  if (row.email_1) {
    emails.push({
      prospect_id: prospectId,
      email: row.email_1,
      email_type: 'primary',
      is_valid: row['email_1.emails_validator.status'] === 'valid',
      validation_status: row['email_1.emails_validator.status'],
      validation_details: row['email_1.emails_validator.status_details'],
      full_name: row.email_1_full_name,
      first_name: row.email_1_first_name,
      last_name: row.email_1_last_name,
      job_title: row.email_1_title,
      priority: 1,
      is_active: true
    })
  }
  
  // Email 2
  if (row.email_2) {
    emails.push({
      prospect_id: prospectId,
      email: row.email_2,
      email_type: 'secondary',
      is_valid: row['email_2.emails_validator.status'] === 'valid',
      validation_status: row['email_2.emails_validator.status'],
      full_name: row.email_2_full_name,
      priority: 2,
      is_active: true
    })
  }
  
  // Email 3
  if (row.email_3) {
    emails.push({
      prospect_id: prospectId,
      email: row.email_3,
      email_type: 'secondary',
      is_valid: row['email_3.emails_validator.status'] === 'valid',
      validation_status: row['email_3.emails_validator.status'],
      priority: 3,
      is_active: true
    })
  }
  
  for (const emailData of emails) {
    try {
      const query = `
        INSERT INTO prospect_emails (
          prospect_id, email, email_type, is_valid, validation_status,
          validation_details, full_name, first_name, last_name, 
          job_title, priority, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (prospect_id, email) DO NOTHING
      `
      
      await client.query(query, [
        emailData.prospect_id, emailData.email, emailData.email_type,
        emailData.is_valid, emailData.validation_status,
        emailData.validation_details || null, emailData.full_name || null,
        emailData.first_name || null, emailData.last_name || null,
        emailData.job_title || null, emailData.priority, emailData.is_active
      ])
    } catch (error) {
      console.error('Erreur insertion email:', error)
    }
  }
}

// Insérer les téléphones
async function insertPhones(client: any, prospectId: number, row: OutscraperRow) {
  const phones = []
  
  // Téléphone principal
  if (row.phone) {
    phones.push({
      prospect_id: prospectId,
      phone_number: row.phone,
      phone_type: 'main',
      carrier_name: row['phone.phones_enricher.carrier_name'],
      carrier_type: row['phone.phones_enricher.carrier_type'],
      priority: 1
    })
  }
  
  // Téléphone 1
  if (row.phone_1 && row.phone_1 !== row.phone) {
    phones.push({
      prospect_id: prospectId,
      phone_number: row.phone_1,
      phone_type: 'secondary',
      carrier_name: row['phone_1.phones_enricher.carrier_name'],
      carrier_type: row['phone_1.phones_enricher.carrier_type'],
      priority: 2
    })
  }
  
  // Téléphone 2
  if (row.phone_2) {
    phones.push({
      prospect_id: prospectId,
      phone_number: row.phone_2,
      phone_type: 'secondary',
      carrier_type: row['phone_2.phones_enricher.carrier_type'],
      priority: 3
    })
  }
  
  for (const phoneData of phones) {
    try {
      const query = `
        INSERT INTO prospect_phones (
          prospect_id, phone_number, phone_type, formatted_number,
          carrier_name, carrier_type, is_whatsapp, is_valid, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (prospect_id, phone_number) DO NOTHING
      `
      
      await client.query(query, [
        phoneData.prospect_id, phoneData.phone_number, phoneData.phone_type,
        formatMauritianPhone(phoneData.phone_number),
        phoneData.carrier_name || null, phoneData.carrier_type || null,
        phoneData.carrier_type === 'mobile', true, phoneData.priority
      ])
    } catch (error) {
      console.error('Erreur insertion téléphone:', error)
    }
  }
}

// Insérer les réseaux sociaux
async function insertSocialMedia(client: any, prospectId: number, row: OutscraperRow) {
  const platforms = [
    { platform: 'facebook', url: row.facebook },
    { platform: 'instagram', url: row.instagram },
    { platform: 'linkedin', url: row.linkedin },
    { platform: 'twitter', url: row.twitter },
    { platform: 'youtube', url: row.youtube },
    { platform: 'whatsapp', url: row.whatsapp }
  ]
  
  for (const social of platforms) {
    if (social.url) {
      try {
        const query = `
          INSERT INTO prospect_social_media (prospect_id, platform, url)
          VALUES ($1, $2, $3)
          ON CONFLICT (prospect_id, platform) DO NOTHING
        `
        await client.query(query, [prospectId, social.platform, social.url])
      } catch (error) {
        console.error('Erreur insertion réseau social:', error)
      }
    }
  }
}

// Insérer les métriques
async function insertMetrics(client: any, prospectId: number, row: OutscraperRow) {
  if (row.rating || row.reviews) {
    try {
      const query = `
        INSERT INTO prospect_metrics (
          prospect_id, source, rating, reviews_count, 
          reviews_link, photos_count
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (prospect_id, source) 
        DO UPDATE SET
          rating = EXCLUDED.rating,
          reviews_count = EXCLUDED.reviews_count,
          photos_count = EXCLUDED.photos_count,
          updated_at = CURRENT_TIMESTAMP
      `
      
      await client.query(query, [
        prospectId, 'google',
        row.rating ? parseFloat(row.rating) : null,
        row.reviews ? parseInt(row.reviews) : 0,
        row.reviews_link || null,
        row.photos_count ? parseInt(row.photos_count) : 0
      ])
    } catch (error) {
      console.error('Erreur insertion métriques:', error)
    }
  }
}

// Insérer les données d'enrichissement brutes
async function insertEnrichmentData(client: any, prospectId: number, row: OutscraperRow) {
  try {
    const query = `
      INSERT INTO prospect_enrichment_data (
        prospect_id, source, data_type, raw_data, processed
      ) VALUES ($1, $2, $3, $4, $5)
    `
    
    await client.query(query, [
      prospectId, 'outscraper', 'full_data',
      JSON.stringify(row), true
    ])
  } catch (error) {
    console.error('Erreur insertion enrichment data:', error)
  }
}

// Vérifier les doublons
async function checkDuplicate(client: any, row: OutscraperRow) {
  try {
    const query = `
      SELECT * FROM find_duplicates($1, $2, $3, $4, $5, $6) LIMIT 1
    `
    
    const result = await client.query(query, [
      row.email_1 || null,
      row.phone || row.phone_1 || null,
      row.google_id || row.cid || null,
      row.name || null,
      row.latitude ? parseFloat(String(row.latitude)) : null,
      row.longitude ? parseFloat(String(row.longitude)) : null
    ])
    
    return result.rows[0] || null
  } catch (error) {
    console.error('Erreur vérification doublon:', error)
    return null
  }
}

// Créer un batch d'import
async function createImportBatch(client: any, id: string, filename: string, totalRows: number) {
  const query = `
    INSERT INTO import_batches (
      id, filename, file_type, source, total_rows, 
      status, started_at
    ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
  `
  
  await client.query(query, [
    id, filename, 'xlsx', 'outscraper', totalRows, 'processing'
  ])
}

// Mettre à jour la progression
async function updateImportProgress(client: any, batchId: string, stats: any) {
  const query = `
    UPDATE import_batches
    SET 
      imported_rows = $2,
      skipped_rows = $3,
      error_rows = $4
    WHERE id = $1
  `
  
  await client.query(query, [
    batchId, stats.imported, stats.skipped, stats.errors
  ])
}

// Finaliser l'import
async function finalizeImport(client: any, batchId: string, stats: any) {
  const query = `
    UPDATE import_batches
    SET 
      status = 'completed',
      completed_at = CURRENT_TIMESTAMP,
      imported_rows = $2,
      skipped_rows = $3,
      error_rows = $4
    WHERE id = $1
  `
  
  await client.query(query, [
    batchId, stats.imported, stats.skipped, stats.errors
  ])
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

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
