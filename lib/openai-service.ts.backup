// lib/openai-service.ts
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase/server'

// Configuration OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Types pour les réponses IA
export interface PlanningOptimization {
  optimizedRoute: Array<{
    prospectId: number
    nom: string
    heure: string
    duree: number
    priorite: 'urgente' | 'haute' | 'normale'
    raison: string
    distanceKm: number
    tempsTrajet: number
  }>
  totalDistance: number
  totalTime: number
  savings: {
    kmSaved: number
    timeSaved: number
    fuelCostSaved: number
  }
  suggestions: string[]
  alertes: string[]
}

export interface ProspectAnalysis {
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
}

export interface NextBestAction {
  prospect: string
  action: string
  raison: string
  urgence: 'immediate' | 'aujourd\'hui' | 'cette_semaine' | 'ce_mois'
  scriptSuggere: string
  resultatAttendu: string
}

/**
 * Service principal d'IA pour ProspectMed
 */
export class AIService {
  
  /**
   * Optimiser un planning de tournée commerciale
   */
  static async optimizePlanning(params: {
    commercial: string
    date: string
    appointments: Array<{
      prospectId: number
      nom: string
      adresse: string
      latitude?: number
      longitude?: number
      priorite?: string
      dureeEstimee?: number
    }>
    constraints?: {
      startTime?: string
      endTime?: string
      lunchBreak?: boolean
      maxDistance?: number
    }
  }): Promise<PlanningOptimization> {
    
    const systemPrompt = `Tu es un expert en optimisation de tournées commerciales pour l'Île Maurice.
    
Contexte:
- Territoire: Île Maurice (superficie 2,040 km²)
- Secteur: Télémédecine B2B (hôtels, entreprises, pharmacies)
- Traffic: Dense à Port-Louis (7h-9h et 16h-18h), modéré ailleurs
- Vitesse moyenne: 40-50 km/h en ville, 60-70 km/h sur routes principales
- Régions: Port-Louis (capitale), Plaines Wilhems (urbain dense), Grand Baie (touristique), Flacq (Est), etc.

Objectifs:
1. Minimiser la distance totale parcourue
2. Respecter les priorités business (urgente > haute > normale)
3. Éviter les heures de pointe dans les zones urbaines
4. Grouper les RDV par zones géographiques
5. Prévoir des buffers réalistes entre RDV

Format de réponse: JSON structuré uniquement.`

    const userPrompt = `Optimise cette tournée commerciale pour ${params.commercial} le ${params.date}:

Rendez-vous à planifier:
${JSON.stringify(params.appointments, null, 2)}

Contraintes:
- Début: ${params.constraints?.startTime || '08:30'}
- Fin: ${params.constraints?.endTime || '17:30'}
- Pause déjeuner: ${params.constraints?.lunchBreak ? '12:00-13:00' : 'flexible'}
- Distance max: ${params.constraints?.maxDistance || 'illimitée'} km

Retourne un JSON avec:
{
  "optimizedRoute": [...],
  "totalDistance": number,
  "totalTime": number,
  "savings": {...},
  "suggestions": [...],
  "alertes": [...]
}`

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })

      const result = JSON.parse(completion.choices[0].message.content || '{}')
      
      // Sauvegarder l'optimisation en base
      await this.saveOptimization(params.commercial, params.date, result)
      
      return result as PlanningOptimization
    } catch (error) {
      console.error('Erreur optimisation planning:', error)
      throw error
    }
  }

  /**
   * Analyser un prospect et prédire son potentiel
   */
  static async analyzeProspect(prospectData: {
    nom: string
    secteur: string
    ville: string
    region: string
    nombreEmployes?: number
    interactions?: Array<{
      type: string
      date: string
      notes: string
      resultat?: string
    }>
    concurrent?: string
    budget?: string
  }): Promise<ProspectAnalysis> {
    
    const systemPrompt = `Tu es un expert en vente B2B de solutions de télémédecine à l'Île Maurice.

Contexte marché Maurice:
- PIB/habitant: ~11,000 USD
- Secteur touristique: 350+ hôtels, 1.4M touristes/an
- Secteur santé: Manque de médecins (2.5/1000 hab), longues distances
- Concurrents: Médecins sans frontières (consultations mobiles), quelques apps locales
- Prix moyen consultation: 1,500-2,500 MUR (30-50 EUR)

Scoring (0-100):
- Taille structure: PME (20-50 emp) = +20pts, Grande (50+) = +30pts
- Secteur: Hôtel 5* = +25pts, Entreprise 100+ = +20pts, Pharmacie = +15pts
- Localisation: Zone touristique = +15pts, Zone isolée = +20pts
- Urgence besoin: Mentionné = +20pts

Tu dois analyser le prospect et fournir une analyse détaillée avec scoring, approche commerciale et prochaines actions.`

    const userPrompt = `Analyse ce prospect mauricien:
${JSON.stringify(prospectData, null, 2)}

Retourne un JSON structuré avec:
- score (0-100)
- potentielRevenu (MUR/an)
- probabiliteConversion (%)
- meilleureApproche
- argumentsVente (5 max)
- objectionsProbables (3 max)
- prochainnesActions
- insights`

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.4,
        response_format: { type: "json_object" }
      })

      const analysis = JSON.parse(completion.choices[0].message.content || '{}')
      
      // Mettre à jour le score IA dans la base
      await this.updateProspectScore(prospectData.nom, analysis.score)
      
      return analysis as ProspectAnalysis
    } catch (error) {
      console.error('Erreur analyse prospect:', error)
      throw error
    }
  }

  /**
   * Suggérer la prochaine meilleure action
   */
  static async getNextBestActions(params: {
    commercial: string
    prospects: Array<{
      id: number
      nom: string
      statut: string
      dernierContact?: string
      score?: number
      notes?: string
    }>
    objectifMensuel: number
    progressActuel: number
  }): Promise<NextBestAction[]> {
    
    const systemPrompt = `Tu es un coach commercial expert en télémédecine B2B à Maurice.

Stratégies prioritaires:
1. Privilégier les prospects "chauds" (score > 70)
2. Relancer après 7 jours sans contact
3. Proposer des démos aux prospects qualifiés
4. Négocier rapidement avec les prospects en phase finale
5. Utiliser WhatsApp pour les relances (très utilisé à Maurice)

Contexte culturel Maurice:
- Relations personnelles importantes
- Préférence pour les rencontres en personne
- Décisions souvent collégiales
- Sensibilité au rapport qualité/prix`

    const userPrompt = `Commercial: ${params.commercial}
Objectif mensuel: ${params.objectifMensuel} MUR
Progression: ${params.progressActuel} MUR (${Math.round(params.progressActuel/params.objectifMensuel*100)}%)

Prospects actuels:
${JSON.stringify(params.prospects.slice(0, 20), null, 2)}

Suggère les 5 prochaines meilleures actions à entreprendre.
Format JSON avec: prospect, action, raison, urgence, scriptSuggere, resultatAttendu`

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.5
      })

      const content = completion.choices[0].message.content || '[]'
      const actions = JSON.parse(content.includes('[') ? content : '[]')
      
      return actions as NextBestAction[]
    } catch (error) {
      console.error('Erreur next best actions:', error)
      throw error
    }
  }

  /**
   * Générer un rapport intelligent
   */
  static async generateReport(params: {
    type: 'hebdomadaire' | 'mensuel' | 'prospect' | 'commercial'
    data: any
    format?: 'summary' | 'detailed'
  }): Promise<string> {
    
    const prompts = {
      hebdomadaire: `Génère un rapport hebdomadaire de performance commerciale`,
      mensuel: `Génère un rapport mensuel avec analyse des tendances`,
      prospect: `Génère une fiche d'analyse complète du prospect`,
      commercial: `Génère un rapport de performance individuelle`
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Tu es un analyste business spécialisé en télémédecine B2B à Maurice. Génère des rapports professionnels et actionables."
          },
          {
            role: "user",
            content: `${prompts[params.type]}

Données: ${JSON.stringify(params.data, null, 2)}

Format: ${params.format || 'summary'}
Inclure: KPIs, tendances, recommandations, actions prioritaires`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })

      return completion.choices[0].message.content || ''
    } catch (error) {
      console.error('Erreur génération rapport:', error)
      throw error
    }
  }

  /**
   * Prédire la probabilité de conversion
   */
  static async predictConversion(prospectHistory: {
    interactions: number
    daysSinceFirstContact: number
    emailsOpened: number
    demosAttended: number
    score: number
    secteur: string
    budget?: string
  }): Promise<{
    probability: number
    confidence: number
    factors: Array<{ factor: string; impact: 'positive' | 'negative'; weight: number }>
    recommendation: string
  }> {
    
    const prompt = `Basé sur ces données historiques, calcule la probabilité de conversion:
${JSON.stringify(prospectHistory, null, 2)}

Contexte: Marché de la télémédecine B2B à Maurice
Retourne: probabilité (0-100), niveau de confiance, facteurs d'influence, recommandation`

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en prédiction de ventes B2B avec 10 ans d'expérience dans le secteur médical."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })

      return JSON.parse(completion.choices[0].message.content || '{}')
    } catch (error) {
      console.error('Erreur prédiction conversion:', error)
      throw error
    }
  }

  /**
   * Générer un script de vente personnalisé
   */
  static async generateSalesScript(params: {
    prospect: {
      nom: string
      secteur: string
      contact: string
      objections?: string[]
    }
    typeInteraction: 'appel' | 'email' | 'visite' | 'whatsapp'
    objectif: string
    contexte?: string
  }): Promise<{
    script: string
    keyPoints: string[]
    objectionHandling: Array<{ objection: string; response: string }>
    callToAction: string
  }> {
    
    const culturalContext = `
Contexte culturel Maurice:
- Utiliser un mélange français/anglais est apprécié
- Commencer par des salutations chaleureuses
- Mentionner des références locales connues
- Être respectueux mais pas trop formel
- WhatsApp est le canal préféré pour le suivi`

    const prompt = `Génère un script de ${params.typeInteraction} pour:
Prospect: ${params.prospect.nom} (${params.prospect.secteur})
Contact: ${params.prospect.contact}
Objectif: ${params.objectif}
${params.contexte ? `Contexte: ${params.contexte}` : ''}

${culturalContext}

Retourne un JSON avec: script complet, points clés, gestion des objections, call-to-action`

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en vente B2B à Maurice, bilingue français/anglais, spécialisé en télémédecine."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      })

      return JSON.parse(completion.choices[0].message.content || '{}')
    } catch (error) {
      console.error('Erreur génération script:', error)
      throw error
    }
  }

  /**
   * Assistant conversationnel pour les commerciaux
   */
  static async chatAssistant(params: {
    userId: string
    message: string
    context?: {
      currentProspect?: any
      recentInteractions?: any[]
      userRole?: string
    }
  }): Promise<{
    response: string
    suggestions?: string[]
    actions?: Array<{ type: string; data: any }>
  }> {
    
    const systemPrompt = `Tu es l'assistant IA de ProspectMed Pro, spécialisé dans la vente de télémédecine B2B à Maurice.

Tes capacités:
- Répondre aux questions sur les prospects et le marché
- Suggérer des stratégies de vente
- Aider à la préparation des RDV
- Analyser les performances
- Donner des conseils culturels pour Maurice
- Proposer des scripts et emails

Sois concis, actionable et toujours orienté résultats.`

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `${params.message}

Contexte: ${JSON.stringify(params.context || {}, null, 2)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })

      const response = completion.choices[0].message.content || ''
      
      // Extraire les suggestions d'actions si présentes
      const suggestions = this.extractSuggestions(response)
      
      return {
        response,
        suggestions,
        actions: []
      }
    } catch (error) {
      console.error('Erreur chat assistant:', error)
      throw error
    }
  }

  // Méthodes utilitaires privées
  private static async saveOptimization(commercial: string, date: string, optimization: any) {
    const supabase = supabaseAdmin()
    
    try {
      await supabase.from('ai_optimizations').insert({
        commercial,
        date,
        optimization_data: optimization,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Erreur sauvegarde optimisation:', error)
    }
  }

  private static async updateProspectScore(prospectNom: string, score: number) {
    const supabase = supabaseAdmin()
    
    try {
      await supabase
        .from('prospects')
        .update({
          score_ia: score / 100, // Normaliser sur 0-1
          derniere_analyse_ia: new Date().toISOString()
        })
        .eq('nom', prospectNom)
    } catch (error) {
      console.error('Erreur mise à jour score IA:', error)
    }
  }

  private static extractSuggestions(text: string): string[] {
    const suggestions: string[] = []
    
    // Extraire les bullet points ou suggestions
    const lines = text.split('\n')
    lines.forEach(line => {
      if (line.match(/^[-•*]\s+/) || line.match(/^\d+\.\s+/)) {
        suggestions.push(line.replace(/^[-•*\d.]\s+/, '').trim())
      }
    })
    
    return suggestions.slice(0, 5) // Max 5 suggestions
  }
}

/**
 * Fonction pour l'embedding de documents (pour la recherche sémantique)
 */
export async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    })
    
    return response.data[0].embedding
  } catch (error) {
    console.error('Erreur création embedding:', error)
    throw error
  }
}

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
