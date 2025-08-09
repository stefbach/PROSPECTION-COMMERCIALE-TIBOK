// lib/geocoding-mauritius.ts

// Limites géographiques de l'Île Maurice
export const MAURITIUS_BOUNDS = {
  north: -19.9802,
  south: -20.5259,
  east: 57.8130,
  west: 57.3051
}

// Coordonnées des principales villes
export const MAURITIUS_CITIES: Record<string, { lat: number; lng: number; region: string }> = {
  'port louis': { lat: -20.1609, lng: 57.4989, region: 'port-louis' },
  'curepipe': { lat: -20.3159, lng: 57.5242, region: 'plaines-wilhems' },
  'quatre bornes': { lat: -20.2669, lng: 57.4791, region: 'plaines-wilhems' },
  'vacoas': { lat: -20.2988, lng: 57.4784, region: 'plaines-wilhems' },
  'phoenix': { lat: -20.3006, lng: 57.4963, region: 'plaines-wilhems' },
  'rose hill': { lat: -20.2383, lng: 57.4683, region: 'plaines-wilhems' },
  'beau bassin': { lat: -20.2333, lng: 57.4667, region: 'plaines-wilhems' },
  'mahebourg': { lat: -20.4073, lng: 57.7003, region: 'grand-port' },
  'centre de flacq': { lat: -20.1897, lng: 57.7183, region: 'flacq' },
  'triolet': { lat: -20.0547, lng: 57.5453, region: 'pamplemousses' },
  'goodlands': { lat: -20.0350, lng: 57.6553, region: 'riviere-du-rempart' },
  'grand baie': { lat: -20.0064, lng: 57.5805, region: 'riviere-du-rempart' },
  'le morne': { lat: -20.4490, lng: 57.3102, region: 'riviere-noire' },
  'flic en flac': { lat: -20.2744, lng: 57.3631, region: 'riviere-noire' },
  'tamarin': { lat: -20.3257, lng: 57.3705, region: 'riviere-noire' },
  'belle mare': { lat: -20.1897, lng: 57.7613, region: 'flacq' },
  'trou d\'eau douce': { lat: -20.2369, lng: 57.7897, region: 'flacq' },
  'souillac': { lat: -20.5167, lng: 57.5167, region: 'savanne' },
  'chemin grenier': { lat: -20.4886, lng: 57.4658, region: 'savanne' },
  'moka': { lat: -20.2333, lng: 57.5833, region: 'moka' },
  'saint pierre': { lat: -20.2178, lng: 57.5208, region: 'moka' },
  'pamplemousses': { lat: -20.1039, lng: 57.5703, region: 'pamplemousses' },
  'grand gaube': { lat: -20.0064, lng: 57.6608, region: 'riviere-du-rempart' },
  'cap malheureux': { lat: -19.9847, lng: 57.6144, region: 'riviere-du-rempart' },
  'blue bay': { lat: -20.4447, lng: 57.7133, region: 'grand-port' },
  'pereybere': { lat: -19.9950, lng: 57.5894, region: 'riviere-du-rempart' },
  'poste de flacq': { lat: -20.1628, lng: 57.7303, region: 'flacq' },
  'bel ombre': { lat: -20.5011, lng: 57.4058, region: 'savanne' },
  'rodrigues': { lat: -19.7245, lng: 63.4278, region: 'rodrigues' }
}

// Service de géocodage
export class GeocodingService {
  private static readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
  private static readonly RATE_LIMIT_MS = 1000 // 1 requête par seconde
  private static lastRequestTime = 0

  /**
   * Géocoder une adresse à Maurice
   */
  static async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    // D'abord essayer de trouver dans notre base de villes
    const normalizedAddress = address.toLowerCase()
    for (const [city, coords] of Object.entries(MAURITIUS_CITIES)) {
      if (normalizedAddress.includes(city)) {
        return { lat: coords.lat, lng: coords.lng }
      }
    }

    // Sinon utiliser Nominatim
    try {
      // Respecter le rate limit
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_MS - timeSinceLastRequest))
      }
      this.lastRequestTime = Date.now()

      const params = new URLSearchParams({
        q: `${address}, Mauritius`,
        format: 'json',
        limit: '1',
        countrycodes: 'mu',
        viewbox: `${MAURITIUS_BOUNDS.west},${MAURITIUS_BOUNDS.north},${MAURITIUS_BOUNDS.east},${MAURITIUS_BOUNDS.south}`,
        bounded: '1'
      })

      const response = await fetch(`${this.NOMINATIM_URL}?${params}`)
      
      if (!response.ok) {
        console.error('Erreur géocodage:', response.statusText)
        return null
      }

      const data = await response.json()
      
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        }
      }
    } catch (error) {
      console.error('Erreur géocodage:', error)
    }

    return null
  }

  /**
   * Calculer la distance entre deux points (en km)
   */
  static calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 6371 // Rayon de la Terre en km
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Déterminer la région basée sur les coordonnées
   */
  static detectRegionFromCoordinates(lat: number, lng: number): string {
    let minDistance = Infinity
    let closestRegion = 'autre'

    for (const [city, data] of Object.entries(MAURITIUS_CITIES)) {
      const distance = this.calculateDistance(lat, lng, data.lat, data.lng)
      if (distance < minDistance) {
        minDistance = distance
        closestRegion = data.region
      }
    }

    return closestRegion
  }

  /**
   * Optimiser un itinéraire (algorithme simple du plus proche voisin)
   */
  static optimizeRoute(
    prospects: Array<{ id: number; lat: number; lng: number; nom: string }>,
    startLat: number,
    startLng: number
  ): Array<{ prospect: any; distance: number; duration: number }> {
    if (prospects.length === 0) return []

    const result = []
    const remaining = [...prospects]
    let currentLat = startLat
    let currentLng = startLng

    while (remaining.length > 0) {
      let minDistance = Infinity
      let nearestIndex = 0

      // Trouver le prospect le plus proche
      for (let i = 0; i < remaining.length; i++) {
        const distance = this.calculateDistance(
          currentLat, currentLng,
          remaining[i].lat, remaining[i].lng
        )
        
        if (distance < minDistance) {
          minDistance = distance
          nearestIndex = i
        }
      }

      const nearest = remaining.splice(nearestIndex, 1)[0]
      
      result.push({
        prospect: nearest,
        distance: minDistance,
        duration: this.estimateDuration(minDistance)
      })

      currentLat = nearest.lat
      currentLng = nearest.lng
    }

    return result
  }

  /**
   * Estimer la durée de trajet (en minutes)
   */
  static estimateDuration(distanceKm: number): number {
    // Estimation basée sur une vitesse moyenne de 40 km/h à Maurice
    // (compte tenu du traffic et des conditions routières)
    const avgSpeedKmh = 40
    const durationHours = distanceKm / avgSpeedKmh
    return Math.round(durationHours * 60)
  }

  /**
   * Convertir en radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Géocoder en masse avec gestion du rate limit
   */
  static async geocodeBatch(
    addresses: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Array<{ address: string; coords: { lat: number; lng: number } | null }>> {
    const results = []
    
    for (let i = 0; i < addresses.length; i++) {
      const coords = await this.geocodeAddress(addresses[i])
      results.push({ address: addresses[i], coords })
      
      if (onProgress) {
        onProgress(i + 1, addresses.length)
      }
      
      // Pause entre les requêtes pour respecter le rate limit
      if (i < addresses.length - 1) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_MS))
      }
    }
    
    return results
  }
}

// Fonction utilitaire pour formater une adresse mauricienne
export function formatMauritianAddress(parts: {
  street?: string
  city?: string
  postalCode?: string | number
  region?: string
}): string {
  const components = []
  
  if (parts.street) components.push(parts.street)
  if (parts.city) components.push(parts.city)
  if (parts.postalCode) components.push(String(parts.postalCode))
  if (parts.region && parts.region !== 'autre') {
    components.push(parts.region.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()))
  }
  
  components.push('Mauritius')
  
  return components.join(', ')
}

// Export des constantes utiles
export const MAURITIUS_REGIONS = [
  { value: 'port-louis', label: 'Port Louis' },
  { value: 'plaines-wilhems', label: 'Plaines Wilhems' },
  { value: 'moka', label: 'Moka' },
  { value: 'flacq', label: 'Flacq' },
  { value: 'grand-port', label: 'Grand Port' },
  { value: 'pamplemousses', label: 'Pamplemousses' },
  { value: 'riviere-du-rempart', label: 'Rivière du Rempart' },
  { value: 'savanne', label: 'Savanne' },
  { value: 'riviere-noire', label: 'Rivière Noire' },
  { value: 'rodrigues', label: 'Rodrigues' }
]
