// app/api/import/batch/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { CITY_TO_DISTRICT_MAP, SECTOR_KEYWORDS } from '@/lib/mauritius-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, options } = body
    
    const result = {
      success: false,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      duplicates: [],
      withGPS: 0,
      withoutGPS: 0
    }
    
    for (const item of data) {
      try {
        // Enrichir avec les données calculées
        const enriched = {
          ...item,
          // Calculer zone commerciale
          zone_commerciale: `${item.district} - ${item.ville || 'Zone'}`,
          
          // Score de qualité finale
          quality_score: calculateQualityScore(item),
          
          // Priorité commerciale
          priority: item.quality_score >= 80 ? 'Haute' : 
                   item.quality_score >= 60 ? 'Moyenne' : 'Basse',
          
          // Tracking GPS
          has_valid_coordinates: !!(item.latitude && item.longitude)
        }
        
        // Stats GPS
        if (enriched.has_valid_coordinates) {
          result.withGPS++
        } else {
          result.withoutGPS++
        }
        
        // Vérifier les doublons par Google ID si disponible
        if (enriched.google_place_id) {
          const existing = await checkDuplicateByGoogleId(enriched.google_place_id)
          if (existing && options.skipDuplicates) {
            result.skipped++
            result.duplicates.push(enriched.nom)
            continue
          }
        }
        
        // Créer le prospect
        await createProspect(enriched)
        result.imported++
        
        // Si pas de GPS, lancer la géolocalisation en arrière-plan
        if (!enriched.has_valid_coordinates && enriched.adresse) {
          geocodeInBackground(enriched)
        }
        
      } catch (error) {
        result.errors.push(`Erreur pour ${item.nom}: ${error.message}`)
        result.skipped++
      }
    }
    
    result.success = true
    
    return NextResponse.json(result)
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur import', details: error.message },
      { status: 500 }
    )
  }
}

// Fonction de géocodage asynchrone
async function geocodeInBackground(prospect: any) {
  try {
    const query = `${prospect.adresse}, ${prospect.ville}, Mauritius`
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=mu`
    )
    
    if (response.ok) {
      const data = await response.json()
      if (data.length > 0) {
        // Mettre à jour les coordonnées
        await updateProspectCoordinates(prospect.id, {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          has_valid_coordinates: true
        })
      }
    }
  } catch (error) {
    console.error(`Erreur géocodage pour ${prospect.nom}:`, error)
  }
}

function calculateQualityScore(item: any): number {
  let score = 0
  
  if (item.nom) score += 15
  if (item.latitude && item.longitude) score += 25
  if (item.adresse) score += 15
  if (item.telephone) score += 10
  if (item.email) score += 15
  if (item.website) score += 10
  if (item.rating) score += 5
  if (item.business_status === 'OPERATIONAL') score += 5
  
  return Math.min(score, 100)
}
