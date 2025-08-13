// lib/openai-service.ts
// Service IA complet pour la gestion intelligente des tournées commerciales

import OpenAI from 'openai'

// Configuration OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: false
})

// Types
interface ProspectData {
  id?: number
  nom: string
  secteur: string
  ville: string
  region?: string
  district?: string
  nombreEmployes?: number
  score?: number
  statut?: string
  dernierContact?: string
  interactions?: Array<{
    type: string
    date: string
    notes: string
    resultat?: string
  }>
  budget?: number | string
  latitude?: number
  longitude?: number
  adresse?: string
  telephone?: string
  contact?: string
  notes?: string
  priority?: string
}

interface AnalysisResult {
  score: number
  potentielRevenu: number
  probabiliteConversion: number
  meilleureApproche: string
  argumentsVente: string[]
  objectionsProbables: string[]
  prochainnesActions: Array<{
    action: string
    deadline: string
    priorite: string
  }>
  insights: string[]
  recommandationVisite: {
    meilleurMoment: string
    dureeEstimee: number
    typeVisite: string
  }
}

interface NextAction {
  prospect: string
  prospectId?: number
  action: string
  raison: string
  urgence: 'immediate' | 'aujourd\'hui' | 'cette_semaine' | 'ce_mois'
  scriptSuggere?: string
  resultatAttendu?: string
  zone?: string
  dateProposee?: string
  prioriteScore?: number
}

interface OptimizationResult {
  totalDistance: number
  totalTime: number
  optimizedRoute: Array<{
    ordre: number
    nom: string
    heure: string
    duree: number
    distanceKm: number
    tempsTrajet: number
    priorite: string
    notes?: string
  }>
  savings: {
    kmSaved: number
    timeSaved: number
    fuelCostSaved: number
  }
  suggestions: string[]
  zonesRecommandees: Array<{
    zone: string
    jourOptimal: string
    prospects: string[]
    potentielTotal: number
  }>
}

// Système de prompts spécialisés pour la téléconsultation médicale
const PROMPTS = {
  analyzeProspect: (data: ProspectData) => `
Tu es un expert en développement commercial pour un service de téléconsultation médicale à Maurice.
Notre service permet aux établissements d'offrir un accès direct à des médecins via QR code.

Analyse ce prospect pour notre service de téléconsultation :
- Nom : ${data.nom}
- Secteur : ${data.secteur}
- Ville : ${data.ville}, ${data.district || data.region}
- Employés : ${data.nombreEmployes || 'Non spécifié'}
- Score actuel : ${data.score || 3}/5
- Statut : ${data.statut || 'nouveau'}
- Budget : ${data.budget ? `Rs ${data.budget}` : 'Non défini'}
- Notes : ${data.notes || 'Aucune'}

Historique des interactions :
${data.interactions?.map(i => `- ${i.date}: ${i.type} - ${i.notes}`).join('\n') || 'Aucune interaction'}

CONTEXTE IMPORTANT :
- Nous installons des bornes de téléconsultation avec QR codes
- Service particulièrement adapté aux hôtels (touristes) et pharmacies (patients locaux)
- Avantages clés : disponibilité 24/7, multilingue, pas d'attente
- Prix : Rs 15,000-50,000/mois selon la formule

Fournis une analyse JSON avec :
1. score (0-100) : prioriser hôtels 5 étoiles et grandes pharmacies
2. potentielRevenu : estimation annuelle en Rs
3. probabiliteConversion : en %
4. meilleureApproche : stratégie de vente adaptée
5. argumentsVente : 3-5 arguments percutants pour CE prospect
6. objectionsProbables : 2-3 objections à anticiper
7. prochainnesActions : 3 actions concrètes avec deadlines
8. insights : observations spécifiques au secteur médical/tourisme
9. recommandationVisite : { meilleurMoment, dureeEstimee, typeVisite }

Réponds UNIQUEMENT en JSON valide.`,

  getNextActions: (data: any) => `
Tu es un assistant IA spécialisé dans la prospection commerciale pour un service de téléconsultation médicale à Maurice.

Commercial : ${data.commercial}
Objectif mensuel : Rs ${data.objectifMensuel}
Progression actuelle : Rs ${data.progressActuel} (${Math.round(data.progressActuel / data.objectifMensuel * 100)}%)

Prospects disponibles :
${data.prospects.map((p: any) => `
- ${p.nom} (${p.secteur})
  Ville: ${p.ville}, District: ${p.district}
  Score: ${p.score}/5
  Statut: ${p.statut}
  Dernier contact: ${p.dernierContact || 'Jamais'}
  Notes: ${p.notes || 'Aucune'}
`).join('\n')}

STRATÉGIE PRIORITAIRE :
1. HÔTELS (priorité maximale) : 
   - Cibles : 4-5 étoiles, resorts, hôtels business
   - Argument : touristes sans médecin traitant local
   - Meilleur moment : 10h-12h ou 14h-16h

2. PHARMACIES (priorité haute) :
   - Cibles : grandes pharmacies, chaînes
   - Argument : service complémentaire, nouvelles revenues
   - Meilleur moment : après 14h (moins de rush)

3. CLINIQUES (priorité moyenne) :
   - Extension des services, désengorgement
   
4. ENTREPRISES (opportunités) :
   - Grandes entreprises avec +50 employés
   - Service de santé au travail

ZONES GÉOGRAPHIQUES À PRIORISER :
- Grand Baie / Pereybère : concentration hôtels touristiques
- Port Louis centre : entreprises et pharmacies
- Quatre Bornes / Rose Hill : zones commerciales denses
- Mahébourg / Blue Bay : hôtels et aéroport
- Flic en Flac / Tamarin : zone touristique ouest

Génère 5-10 actions CONCRÈTES et ACTIONNABLES en JSON :
- Prioriser absolument hôtels et pharmacies
- Grouper par zones géographiques pour optimiser les déplacements
- Proposer des dates/créneaux spécifiques
- Inclure des scripts d'approche personnalisés
- Calculer un score de priorité (0-100) pour chaque action

Format JSON attendu :
[{
  prospect: "nom",
  prospectId: id,
  action: "description précise",
  raison: "justification commerciale",
  urgence: "immediate|aujourd'hui|cette_semaine|ce_mois",
  scriptSuggere: "script d'approche",
  resultatAttendu: "objectif",
  zone: "zone géographique",
  dateProposee: "YYYY-MM-DD",
  prioriteScore: 0-100
}]`,

  optimizePlanning: (data: any) => `
Tu es un expert en optimisation de tournées commerciales à Maurice pour un service de téléconsultation médicale.

Commercial : ${data.commercial}
Date : ${data.date}
Point de départ : ${data.startPoint || 'Port Louis'}

Rendez-vous à optimiser :
${data.appointments.map((apt: any) => `
- ${apt.nom}
  Secteur: ${apt.secteur}
  Adresse: ${apt.adresse}
  Heure demandée: ${apt.heure || 'Flexible'}
  Durée: ${apt.duree || 60} min
  Score priorité: ${apt.score}/5
  Latitude: ${apt.latitude || 'Non définie'}
  Longitude: ${apt.longitude || 'Non définie'}
`).join('\n')}

CONTRAINTES :
- Heures de travail : ${data.constraints?.startTime || '08:30'} - ${data.constraints?.endTime || '17:30'}
- Pause déjeuner : ${data.constraints?.lunchBreak ? '12:00-13:00' : 'Flexible'}
- Éviter heures de pointe : 7h-9h et 16h30-18h30

OBJECTIFS D'OPTIMISATION :
1. Minimiser la distance totale
2. Grouper par zones (Nord, Sud, Est, Ouest, Centre)
3. Prioriser hôtels le matin (meilleure disponibilité)
4. Pharmacies l'après-midi (moins de clients)
5. Éviter Port Louis centre 7h-9h et 16h-18h (embouteillages)

MATRICE DISTANCES APPROXIMATIVES (en km) :
- Port Louis ↔ Grand Baie : 25km
- Port Louis ↔ Curepipe : 20km  
- Port Louis ↔ Mahébourg : 45km
- Grand Baie ↔ Pereybère : 3km
- Curepipe ↔ Quatre Bornes : 8km
- Mahébourg ↔ Blue Bay : 5km

Génère un planning optimisé en JSON avec :
1. optimizedRoute : ordre de visite optimal avec horaires
2. totalDistance : distance totale en km
3. totalTime : temps total en minutes
4. savings : économies réalisées vs trajet non optimisé
5. suggestions : recommandations spécifiques
6. zonesRecommandees : planning sur plusieurs jours par zones

Réponds UNIQUEMENT en JSON valide.`,

  generateScript: (data: any) => `
Tu es un expert en vente B2B pour un service de téléconsultation médicale innovant à Maurice.

Prospect : ${data.prospect.nom}
Secteur : ${data.prospect.secteur}
Type d'interaction : ${data.typeInteraction}
Objectif : ${data.objectif}
Contexte : ${data.contexte || 'Premier contact'}

SERVICE À VENDRE :
- Bornes de téléconsultation avec QR code
- Consultation médicale en vidéo 24/7
- Médecins certifiés multilingues
- Tarifs : Rs 15,000 à 50,000/mois

ARGUMENTS CLÉS PAR SECTEUR :

HÔTELS :
- Touristes sans médecin traitant local
- Service 24/7 pour urgences nocturnes
- Multilingue (FR, EN, DE, IT, CN)
- Différenciateur vs concurrence
- ROI : 1 touriste malade évité = économies importantes

PHARMACIES :
- Nouvelle source de revenus
- Service complémentaire sans investissement RH
- Désengorgement des files d'attente
- Fidélisation clientèle
- Commission sur chaque consultation

CLINIQUES :
- Extension horaires sans personnel supplémentaire
- Désengorgement urgences mineures
- Pré-triage intelligent
- Rentabilisation espaces sous-utilisés

Génère un script de vente structuré en JSON :
{
  "accroche": "phrase d'ouverture percutante",
  "presentation": "présentation en 30 secondes",
  "questions_decouverte": ["3-5 questions pour comprendre les besoins"],
  "arguments_personnalises": ["3-4 arguments adaptés AU prospect"],
  "reponses_objections": {
    "prix": "réponse structurée",
    "utilite": "réponse avec exemples",
    "technique": "réassurance simplicité"
  },
  "closing": "phrase de conclusion avec call-to-action",
  "follow_up": "stratégie de suivi si pas de décision immédiate"
}

Le script doit être :
- Naturel et conversationnel (pas robotique)
- Adapté à la culture mauricienne
- Court et percutant (max 3 minutes)
- Orienté bénéfices client, pas features

Réponds UNIQUEMENT en JSON valide.`,

  chatAssistant: (message: string, context: any) => `
Tu es l'assistant IA commercial de ProspectMed, spécialisé dans la vente de solutions de téléconsultation médicale à Maurice.

Message utilisateur : ${message}

Contexte actuel :
- Commercial : ${context.userId || 'Non défini'}
- Prospect en cours : ${context.currentProspect?.nom || 'Aucun'}
- Secteur : ${context.currentProspect?.secteur || 'Non défini'}

TES CONNAISSANCES :
- Service : Bornes de téléconsultation avec QR codes
- Cibles prioritaires : Hôtels et Pharmacies
- Prix : Rs 15,000-50,000/mois selon formule
- Avantages : 24/7, multilingue, pas d'attente, ROI rapide
- Zones prioritaires : Grand Baie (hôtels), Port Louis (business), Quatre Bornes (commercial)

RÉPONDS DE MANIÈRE :
- Concise et actionnable
- Orientée résultats commerciaux
- Avec des exemples concrets de Maurice
- En proposant toujours une action suivante

Si on te demande des conseils, base-toi sur les meilleures pratiques de vente B2B à Maurice.`
}

// Classe principale du service IA
export class AIService {
  
  // Analyser un prospect avec scoring intelligent
  static async analyzeProspect(prospectData: ProspectData): Promise<AnalysisResult> {
    try {
      // Enrichir les données pour les hôtels et pharmacies
      const enrichedData = {
        ...prospectData,
        priority: this.calculatePriority(prospectData)
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { 
            role: "system", 
            content: "Tu es un expert en analyse commerciale pour le secteur médical. Réponds UNIQUEMENT en JSON valide."
          },
          { 
            role: "user", 
            content: PROMPTS.analyzeProspect(enrichedData)
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })

      const response = completion.choices[0].message.content
      if (!response) throw new Error('Pas de réponse de l\'IA')

      const analysis = JSON.parse(response)
      
      // Ajuster le score pour prioriser hôtels et pharmacies
      if (prospectData.secteur === 'hotel') {
        analysis.score = Math.min(100, analysis.score * 1.3)
      } else if (prospectData.secteur === 'pharmacie') {
        analysis.score = Math.min(100, analysis.score * 1.2)
      }

      return analysis
    } catch (error) {
      console.error('Erreur analyse prospect:', error)
      return this.getDefaultAnalysis(prospectData)
    }
  }

  // Obtenir les prochaines actions recommandées
  static async getNextBestActions(data: any): Promise<NextAction[]> {
    try {
      // Enrichir les prospects avec données géographiques
      const enrichedProspects = data.prospects.map((p: any) => ({
        ...p,
        zone: this.getZone(p.district || p.ville),
        priorite: this.calculatePriority(p)
      }))

      // Trier par priorité
      enrichedProspects.sort((a: any, b: any) => b.priorite - a.priorite)

      const requestData = {
        ...data,
        prospects: enrichedProspects.slice(0, 30) // Top 30 prospects
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Tu es un assistant IA spécialisé en stratégie commerciale B2B. Réponds UNIQUEMENT en JSON valide."
          },
          {
            role: "user",
            content: PROMPTS.getNextActions(requestData)
          }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      })

      const response = completion.choices[0].message.content
      if (!response) throw new Error('Pas de réponse')

      const result = JSON.parse(response)
      const actions = Array.isArray(result) ? result : result.actions || []

      // Enrichir avec dates proposées si absentes
      return actions.map((action: NextAction) => ({
        ...action,
        dateProposee: action.dateProposee || this.getNextAvailableDate(action.urgence),
        zone: action.zone || this.getZone(action.prospect)
      }))
      
    } catch (error) {
      console.error('Erreur getNextBestActions:', error)
      return this.getDefaultActions(data)
    }
  }

  // Optimiser le planning d'une tournée
  static async optimizePlanning(data: any): Promise<OptimizationResult> {
    try {
      // Enrichir avec coordonnées si disponibles
      const enrichedData = {
        ...data,
        appointments: data.appointments.map((apt: any) => ({
          ...apt,
          zone: this.getZone(apt.district || apt.ville),
          prioriteCalculee: this.calculatePriority(apt)
        }))
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en optimisation logistique à Maurice. Réponds UNIQUEMENT en JSON valide."
          },
          {
            role: "user",
            content: PROMPTS.optimizePlanning(enrichedData)
          }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      })

      const response = completion.choices[0].message.content
      if (!response) throw new Error('Pas de réponse')

      const result = JSON.parse(response)
      
      // Calculer les zones recommandées si non fournies
      if (!result.zonesRecommandees) {
        result.zonesRecommandees = this.calculateZoneRecommendations(enrichedData.appointments)
      }

      return result
      
    } catch (error) {
      console.error('Erreur optimisation:', error)
      return this.getDefaultOptimization(data)
    }
  }

  // Générer un script de vente personnalisé
  static async generateSalesScript(data: any): Promise<any> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en vente B2B dans le secteur médical. Réponds UNIQUEMENT en JSON valide."
          },
          {
            role: "user",
            content: PROMPTS.generateScript(data)
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })

      const response = completion.choices[0].message.content
      if (!response) throw new Error('Pas de réponse')

      return JSON.parse(response)
      
    } catch (error) {
      console.error('Erreur génération script:', error)
      return this.getDefaultScript(data)
    }
  }

  // Chat assistant
  static async chatAssistant(data: any): Promise<any> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: PROMPTS.chatAssistant(data.message, data.context)
          },
          {
            role: "user",
            content: data.message
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      })

      return {
        response: completion.choices[0].message.content || "Je n'ai pas pu générer une réponse."
      }
      
    } catch (error) {
      console.error('Erreur chat:', error)
      return {
        response: "Désolé, je rencontre un problème technique. Veuillez réessayer."
      }
    }
  }

  // === MÉTHODES UTILITAIRES ===

  // Calculer la priorité d'un prospect
  private static calculatePriority(prospect: any): number {
    let priority = 50 // Base

    // Bonus secteur
    if (prospect.secteur === 'hotel') priority += 30
    else if (prospect.secteur === 'pharmacie') priority += 25
    else if (prospect.secteur === 'clinique') priority += 15
    else if (prospect.secteur === 'entreprise' && prospect.nombreEmployes > 50) priority += 10

    // Bonus score
    priority += (prospect.score || 3) * 5

    // Bonus statut
    if (prospect.statut === 'qualifie') priority += 10
    else if (prospect.statut === 'proposition') priority += 15
    else if (prospect.statut === 'negociation') priority += 20

    // Bonus localisation (zones touristiques)
    const zonesHotels = ['Grand Baie', 'Pereybère', 'Flic en Flac', 'Belle Mare', 'Le Morne']
    if (zonesHotels.some(zone => prospect.ville?.includes(zone))) priority += 10

    return Math.min(100, priority)
  }

  // Déterminer la zone géographique
  private static getZone(location: string): string {
    if (!location) return 'Centre'
    
    const zones: Record<string, string[]> = {
      'Nord': ['Grand Baie', 'Pereybère', 'Cap Malheureux', 'Pamplemousses', 'Trou aux Biches'],
      'Sud': ['Mahébourg', 'Blue Bay', 'Savanne', 'Souillac', 'Bel Ombre'],
      'Est': ['Flacq', 'Belle Mare', 'Trou d\'Eau Douce', 'Île aux Cerfs'],
      'Ouest': ['Flic en Flac', 'Tamarin', 'Le Morne', 'Rivière Noire', 'Cascavelle'],
      'Centre': ['Port Louis', 'Curepipe', 'Quatre Bornes', 'Rose Hill', 'Vacoas', 'Phoenix'],
      'Plateau': ['Moka', 'Saint Pierre', 'Nouvelle France']
    }

    for (const [zone, locations] of Object.entries(zones)) {
      if (locations.some(loc => location.toLowerCase().includes(loc.toLowerCase()))) {
        return zone
      }
    }

    return 'Centre'
  }

  // Calculer la prochaine date disponible
  private static getNextAvailableDate(urgence: string): string {
    const today = new Date()
    let targetDate = new Date()

    switch(urgence) {
      case 'immediate':
        // Aujourd'hui
        break
      case 'aujourd\'hui':
        // Aujourd'hui
        break
      case 'cette_semaine':
        // Dans 2-3 jours
        targetDate.setDate(today.getDate() + 2)
        break
      case 'ce_mois':
        // Dans 7-10 jours
        targetDate.setDate(today.getDate() + 7)
        break
      default:
        targetDate.setDate(today.getDate() + 3)
    }

    // Éviter weekends
    if (targetDate.getDay() === 0) targetDate.setDate(targetDate.getDate() + 1)
    if (targetDate.getDay() === 6) targetDate.setDate(targetDate.getDate() + 2)

    return targetDate.toISOString().split('T')[0]
  }

  // Calculer les recommandations de zones
  private static calculateZoneRecommendations(appointments: any[]): any[] {
    const zoneGroups: Record<string, any[]> = {}
    
    // Grouper par zones
    appointments.forEach(apt => {
      const zone = this.getZone(apt.district || apt.ville)
      if (!zoneGroups[zone]) zoneGroups[zone] = []
      zoneGroups[zone].push(apt)
    })

    // Créer recommandations
    const recommendations = Object.entries(zoneGroups).map(([zone, apts]) => {
      const potentiel = apts.reduce((sum, apt) => {
        const base = apt.score * 10000
        const multiplier = apt.secteur === 'hotel' ? 3 : apt.secteur === 'pharmacie' ? 2.5 : 1
        return sum + (base * multiplier)
      }, 0)

      // Déterminer le meilleur jour
      let jourOptimal = 'Lundi'
      if (zone === 'Nord') jourOptimal = 'Mardi' // Zones touristiques
      else if (zone === 'Centre') jourOptimal = 'Mercredi' // Business
      else if (zone === 'Ouest') jourOptimal = 'Jeudi' // Côte ouest
      else if (zone === 'Sud') jourOptimal = 'Vendredi' // Sud

      return {
        zone,
        jourOptimal,
        prospects: apts.map(a => a.nom),
        potentielTotal: Math.round(potentiel),
        nombreProspects: apts.length
      }
    })

    return recommendations.sort((a, b) => b.potentielTotal - a.potentielTotal)
  }

  // === MÉTHODES DE FALLBACK ===

  private static getDefaultAnalysis(prospect: any): AnalysisResult {
    const isHotel = prospect.secteur === 'hotel'
    const isPharmacie = prospect.secteur === 'pharmacie'
    
    return {
      score: isHotel ? 85 : isPharmacie ? 75 : 60,
      potentielRevenu: isHotel ? 420000 : isPharmacie ? 300000 : 180000,
      probabiliteConversion: isHotel ? 65 : isPharmacie ? 55 : 40,
      meilleureApproche: isHotel ? 
        "Approche axée sur le service aux touristes et la différenciation" :
        "Focus sur les revenus complémentaires et la modernisation",
      argumentsVente: isHotel ? [
        "Service médical 24/7 pour vos clients internationaux",
        "Consultation multilingue sans déplacement",
        "Différenciateur majeur vs concurrence"
      ] : [
        "Nouvelle source de revenus sans investissement RH",
        "Service complémentaire moderne",
        "Fidélisation de la clientèle"
      ],
      objectionsProbables: [
        "Le coût mensuel semble élevé",
        "Nos clients n'en auront pas besoin",
        "Nous avons déjà un médecin/infirmier"
      ],
      prochainnesActions: [
        {
          action: "Appeler pour prise de contact",
          deadline: "Dans 2 jours",
          priorite: "haute"
        },
        {
          action: "Préparer une démo personnalisée",
          deadline: "Cette semaine",
          priorite: "moyenne"
        },
        {
          action: "Envoyer documentation par email",
          deadline: "Aujourd'hui",
          priorite: "haute"
        }
      ],
      insights: [
        isHotel ? "Fort potentiel avec la clientèle internationale" : "Opportunité de modernisation",
        "Période idéale : avant la haute saison touristique",
        "Décideur clé : Directeur général ou responsable services"
      ],
      recommandationVisite: {
        meilleurMoment: isHotel ? "10h-12h" : "14h-16h",
        dureeEstimee: 45,
        typeVisite: "presentation"
      }
    }
  }

  private static getDefaultActions(data: any): NextAction[] {
    const actions: NextAction[] = []
    const prospects = data.prospects || []
    
    // Prioriser hôtels et pharmacies
    const hotels = prospects.filter((p: any) => p.secteur === 'hotel')
    const pharmacies = prospects.filter((p: any) => p.secteur === 'pharmacie')
    const autres = prospects.filter((p: any) => !['hotel', 'pharmacie'].includes(p.secteur))

    // Actions pour hôtels
    hotels.slice(0, 3).forEach((p: any) => {
      actions.push({
        prospect: p.nom,
        prospectId: p.id,
        action: `Visite de présentation du service de téléconsultation`,
        raison: `Hôtel prioritaire - Score ${p.score}/5 - Potentiel élevé pour clientèle internationale`,
        urgence: p.score >= 4 ? 'immediate' : 'cette_semaine',
        scriptSuggere: `Bonjour, je suis [Nom] de ProspectMed. Nous aidons les hôtels comme le vôtre à offrir un service médical 24/7 à leurs clients internationaux. Puis-je vous montrer comment cela fonctionne?`,
        resultatAttendu: "Obtenir un RDV de démonstration",
        zone: this.getZone(p.district || p.ville),
        dateProposee: this.getNextAvailableDate('cette_semaine'),
        prioriteScore: 90
      })
    })

    // Actions pour pharmacies
    pharmacies.slice(0, 2).forEach((p: any) => {
      actions.push({
        prospect: p.nom,
        prospectId: p.id,
        action: `Présenter le partenariat téléconsultation`,
        raison: `Pharmacie stratégique - Nouvelle source de revenus potentielle`,
        urgence: 'cette_semaine',
        scriptSuggere: `Bonjour, nous proposons aux pharmacies un service de téléconsultation qui génère des revenus complémentaires. Seriez-vous intéressé par une présentation rapide?`,
        resultatAttendu: "Planifier une démonstration",
        zone: this.getZone(p.district || p.ville),
        dateProposee: this.getNextAvailableDate('cette_semaine'),
        prioriteScore: 80
      })
    })

    return actions
  }

  private static getDefaultOptimization(data: any): OptimizationResult {
    const appointments = data.appointments || []
    const baseTime = 8 * 60 // 8h en minutes
    
    // Trier par zones puis par priorité
    const sorted = [...appointments].sort((a, b) => {
      const zoneA = this.getZone(a.district || a.ville)
      const zoneB = this.getZone(b.district || b.ville)
      if (zoneA !== zoneB) return zoneA.localeCompare(zoneB)
      return (b.score || 3) - (a.score || 3)
    })

    let currentTime = baseTime
    const optimizedRoute = sorted.map((apt, index) => {
      const startTime = currentTime
      const duration = apt.duree || 60
      currentTime += duration + 30 // +30min de trajet entre RDV
      
      return {
        ordre: index + 1,
        nom: apt.nom,
        heure: `${Math.floor(startTime/60).toString().padStart(2,'0')}:${(startTime%60).toString().padStart(2,'0')}`,
        duree: duration,
        distanceKm: index === 0 ? 15 : 12,
        tempsTrajet: index === 0 ? 25 : 20,
        priorite: apt.score >= 4 ? 'haute' : 'normale',
        notes: apt.secteur === 'hotel' ? 'Client prioritaire' : undefined
      }
    })

    return {
      totalDistance: optimizedRoute.reduce((sum, r) => sum + r.distanceKm, 0),
      totalTime: currentTime - baseTime,
      optimizedRoute,
      savings: {
        kmSaved: 15,
        timeSaved: 45,
        fuelCostSaved: 150
      },
      suggestions: [
        "Commencer par les hôtels le matin (meilleure disponibilité)",
        "Grouper les visites par zones pour économiser du temps",
        "Éviter Port Louis entre 7h-9h et 16h-18h (embouteillages)",
        "Prévoir 15 min de battement entre chaque RDV"
      ],
      zonesRecommandees: this.calculateZoneRecommendations(appointments)
    }
  }

  private static getDefaultScript(data: any): any {
    const isHotel = data.prospect.secteur === 'hotel'
    const isPharmacie = data.prospect.secteur === 'pharmacie'
    
    return {
      accroche: isHotel ?
        "Bonjour [Nom], savez-vous que 40% des touristes rencontrent des problèmes de santé mineurs pendant leur séjour?" :
        "Bonjour [Nom], comment faites-vous actuellement quand vos clients ont besoin d'une consultation médicale rapide?",
      
      presentation: "Je suis [Votre nom] de ProspectMed. Nous installons des bornes de téléconsultation médicale qui permettent à vos clients d'accéder à un médecin 24/7 en scannant simplement un QR code.",
      
      questions_decouverte: [
        isHotel ? "Combien de clients internationaux recevez-vous par mois?" : "Combien de clients vous demandent des conseils médicaux chaque jour?",
        "Avez-vous déjà eu des situations d'urgence médicale?",
        "Comment gérez-vous actuellement ces demandes?",
        "Qu'est-ce qui est le plus important pour vous : le service client ou les revenus additionnels?"
      ],
      
      arguments_personnalises: isHotel ? [
        "Service disponible 24/7 dans 8 langues pour vos clients internationaux",
        "Différenciateur majeur mentionné dans les avis TripAdvisor",
        "Évite les complications et mauvaises expériences clients",
        "ROI en moins de 6 mois avec seulement 10 consultations/mois"
      ] : [
        "Commission de 20% sur chaque consultation (environ Rs 200)",
        "Aucun investissement, nous installons tout gratuitement",
        "Fidélise vos clients avec un service moderne",
        "Formation complète de votre équipe incluse"
      ],
      
      reponses_objections: {
        prix: "Je comprends. Voyez cela comme un investissement. Un seul client satisfait qui revient ou qui recommande votre établissement couvre le coût mensuel. De plus, nous offrons une période d'essai de 30 jours.",
        utilite: "C'est vrai que tous vos clients n'en auront pas besoin, mais pour ceux qui en ont besoin, c'est un service irremplaçable. Imaginez un parent avec un enfant malade à 22h - ce service peut sauver leurs vacances.",
        technique: "C'est extrêmement simple : QR code, connexion automatique, consultation en 2 minutes. Nous formons votre équipe et assurons le support technique 24/7."
      },
      
      closing: "Je peux vous faire une démonstration gratuite cette semaine. Préférez-vous mardi matin ou jeudi après-midi?",
      
      follow_up: "Je vous envoie notre brochure par email aujourd'hui et je vous rappelle dans 3 jours pour voir si vous avez des questions. Nous pouvons aussi commencer par un mois d'essai gratuit."
    }
  }
}

// Fonction pour planifier automatiquement les tournées par zones
export async function planifyWeeklyTours(prospects: ProspectData[]): Promise<any> {
  // Grouper les prospects par zones et priorités
  const zoneMapping: Record<string, ProspectData[]> = {
    'Nord': [],
    'Sud': [],
    'Est': [],
    'Ouest': [],
    'Centre': [],
    'Plateau': []
  }

  // Classer les prospects par zones
  prospects.forEach(prospect => {
    const zone = AIService.getZone(prospect.district || prospect.ville || '')
    if (zoneMapping[zone]) {
      zoneMapping[zone].push(prospect)
    }
  })

  // Planning hebdomadaire optimisé
  const weeklyPlanning = {
    'Lundi': {
      zone: 'Centre',
      focus: 'Entreprises et pharmacies Port Louis',
      prospects: zoneMapping['Centre']
        .filter(p => ['entreprise', 'pharmacie'].includes(p.secteur))
        .sort((a, b) => (b.score || 3) - (a.score || 3))
        .slice(0, 8)
    },
    'Mardi': {
      zone: 'Nord',
      focus: 'Hôtels Grand Baie et Pereybère',
      prospects: zoneMapping['Nord']
        .filter(p => p.secteur === 'hotel')
        .sort((a, b) => (b.score || 3) - (a.score || 3))
        .slice(0, 6)
    },
    'Mercredi': {
      zone: 'Centre',
      focus: 'Cliniques et grandes pharmacies Quatre Bornes/Rose Hill',
      prospects: zoneMapping['Centre']
        .filter(p => ['clinique', 'pharmacie'].includes(p.secteur))
        .sort((a, b) => (b.score || 3) - (a.score || 3))
        .slice(0, 8)
    },
    'Jeudi': {
      zone: 'Ouest',
      focus: 'Hôtels Flic en Flac et Tamarin',
      prospects: zoneMapping['Ouest']
        .filter(p => ['hotel', 'restaurant'].includes(p.secteur))
        .sort((a, b) => (b.score || 3) - (a.score || 3))
        .slice(0, 6)
    },
    'Vendredi': {
      zone: 'Sud',
      focus: 'Zone aéroport et hôtels Mahébourg',
      prospects: zoneMapping['Sud']
        .sort((a, b) => (b.score || 3) - (a.score || 3))
        .slice(0, 5)
    }
  }

  // Calculer les métriques
  const metrics = {
    totalProspects: Object.values(weeklyPlanning).reduce((sum, day) => sum + day.prospects.length, 0),
    hotelCount: prospects.filter(p => p.secteur === 'hotel').length,
    pharmacyCount: prospects.filter(p => p.secteur === 'pharmacie').length,
    estimatedRevenue: Object.values(weeklyPlanning).reduce((sum, day) => {
      return sum + day.prospects.reduce((daySum, p) => {
        const base = p.secteur === 'hotel' ? 35000 : p.secteur === 'pharmacie' ? 25000 : 15000
        return daySum + base
      }, 0)
    }, 0)
  }

  return {
    weeklyPlanning,
    metrics,
    recommendations: [
      "Prioriser les hôtels 4-5 étoiles le matin (10h-12h)",
      "Visiter les pharmacies l'après-midi (14h-16h)",
      "Éviter Port Louis aux heures de pointe",
      "Prévoir 45 min par visite hôtel, 30 min par pharmacie",
      "Toujours avoir des brochures en français et anglais"
    ]
  }
}

// Export pour utilisation dans l'application
export default AIService
/**
 * Recherche sémantique dans les documents
 */
export async function semanticSearch(query: string, documents: Array<{ id: string; content: string }>): Promise<Array<{ id: string; score: number }>> {
  const queryEmbedding = await createEmbedding(query)
  
  const results = await Promise.all(
    documents.map(async (doc) => {
      const docEmbedding = await createEmbedding(doc.content)
      const similarity = cosineSimilarity(queryEmbedding, docEmbedding)
      return { id: doc.id, score: similarity }
    })
  )
  
  return results.sort((a, b) => b.score - a.score)
}

// Fonction de similarité cosinus
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

// Export par défaut AIService à la fin du fichier
export default AIService

