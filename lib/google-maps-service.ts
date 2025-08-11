// lib/google-maps-service.ts
// Service de calcul de distances avec Google Maps API

interface DistanceResult {
  distance: number; // en km
  duration: number; // en minutes
  distanceText: string; // format texte "23.5 km"
  durationText: string; // format texte "35 mins"
  durationInTraffic?: number; // durée avec traffic en minutes
  route?: string; // description de la route
  status: 'OK' | 'ERROR' | 'ZERO_RESULTS';
  method: 'google_maps' | 'fallback';
}

interface CacheEntry {
  result: DistanceResult;
  timestamp: number;
}

/**
 * Service Google Maps pour calculer les distances à Maurice
 */
export class GoogleMapsService {
  private apiKey: string;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheExpiry: number = 3600000; // 1 heure en ms
  private requestCount: number = 0;
  private lastResetDate: string = new Date().toDateString();

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Clé API Google Maps requise');
    }
    this.apiKey = apiKey;
    this.loadCache();
  }

  /**
   * Calcule la distance et le temps entre deux adresses
   */
  async calculateDistance(
    origin: string,
    destination: string,
    options?: {
      departureTime?: Date;
      avoidTolls?: boolean;
      avoidHighways?: boolean;
      useTraffic?: boolean;
    }
  ): Promise<DistanceResult> {
    // Vérifier et réinitialiser le compteur quotidien
    this.checkDailyReset();

    // Normaliser les adresses pour Maurice
    const normalizedOrigin = this.normalizeAddress(origin);
    const normalizedDestination = this.normalizeAddress(destination);
    
    // Vérifier le cache
    const cacheKey = `${normalizedOrigin}→${normalizedDestination}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`📦 Distance depuis le cache: ${cacheKey}`);
      return cached;
    }

    try {
      // Construire l'URL de l'API
      const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
      url.searchParams.append('origins', normalizedOrigin);
      url.searchParams.append('destinations', normalizedDestination);
      url.searchParams.append('mode', 'driving');
      url.searchParams.append('units', 'metric');
      url.searchParams.append('key', this.apiKey);
      url.searchParams.append('region', 'mu'); // Région Maurice
      url.searchParams.append('language', 'fr'); // Résultats en français

      // Options supplémentaires
      if (options?.departureTime) {
        url.searchParams.append('departure_time', Math.floor(options.departureTime.getTime() / 1000).toString());
      }
      if (options?.avoidTolls) {
        url.searchParams.append('avoid', 'tolls');
      }
      if (options?.useTraffic && options?.departureTime) {
        url.searchParams.append('traffic_model', 'best_guess');
      }

      console.log(`🌐 Appel Google Maps API: ${normalizedOrigin} → ${normalizedDestination}`);
      this.requestCount++;

      // Faire la requête
      const response = await fetch(url.toString());
      const data = await response.json();

      // Vérifier la réponse
      if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        
        const result: DistanceResult = {
          distance: Math.round(element.distance.value / 100) / 10, // en km avec 1 décimale
          duration: Math.ceil(element.duration.value / 60), // en minutes
          distanceText: element.distance.text,
          durationText: element.duration.text,
          durationInTraffic: element.duration_in_traffic 
            ? Math.ceil(element.duration_in_traffic.value / 60) 
            : undefined,
          route: `${element.distance.text} - ${element.duration.text}`,
          status: 'OK',
          method: 'google_maps'
        };

        // Mettre en cache
        this.addToCache(cacheKey, result);
        this.saveCache();

        console.log(`✅ Distance calculée: ${result.distanceText} en ${result.durationText}`);
        return result;

      } else if (data.rows?.[0]?.elements?.[0]?.status === 'ZERO_RESULTS') {
        console.warn(`⚠️ Aucune route trouvée entre ${origin} et ${destination}`);
        return this.fallbackCalculation(origin, destination, 'ZERO_RESULTS');
      } else {
        console.error('❌ Erreur API Google Maps:', data.status, data.error_message);
        return this.fallbackCalculation(origin, destination, 'ERROR');
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'appel Google Maps:', error);
      return this.fallbackCalculation(origin, destination, 'ERROR');
    }
  }

  /**
   * Calcule plusieurs distances en une seule requête (plus efficace)
   */
  async calculateMultipleDistances(
    origins: string[],
    destinations: string[]
  ): Promise<DistanceResult[][]> {
    // Google Maps permet max 25 origines et 25 destinations par requête
    const maxPerRequest = 25;
    const results: DistanceResult[][] = [];

    for (let i = 0; i < origins.length; i += maxPerRequest) {
      const originBatch = origins.slice(i, i + maxPerRequest);
      
      for (let j = 0; j < destinations.length; j += maxPerRequest) {
        const destBatch = destinations.slice(j, j + maxPerRequest);
        
        const batchResults = await this.calculateBatch(originBatch, destBatch);
        results.push(...batchResults);
      }
    }

    return results;
  }

  /**
   * Calcule un batch de distances
   */
  private async calculateBatch(
    origins: string[],
    destinations: string[]
  ): Promise<DistanceResult[][]> {
    const normalizedOrigins = origins.map(o => this.normalizeAddress(o)).join('|');
    const normalizedDestinations = destinations.map(d => this.normalizeAddress(d)).join('|');

    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.append('origins', normalizedOrigins);
    url.searchParams.append('destinations', normalizedDestinations);
    url.searchParams.append('mode', 'driving');
    url.searchParams.append('units', 'metric');
    url.searchParams.append('key', this.apiKey);
    url.searchParams.append('region', 'mu');

    try {
      const response = await fetch(url.toString());
      const data = await response.json();

      const results: DistanceResult[][] = [];

      if (data.status === 'OK') {
        for (let i = 0; i < data.rows.length; i++) {
          const row: DistanceResult[] = [];
          
          for (let j = 0; j < data.rows[i].elements.length; j++) {
            const element = data.rows[i].elements[j];
            
            if (element.status === 'OK') {
              row.push({
                distance: Math.round(element.distance.value / 100) / 10,
                duration: Math.ceil(element.duration.value / 60),
                distanceText: element.distance.text,
                durationText: element.duration.text,
                route: `${element.distance.text} - ${element.duration.text}`,
                status: 'OK',
                method: 'google_maps'
              });
            } else {
              row.push(this.fallbackCalculation(origins[i], destinations[j], 'ERROR'));
            }
          }
          
          results.push(row);
        }
      }

      return results;
    } catch (error) {
      console.error('Erreur batch calculation:', error);
      // Retourner des fallbacks pour toutes les combinaisons
      return origins.map(o => 
        destinations.map(d => this.fallbackCalculation(o, d, 'ERROR'))
      );
    }
  }

  /**
   * Normalise une adresse pour Maurice
   */
  private normalizeAddress(address: string): string {
    let normalized = address.trim();
    
    // Ajouter ", Mauritius" si pas déjà présent
    if (!normalized.toLowerCase().includes('mauritius') && 
        !normalized.toLowerCase().includes('maurice')) {
      normalized += ', Mauritius';
    }
    
    return normalized;
  }

  /**
   * Calcul de fallback basé sur une estimation
   */
  private fallbackCalculation(
    origin: string,
    destination: string,
    status: 'ERROR' | 'ZERO_RESULTS'
  ): DistanceResult {
    // Estimation basique pour Maurice
    // Distance moyenne: 25km, Temps moyen: 35 min
    console.log(`⚠️ Utilisation du fallback pour ${origin} → ${destination}`);
    
    return {
      distance: 25,
      duration: 35,
      distanceText: '~25 km',
      durationText: '~35 min',
      route: 'Estimation (API indisponible)',
      status: status,
      method: 'fallback'
    };
  }

  /**
   * Gestion du cache
   */
  private getFromCache(key: string): DistanceResult | null {
    const entry = this.cache.get(key);
    
    if (entry) {
      const age = Date.now() - entry.timestamp;
      if (age < this.cacheExpiry) {
        return entry.result;
      } else {
        this.cache.delete(key);
      }
    }
    
    return null;
  }

  private addToCache(key: string, result: DistanceResult): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
    
    // Limiter la taille du cache
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Sauvegarde le cache dans localStorage
   */
  private saveCache(): void {
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem('google_maps_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Erreur sauvegarde cache:', error);
    }
  }

  /**
   * Charge le cache depuis localStorage
   */
  private loadCache(): void {
    try {
      const saved = localStorage.getItem('google_maps_cache');
      if (saved) {
        const cacheData = JSON.parse(saved);
        this.cache = new Map(cacheData);
        
        // Nettoyer les entrées expirées
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
          if (now - entry.timestamp > this.cacheExpiry) {
            this.cache.delete(key);
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement cache:', error);
      this.cache.clear();
    }
  }

  /**
   * Réinitialise le compteur quotidien
   */
  private checkDailyReset(): void {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.requestCount = 0;
      this.lastResetDate = today;
      console.log('📊 Compteur de requêtes réinitialisé pour aujourd\'hui');
    }
  }

  /**
   * Obtient les statistiques d'utilisation
   */
  getStats(): {
    requestsToday: number;
    cacheSize: number;
    cacheHitRate: number;
  } {
    return {
      requestsToday: this.requestCount,
      cacheSize: this.cache.size,
      cacheHitRate: 0 // À implémenter si besoin
    };
  }

  /**
   * Vide le cache
   */
  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem('google_maps_cache');
    console.log('🗑️ Cache vidé');
  }

  /**
   * Optimise une tournée de RDV (algorithme du voyageur de commerce)
   */
  async optimizeRoute(addresses: string[]): Promise<{
    optimizedOrder: number[];
    totalDistance: number;
    totalDuration: number;
    savings: number;
  }> {
    if (addresses.length <= 2) {
      return {
        optimizedOrder: addresses.map((_, i) => i),
        totalDistance: 0,
        totalDuration: 0,
        savings: 0
      };
    }

    // Calculer toutes les distances
    const distances = await this.calculateMultipleDistances(addresses, addresses);
    
    // Algorithme du plus proche voisin (simple mais efficace)
    const visited = new Set<number>();
    const route = [0]; // Commencer par le premier point
    visited.add(0);
    
    let current = 0;
    
    while (visited.size < addresses.length) {
      let nearest = -1;
      let minDistance = Infinity;
      
      for (let i = 0; i < addresses.length; i++) {
        if (!visited.has(i)) {
          const dist = distances[current][i].distance;
          if (dist < minDistance) {
            minDistance = dist;
            nearest = i;
          }
        }
      }
      
      if (nearest !== -1) {
        route.push(nearest);
        visited.add(nearest);
        current = nearest;
      }
    }
    
    // Calculer les totaux
    let totalDistance = 0;
    let totalDuration = 0;
    let originalDistance = 0;
    
    for (let i = 0; i < route.length - 1; i++) {
      totalDistance += distances[route[i]][route[i + 1]].distance;
      totalDuration += distances[route[i]][route[i + 1]].duration;
    }
    
    // Distance originale (ordre initial)
    for (let i = 0; i < addresses.length - 1; i++) {
      originalDistance += distances[i][i + 1].distance;
    }
    
    return {
      optimizedOrder: route,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalDuration: Math.round(totalDuration),
      savings: Math.round((originalDistance - totalDistance) * 10) / 10
    };
  }
}

// Export par défaut
export default GoogleMapsService;
