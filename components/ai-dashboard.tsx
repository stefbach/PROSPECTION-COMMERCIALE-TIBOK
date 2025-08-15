// components/ai-dashboard-enhanced.tsx
'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import RdvDialogEnhanced from '@/components/dialogs/rdv-dialog-enhanced'
import AIRulesConfig, { useAIRules } from '@/components/dialogs/ai-rules-config'
import HotelCategoryEditor from '@/components/dialogs/hotel-category-editor'
import {
  Brain, Calendar, MapPin, TrendingUp, Target, Sparkles, Clock, DollarSign,
  AlertCircle, CheckCircle, Phone, Mail, User, Zap, Hotel, Building2, Map,
  RefreshCw, Star, Eye, Settings, BarChart3, Activity, Filter, ChevronRight,
  Info, Users, Edit, Send, FileText, Save, X, Check, ArrowRight
} from 'lucide-react'

// Types
interface Prospect {
  id: number
  nom: string
  secteur: string
  ville: string
  district?: string
  score: number
  statut: string
  contact?: string
  telephone?: string
  email?: string
  adresse?: string
  notes?: string
  budget?: string
  created_at?: string
  updated_at?: string
  priorite?: number
  qualificationScore?: number
  lastInteraction?: string
  interactionCount?: number
  isHotLead?: boolean
  categorie_hotel?: string
  nombre_chambres?: number
  website?: string
}

// Structure pour les propositions (non sauvegardées en base immédiatement)
interface PropositionRDV {
  id: string // ID temporaire
  prospect: Prospect
  jour: string
  date: string
  heure: string
  duree: number
  type_visite: string
  priorite: 'haute' | 'normale' | 'urgente'
  zone: string
  aiScore: number
  raison: string
  estimatedRevenue: number
  selected: boolean // Pour permettre la sélection/désélection
}

interface WeeklyPropositions {
  [jour: string]: {
    zone: string
    focus: string
    propositions: PropositionRDV[]
    estimatedRevenue: number
    totalTime: number
    totalDistance: number
  }
}

interface AIMetrics {
  scoreGlobal: number
  opportunitesIdentifiees: number
  tauxConversionPrevu: number
  revenuPotentielMensuel: number
  zonesOptimales: string[]
  prochaineActionPrioritaire: string
  rdvPlanifies: number
  rdvConfirmes: number
  objectifProgression: number
}

interface ZoneStats {
  zone: string
  prospects: number
  hotels: number
  pharmacies: number
  potentiel: number
  scoreAverage: number
  hotLeads: number
}

export function AIDashboard({ commercial }: { commercial: string }) {
  // États principaux
  const [loading, setLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('dashboard')
  const [weeklyPropositions, setWeeklyPropositions] = React.useState<WeeklyPropositions | null>(null)
  const [selectedZone, setSelectedZone] = React.useState<string>('Nord')
  const [aiMetrics, setAiMetrics] = React.useState<AIMetrics | null>(null)
  const [prospects, setProspects] = React.useState<Prospect[]>([])
  const [generatingPlan, setGeneratingPlan] = React.useState(false)
  const [sendingPropositions, setSendingPropositions] = React.useState(false)
  const [zoneStats, setZoneStats] = React.useState<ZoneStats[]>([])
  const { toast } = useToast()

  // Système de règles IA
  const aiRules = useAIRules()
  const [showRulesConfig, setShowRulesConfig] = React.useState(false)

  // États pour la gestion des RDV
  const [showRdvDialog, setShowRdvDialog] = React.useState(false)
  const [selectedProspectForRdv, setSelectedProspectForRdv] = React.useState<Prospect | null>(null)
  const [showHotelCategoryEditor, setShowHotelCategoryEditor] = React.useState(false)
  const [selectedHotelForEdit, setSelectedHotelForEdit] = React.useState<Prospect | null>(null)
  const [rdvStats, setRdvStats] = React.useState({
    today: 0,
    week: 0,
    month: 0,
    confirmed: 0,
    pending: 0,
    completed: 0,
    propositions: 0 // Nouveau: nombre de propositions en attente
  })

  // Configuration commercial
  const [commercialInfo] = React.useState({
    nom: commercial || 'Karine MOMUS',
    adresse: 'Port Louis',
    ville: 'Port Louis',
    district: 'port-louis' as const
  })

  // Configuration des zones de Maurice
  const ZONES_MAURICE = {
    'Nord': {
      villes: ['Grand Baie', 'Pereybère', 'Cap Malheureux', 'Trou aux Biches'],
      couleur: 'blue',
      icone: '🏖️',
      focus: 'Hôtels touristiques et resorts'
    },
    'Centre': {
      villes: ['Port Louis', 'Quatre Bornes', 'Rose Hill', 'Curepipe'],
      couleur: 'purple',
      icone: '🏢',
      focus: 'Entreprises et pharmacies urbaines'
    },
    'Ouest': {
      villes: ['Flic en Flac', 'Tamarin', 'Le Morne', 'Cascavelle'],
      couleur: 'orange',
      icone: '🌅',
      focus: 'Hôtels côte ouest et centres commerciaux'
    },
    'Sud': {
      villes: ['Mahébourg', 'Blue Bay', 'Souillac', 'Bel Ombre'],
      couleur: 'green',
      icone: '✈️',
      focus: 'Zone aéroport et hôtels sud'
    },
    'Est': {
      villes: ['Belle Mare', 'Trou d\'Eau Douce', 'Flacq', 'Poste de Flacq'],
      couleur: 'cyan',
      icone: '🏝️',
      focus: 'Resorts de luxe côte est'
    }
  }

  // Charger les données au démarrage
  React.useEffect(() => {
    loadProspects()
    loadRdvStats()
  }, [])

  // Recalculer les métriques quand les prospects ou règles changent
  React.useEffect(() => {
    if (prospects.length > 0) {
      calculateAIMetrics()
      calculateZoneStats()
    }
  }, [prospects, aiRules])

  // Charger les prospects
  async function loadProspects() {
    try {
      const res = await fetch('/api/prospects?limit=1000')
      const result = await res.json()
      const data = result.data || result || []
      
      const enrichedProspects = data.map((p: any) => {
        const priorite = calculatePriorityWithRules(p)
        const qualificationScore = calculateQualificationScore(p)
        const isHotLead = checkIfHotLead(p)
        
        return {
          ...p,
          priorite,
          qualificationScore,
          isHotLead
        }
      })
      
      setProspects(enrichedProspects)
      return enrichedProspects
    } catch (error) {
      console.error('Erreur chargement prospects:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les prospects',
        variant: 'destructive'
      })
      return []
    }
  }

  // Charger les statistiques RDV incluant les propositions
  async function loadRdvStats() {
    try {
      const res = await fetch('/api/rdv?include_propositions=true')
      const rdvs = await res.json()
      
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const propositions = rdvs.filter((r: any) => r.statut === 'proposition')
      const confirmedRdvs = rdvs.filter((r: any) => r.statut !== 'proposition')
      
      setRdvStats({
        today: confirmedRdvs.filter((r: any) => r.date_time.startsWith(today)).length,
        week: confirmedRdvs.filter((r: any) => new Date(r.date_time) >= weekStart).length,
        month: confirmedRdvs.filter((r: any) => new Date(r.date_time) >= monthStart).length,
        confirmed: confirmedRdvs.filter((r: any) => r.statut === 'confirme').length,
        pending: confirmedRdvs.filter((r: any) => r.statut === 'planifie').length,
        completed: confirmedRdvs.filter((r: any) => r.statut === 'termine').length,
        propositions: propositions.length
      })
    } catch (error) {
      console.error('Erreur chargement RDV stats:', error)
    }
  }

  // Calculer la priorité avec les règles IA
  function calculatePriorityWithRules(prospect: any): number {
    let score = 50
    
    if (prospect.secteur === 'hotel') {
      score += aiRules.prioritization.hotelWeight * 0.5
    } else if (prospect.secteur === 'pharmacie') {
      score += aiRules.prioritization.pharmacyWeight * 0.5
    } else if (prospect.secteur === 'clinique') {
      score += aiRules.prioritization.clinicWeight * 0.5
    }
    
    score += (prospect.score || 3) * 5
    
    if (prospect.statut === 'nouveau') {
      score += aiRules.prioritization.newProspectBonus
    }
    
    if (prospect.statut === 'qualifie') score += 10
    else if (prospect.statut === 'proposition') score += 15
    else if (prospect.statut === 'negociation') score += 20
    
    if (checkIfHotLead(prospect)) {
      score *= aiRules.prioritization.hotLeadMultiplier
    }
    
    return Math.min(100, Math.round(score))
  }

  // Calculer le score de qualification
  function calculateQualificationScore(prospect: any): number {
    let score = 0
    
    if (prospect.score >= aiRules.qualification.autoQualifyScore) score += 30
    if (prospect.telephone) score += 20
    if (prospect.email) score += 15
    if (prospect.contact) score += 15
    if (prospect.budget) score += 20
    
    return score
  }

  // Vérifier si c'est un hot lead
  function checkIfHotLead(prospect: any): boolean {
    if (!prospect.notes) return false
    
    const notes = prospect.notes.toLowerCase()
    return aiRules.qualification.hotLeadIndicators.some(indicator => 
      notes.includes(indicator.toLowerCase())
    )
  }

  // Calculer les métriques IA globales
  async function calculateAIMetrics() {
    try {
      const hotels = prospects.filter(p => p.secteur === 'hotel')
      const pharmacies = prospects.filter(p => p.secteur === 'pharmacie')
      const hotLeads = prospects.filter(p => p.isHotLead)
      const qualified = prospects.filter(p => p.qualificationScore! >= 70)
      
      const revenuPotentiel = 
        hotels.length * aiRules.commercial.averageDealSize +
        pharmacies.length * (aiRules.commercial.averageDealSize * 0.7) +
        (prospects.length - hotels.length - pharmacies.length) * (aiRules.commercial.averageDealSize * 0.4)
      
      const objectifProgression = Math.min(100, (revenuPotentiel / aiRules.commercial.monthlyTarget) * 100)
      
      const metrics: AIMetrics = {
        scoreGlobal: Math.round((hotels.length * 2 + pharmacies.length * 1.5 + prospects.length) / 10),
        opportunitesIdentifiees: qualified.length,
        tauxConversionPrevu: aiRules.commercial.conversionTarget,
        revenuPotentielMensuel: revenuPotentiel,
        zonesOptimales: Object.entries(aiRules.zoneRules)
          .filter(([_, rule]) => rule.enabled && rule.priority >= 4)
          .map(([zone]) => zone),
        prochaineActionPrioritaire: hotLeads.length > 0 ? 
          `🔥 Contacter ${hotLeads[0].nom} - Lead chaud détecté!` :
          hotels.length > 0 ? 
            `Contacter ${hotels[0]?.nom} - Fort potentiel` :
            'Prospecter nouveaux hôtels Grand Baie',
        rdvPlanifies: rdvStats.pending,
        rdvConfirmes: rdvStats.confirmed,
        objectifProgression
      }
      
      setAiMetrics(metrics)
    } catch (error) {
      console.error('Erreur calcul métriques:', error)
    }
  }

  // Calculer les statistiques par zone
  function calculateZoneStats() {
    const stats: ZoneStats[] = Object.entries(ZONES_MAURICE).map(([zone, config]) => {
      const zoneProspects = prospects.filter(p => 
        config.villes.some(v => p.ville?.toLowerCase().includes(v.toLowerCase()))
      )
      
      const hotels = zoneProspects.filter(p => p.secteur === 'hotel')
      const pharmacies = zoneProspects.filter(p => p.secteur === 'pharmacie')
      const hotLeads = zoneProspects.filter(p => p.isHotLead)
      
      const potentiel = 
        hotels.length * aiRules.commercial.averageDealSize +
        pharmacies.length * (aiRules.commercial.averageDealSize * 0.7)
      
      const scoreAverage = zoneProspects.length > 0
        ? zoneProspects.reduce((sum, p) => sum + (p.score || 0), 0) / zoneProspects.length
        : 0
      
      return {
        zone,
        prospects: zoneProspects.length,
        hotels: hotels.length,
        pharmacies: pharmacies.length,
        potentiel,
        scoreAverage: Math.round(scoreAverage * 10) / 10,
        hotLeads: hotLeads.length
      }
    })
    
    setZoneStats(stats.sort((a, b) => b.potentiel - a.potentiel))
  }

  // NOUVEAU: Générer des PROPOSITIONS (pas des RDV directs)
  async function generateWeeklyPropositions() {
    setGeneratingPlan(true)
    try {
      const propositions = await generatePropositionsWithAIRules(prospects)
      setWeeklyPropositions(propositions)
      
      const totalPropositions = Object.values(propositions).reduce(
        (sum, day) => sum + day.propositions.length, 0
      )
      
      toast({
        title: '✨ Propositions IA générées',
        description: `${totalPropositions} RDV proposés selon vos règles. Révisez avant envoi vers Planning.`
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer les propositions',
        variant: 'destructive'
      })
    } finally {
      setGeneratingPlan(false)
    }
  }

  // Générer les propositions avec les règles IA
  async function generatePropositionsWithAIRules(allProspects: Prospect[]): Promise<WeeklyPropositions> {
    const propositions: WeeklyPropositions = {}
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
    
    const eligibleProspects = allProspects.filter(p => 
      p.score >= aiRules.prioritization.scoreThreshold
    )
    
    const zoneGroups: Record<string, Prospect[]> = {}
    eligibleProspects.forEach(prospect => {
      const zone = getProspectZone(prospect.ville || '')
      if (!zoneGroups[zone]) zoneGroups[zone] = []
      
      if (aiRules.zoneRules[zone]?.enabled) {
        zoneGroups[zone].push(prospect)
      }
    })
    
    days.forEach(day => {
      const preferredZones = Object.entries(aiRules.zoneRules)
        .filter(([_, rule]) => rule.enabled && rule.preferredDays.includes(day))
        .sort((a, b) => b[1].priority - a[1].priority)
      
      if (preferredZones.length > 0) {
        const [selectedZone, zoneRule] = preferredZones[0]
        const zoneProspects = zoneGroups[selectedZone] || []
        
        let dayProspects = zoneProspects.filter(p => 
          zoneRule.focusSectors.includes(p.secteur)
        )
        
        dayProspects.sort((a, b) => (b.priorite || 0) - (a.priorite || 0))
        dayProspects = dayProspects.slice(0, aiRules.scheduling.maxAppointmentsPerDay)
        
        // Créer des propositions (pas des RDV)
        const dayPropositions: PropositionRDV[] = dayProspects.map((prospect, idx) => {
          const date = getNextDateForDay(day)
          const startTime = parseTimeToMinutes(aiRules.scheduling.startHour)
          const currentTime = startTime + (idx * (60 + aiRules.scheduling.travelTime))
          
          return {
            id: `prop_${Date.now()}_${prospect.id}_${idx}`,
            prospect,
            jour: day,
            date,
            heure: `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`,
            duree: aiRules.scheduling.appointmentDuration.decouverte,
            type_visite: 'decouverte',
            priorite: prospect.isHotLead ? 'urgente' : prospect.priorite! >= 80 ? 'haute' : 'normale',
            zone: selectedZone,
            aiScore: prospect.priorite || 50,
            raison: `Score: ${prospect.priorite}/100${prospect.isHotLead ? ' - 🔥 HOT LEAD' : ''}`,
            estimatedRevenue: prospect.secteur === 'hotel' ? 
              aiRules.commercial.averageDealSize : 
              aiRules.commercial.averageDealSize * 0.7,
            selected: true // Par défaut sélectionné
          }
        })
        
        const estimatedRevenue = dayPropositions.reduce((sum, p) => sum + p.estimatedRevenue, 0)
        const totalTime = dayPropositions.length * 
          (aiRules.scheduling.appointmentDuration.decouverte + aiRules.scheduling.travelTime)
        const totalDistance = dayPropositions.length * 15
        
        propositions[day] = {
          zone: selectedZone,
          focus: ZONES_MAURICE[selectedZone as keyof typeof ZONES_MAURICE]?.focus || '',
          propositions: dayPropositions,
          estimatedRevenue,
          totalTime,
          totalDistance
        }
      } else {
        propositions[day] = {
          zone: 'Centre',
          focus: 'Zone par défaut',
          propositions: [],
          estimatedRevenue: 0,
          totalTime: 0,
          totalDistance: 0
        }
      }
    })
    
    return propositions
  }

  // NOUVEAU: Envoyer les propositions sélectionnées vers Planning
  async function sendPropositionsToPlanning() {
    if (!weeklyPropositions) {
      toast({
        title: 'Aucune proposition',
        description: 'Générez d\'abord des propositions IA',
        variant: 'destructive'
      })
      return
    }
    
    setSendingPropositions(true)
    
    try {
      // Collecter toutes les propositions sélectionnées
      const selectedPropositions: any[] = []
      
      Object.entries(weeklyPropositions).forEach(([jour, data]) => {
        data.propositions
          .filter(p => p.selected) // Seulement celles qui sont cochées
          .forEach(prop => {
            selectedPropositions.push({
              prospect_id: prop.prospect.id,
              prospect_nom: prop.prospect.nom,
              commercial: commercial || 'Karine MOMUS',
              date_time: `${prop.date}T${prop.heure}:00`,
              duree_min: prop.duree,
              type_visite: prop.type_visite,
              priorite: prop.priorite,
              statut: 'proposition', // Important: statut proposition
              notes: `🤖 Proposition IA - ${prop.raison}`,
              lieu: prop.prospect.adresse || `${prop.prospect.ville}`,
              ai_score: prop.aiScore,
              ai_reason: prop.raison,
              source: 'ai'
            })
          })
      })
      
      if (selectedPropositions.length === 0) {
        toast({
          title: 'Aucune proposition sélectionnée',
          description: 'Sélectionnez au moins une proposition à envoyer',
          variant: 'destructive'
        })
        setSendingPropositions(false)
        return
      }
      
      // Envoyer en masse vers l'API
      const res = await fetch('/api/rdv', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propositions: selectedPropositions })
      })
      
      if (!res.ok) throw new Error('Erreur envoi propositions')
      
      const result = await res.json()
      
      toast({
        title: '✅ Propositions envoyées vers Planning',
        description: `${result.success} propositions en attente de validation par l'agent`
      })
      
      // Réinitialiser les propositions
      setWeeklyPropositions(null)
      await loadRdvStats()
      
      // Proposer de basculer vers Planning
      if (confirm('Les propositions ont été envoyées. Voulez-vous aller dans Planning pour les valider ?')) {
        window.location.href = '/planning'
      }
      
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer les propositions',
        variant: 'destructive'
      })
    } finally {
      setSendingPropositions(false)
    }
  }

  // Basculer la sélection d'une proposition
  function togglePropositionSelection(jour: string, propId: string) {
    if (!weeklyPropositions) return
    
    setWeeklyPropositions(prev => {
      if (!prev) return prev
      
      const updated = { ...prev }
      updated[jour] = {
        ...updated[jour],
        propositions: updated[jour].propositions.map(p => 
          p.id === propId ? { ...p, selected: !p.selected } : p
        )
      }
      
      return updated
    })
  }

  // Utilitaires
  function getProspectZone(location: string): string {
    if (!location) return 'Centre'
    
    for (const [zone, config] of Object.entries(ZONES_MAURICE)) {
      if (config.villes.some(ville => location.toLowerCase().includes(ville.toLowerCase()))) {
        return zone
      }
    }
    
    return 'Centre'
  }

  function getNextDateForDay(dayName: string): string {
    const days: Record<string, number> = {
      'Lundi': 1, 'Mardi': 2, 'Mercredi': 3, 'Jeudi': 4, 'Vendredi': 5
    }
    
    const today = new Date()
    const targetDay = days[dayName]
    const currentDay = today.getDay()
    
    let daysToAdd = targetDay - currentDay
    if (daysToAdd <= 0) daysToAdd += 7
    
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + daysToAdd)
    
    return targetDate.toISOString().split('T')[0]
  }

  function parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Créer un RDV manuel (pas une proposition)
  async function handleCreateRdv(prospect: Prospect) {
    setSelectedProspectForRdv(prospect)
    setShowRdvDialog(true)
  }

  // Sauvegarder le RDV (création directe, pas proposition)
  async function saveRdv(data: any) {
    try {
      const response = await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          date_time: `${data.date}T${data.time}:00`,
          commercial: commercial || 'Karine MOMUS',
          statut: 'planifie' // RDV direct, pas proposition
        })
      })

      if (!response.ok) throw new Error('Erreur création RDV')

      await loadRdvStats()
      
      toast({
        title: '✅ RDV créé',
        description: `Rendez-vous planifié avec ${data.prospect?.nom || selectedProspectForRdv?.nom}`
      })
      
      setShowRdvDialog(false)
      setSelectedProspectForRdv(null)
      
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le RDV',
        variant: 'destructive'
      })
    }
  }

  // Mettre à jour un prospect
  async function updateProspect(id: number, updates: Partial<Prospect>) {
    try {
      const res = await fetch(`/api/prospects`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })
      
      if (!res.ok) throw new Error('Erreur mise à jour prospect')
      
      setProspects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
      
      toast({
        title: '✅ Prospect mis à jour',
        description: 'Les modifications ont été enregistrées'
      })
      
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le prospect',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec métriques principales */}
      <Card className="border-gradient bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">ProspectMed IA - Mode Propositions</CardTitle>
                <CardDescription>
                  L'IA suggère, vous validez dans Planning avant confirmation
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRulesConfig(true)}
                className="bg-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Règles IA
              </Button>
              <Badge variant="outline" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Mode Proposition
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Nouvelle alerte sur le processus */}
      {rdvStats.propositions > 0 && (
        <Alert className="border-purple-200 bg-purple-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">
                  📋 {rdvStats.propositions} propositions en attente dans Planning
                </span>
                <p className="text-sm mt-1">
                  Les propositions doivent être validées et confirmées avec les prospects avant de devenir des RDV définitifs.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => window.location.href = '/planning'}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Voir dans Planning
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Métriques IA (inchangées) */}
      {aiMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
          {/* Toutes les cartes de métriques existantes... */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score IA</p>
                  <p className="text-2xl font-bold">{aiMetrics.scoreGlobal}/100</p>
                </div>
                <Brain className="h-8 w-8 text-indigo-500 opacity-50" />
              </div>
              <Progress value={aiMetrics.scoreGlobal} className="mt-2" />
            </CardContent>
          </Card>

          {/* ... autres cartes métriques ... */}
        </div>
      )}

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">
            <Brain className="h-4 w-4 mr-2" />
            Dashboard IA
          </TabsTrigger>
          <TabsTrigger value="planning">
            <Calendar className="h-4 w-4 mr-2" />
            Propositions
            {weeklyPropositions && (
              <Badge className="ml-2 bg-purple-600">
                {Object.values(weeklyPropositions).reduce((sum, day) => 
                  sum + day.propositions.filter(p => p.selected).length, 0
                )}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="zones">
            <Map className="h-4 w-4 mr-2" />
            Analyse Zones
          </TabsTrigger>
          <TabsTrigger value="hotels">
            <Hotel className="h-4 w-4 mr-2" />
            Hôtels
          </TabsTrigger>
          <TabsTrigger value="pharmacies">
            <Building2 className="h-4 w-4 mr-2" />
            Pharmacies
          </TabsTrigger>
        </TabsList>

        {/* Tab Dashboard IA (inchangé) */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Contenu existant du dashboard... */}
        </TabsContent>

        {/* Tab Propositions (remplace Planning Auto) */}
        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Propositions de Planning Hebdomadaire
                  </CardTitle>
                  <CardDescription>
                    Générez et révisez les propositions avant envoi vers Planning pour validation
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {weeklyPropositions && (
                    <Button
                      onClick={sendPropositionsToPlanning}
                      disabled={sendingPropositions}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {sendingPropositions ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Envoyer vers Planning
                        </>
                      )}
                    </Button>
                  )}
                  <Button 
                    onClick={generateWeeklyPropositions}
                    disabled={generatingPlan}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {generatingPlan ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Génération IA...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Générer Propositions
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {weeklyPropositions ? (
                <div className="space-y-4">
                  {/* Résumé des sélections */}
                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>
                          {Object.values(weeklyPropositions).reduce((sum, day) => 
                            sum + day.propositions.filter(p => p.selected).length, 0
                          )} propositions sélectionnées sur {
                            Object.values(weeklyPropositions).reduce((sum, day) => 
                              sum + day.propositions.length, 0
                            )
                          } générées
                        </span>
                        <span className="font-medium">
                          Revenu estimé: Rs {
                            Object.values(weeklyPropositions).reduce((sum, day) => 
                              sum + day.propositions.filter(p => p.selected)
                                .reduce((s, p) => s + p.estimatedRevenue, 0), 0
                            ).toLocaleString()
                          }
                        </span>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {/* Propositions par jour */}
                  {Object.entries(weeklyPropositions).map(([jour, data]) => {
                    const zoneConfig = ZONES_MAURICE[data.zone as keyof typeof ZONES_MAURICE]
                    const selectedCount = data.propositions.filter(p => p.selected).length
                    
                    return (
                      <Card key={jour} className="border-l-4" style={{ borderLeftColor: `var(--${zoneConfig?.couleur || 'blue'}-500)` }}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{zoneConfig?.icone}</span>
                              <div>
                                <h3 className="font-semibold text-lg">{jour}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Zone {data.zone} • {data.focus}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {selectedCount}/{data.propositions.length} sélectionnés
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-green-600">
                                Rs {data.propositions.filter(p => p.selected)
                                  .reduce((s, p) => s + p.estimatedRevenue, 0).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-600">
                                ~{Math.round(data.totalTime / 60)}h • ~{data.totalDistance}km
                              </p>
                            </div>
                          </div>
                          
                          {data.propositions.length > 0 ? (
                            <div className="space-y-2">
                              {data.propositions.map((prop, idx) => (
                                <div 
                                  key={prop.id}
                                  className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                                    prop.selected ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 opacity-60'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={prop.selected}
                                    onChange={() => togglePropositionSelection(jour, prop.id)}
                                    className="h-4 w-4"
                                  />
                                  <span className="font-medium text-gray-500 w-6">{idx + 1}.</span>
                                  <Badge variant="outline" className="text-xs">
                                    {prop.prospect.secteur === 'hotel' ? '🏨' : 
                                     prop.prospect.secteur === 'pharmacie' ? '💊' :
                                     prop.prospect.secteur === 'clinique' ? '🏥' : '🏢'}
                                  </Badge>
                                  <span className="flex-1 font-medium">{prop.prospect.nom}</span>
                                  <span className="text-sm text-gray-600">
                                    {prop.heure}
                                  </span>
                                  {prop.prospect.isHotLead && (
                                    <Badge className="bg-orange-500 text-xs">HOT</Badge>
                                  )}
                                  <Badge className={`text-xs ${
                                    prop.priorite === 'urgente' ? 'bg-red-500' : 
                                    prop.priorite === 'haute' ? 'bg-orange-500' : 'bg-blue-500'
                                  }`}>
                                    {prop.aiScore}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleCreateRdv(prop.prospect)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <Alert>
                              <Info className="h-4 w-4" />
                              <AlertDescription>
                                Aucune proposition pour cette zone selon vos règles
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    Cliquez sur "Générer Propositions" pour créer des suggestions de RDV optimisées.
                    Vous pourrez ensuite les réviser avant de les envoyer vers Planning pour validation.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Autres tabs (inchangées) */}
        <TabsContent value="zones" className="space-y-4">
          {/* Contenu zones existant... */}
        </TabsContent>

        <TabsContent value="hotels" className="space-y-4">
          {/* Contenu hôtels existant... */}
        </TabsContent>

        <TabsContent value="pharmacies" className="space-y-4">
          {/* Contenu pharmacies existant... */}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showRdvDialog && (
        <RdvDialogEnhanced
          open={showRdvDialog}
          onClose={() => {
            setShowRdvDialog(false)
            setSelectedProspectForRdv(null)
          }}
          prospects={prospects}
          rdv={selectedProspectForRdv ? {
            id: 0,
            prospect_id: selectedProspectForRdv.id,
            prospect_nom: selectedProspectForRdv.nom,
            prospect: selectedProspectForRdv,
            commercial: commercial || 'Karine MOMUS',
            titre: `RDV - ${selectedProspectForRdv.nom}`,
            date_time: new Date().toISOString(),
            duree_min: aiRules.scheduling.appointmentDuration.decouverte,
            type_visite: 'decouverte' as const,
            priorite: selectedProspectForRdv.isHotLead ? 'urgente' as const : 'normale' as const,
            statut: 'planifie' as const,
            notes: selectedProspectForRdv.isHotLead ? '🔥 HOT LEAD - Priorité maximale' : '',
            lieu: selectedProspectForRdv.adresse || `${selectedProspectForRdv.ville}, ${selectedProspectForRdv.district || ''}`
          } : null}
          onSave={saveRdv}
          commercialInfo={commercialInfo}
        />
      )}

      <AIRulesConfig
        open={showRulesConfig}
        onClose={() => setShowRulesConfig(false)}
        onSave={() => {
          loadProspects()
          setShowRulesConfig(false)
        }}
      />

      {selectedHotelForEdit && (
        <HotelCategoryEditor
          open={showHotelCategoryEditor}
          onClose={() => {
            setShowHotelCategoryEditor(false)
            setSelectedHotelForEdit(null)
          }}
          hotel={selectedHotelForEdit}
          onUpdate={async (updates) => {
            await updateProspect(selectedHotelForEdit.id, updates)
            setShowHotelCategoryEditor(false)
            setSelectedHotelForEdit(null)
          }}
        />
      )}
    </div>
  )
}
