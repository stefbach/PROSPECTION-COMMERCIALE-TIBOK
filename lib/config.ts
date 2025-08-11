// lib/config.ts
export const config = {
  googleMaps: {
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    region: 'mu', // Maurice
    language: 'fr', // Français
    // Limites pour Maurice (optionnel)
    bounds: {
      north: -19.9,
      south: -20.6,
      east: 58.0,
      west: 56.9
    }
  },
  // Paramètres par défaut pour les calculs
  defaults: {
    averageSpeed: 40, // km/h moyenne à Maurice
    rushHourSpeed: 25, // km/h en heure de pointe
    fuelPrice: 65, // Rs par litre
    consumption: 8, // litres/100km
    indemnityPerKm: 15 // Rs par km
  }
};

// Vérification de la configuration
if (!config.googleMaps.apiKey && typeof window !== 'undefined') {
  console.warn('⚠️ Clé API Google Maps manquante !');
  console.warn('Ajoutez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY dans votre fichier .env.local');
}

export default config;
