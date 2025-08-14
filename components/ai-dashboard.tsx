// components/ai-dashboard.tsx
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
import {
  Brain,
  Calendar,
  MapPin,
  TrendingUp,
  Target,
  Sparkles,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Phone,
  Mail,
  User,
  Zap,
  Hotel,
  Building2,
  Map,
  RefreshCw,
  Star,
  Eye,
  Settings,
  BarChart3,
  Activity,
  Filter,
  BarChart3,
  Activity,
  Filter,
  ChevronRight,
  Info,
  Users
} from 'lucide-react'
  ChevronRight,
  Info
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
  // Métriques calculées
  priorite?: number
  qualificationScore?: number
  lastInteraction?: string
  interactionCount?: number
  isHotLead?: boolean
}

interface WeeklyPlanning {
  [key: string]: {
    zone: string
    focus: string
    prospects: Prospect[]
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
  const [weeklyPlanning, setWeeklyPlanning] = React.useState<WeeklyPlanning | null>(null)
  const [selectedZone, setSelectedZone] = React.useState<string>('Nord')
  const [aiMetrics, setAiMetrics] = React.useState<AIMetrics | null>(null)
  const [prospects, setProspects] = React.useState<Prospect[]>([])
  const [generatingPlan, setGeneratingPlan] = React.useState(false)
  const [zoneStats, setZoneStats] = React.useState<ZoneStats[]>([])
  const { toast } = useToast()

  // Système de règles IA
  const aiRules = useAIRules()
  const [showRulesConfig, setShowRulesConfig] = React.useState(false)

  // États pour la gestion des RDV
  const [showRdvDialog, setShowRdvDialog] = React.useState(false)
  const [selectedProspectForRdv, setSelectedProspectForRdv] = React.useState<Prospect | null>(null)
  const [rdvStats, setRdvStats] = React.useState({
    today: 0,
    week: 0,
    month: 0,
    confirmed: 0,
    pending: 0,
    completed: 0
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
      
      // Enrichir avec scoring basé sur les règles IA
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

  // Charger les statistiques RDV
  async function loadRdvStats() {
    try {
      const res = await fetch('/api/rdv')
      const rdvs = await res.json()
      
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      
      setRdvStats({
        today: rdvs.filter((r: any) => r.date_time.startsWith(today)).length,
        week: rdvs.filter((r: any) => new Date(r.date_time) >= weekStart).length,
        month: rdvs.filter((r: any) => new Date(r.date_time) >= monthStart).length,
        confirmed: rdvs.filter((r: any) => r.statut === 'confirme').length,
        pending: rdvs.filter((r: any) => r.statut === 'planifie').length,
        completed: rdvs.filter((r: any) => r.statut === 'termine').length
      })
    } catch (error) {
      console.error('Erreur chargement RDV stats:', error)
    }
  }

  // Calculer la priorité avec les règles IA
  function calculatePriorityWithRules(prospect: any): number {
    let score = 50
    
    // Appliquer les poids des secteurs depuis les règles
    if (prospect.secteur === 'hotel') {
      score += aiRules.prioritization.hotelWeight * 0.5
    } else if (prospect.secteur === 'pharmacie') {
      score += aiRules.prioritization.pharmacyWeight * 0.5
    } else if (prospect.secteur === 'clinique') {
      score += aiRules.prioritization.clinicWeight * 0.5
    }
    
    // Bonus score qualité
    score += (prospect.score || 3) * 5
    
    // Bonus nouveau prospect si configuré
    if (prospect.statut === 'nouveau') {
      score += aiRules.prioritization.newProspectBonus
    }
    
    // Bonus statut
    if (prospect.statut === 'qualifie') score += 10
    else if (prospect.statut === 'proposition') score += 15
    else if (prospect.statut === 'negociation') score += 20
    
    // Multiplicateur hot lead
    if (checkIfHotLead(prospect)) {
      score *= aiRules.prioritization.hotLeadMultiplier
    }
    
    return Math.min(100, Math.round(score))
  }

  // Calculer le score de qualification
  function calculateQualificationScore(prospect: any): number {
    let score = 0
    
    // Score de base
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
      
      // Calculer le potentiel de revenu basé sur les règles
      const revenuPotentiel = 
        hotels.length * aiRules.commercial.averageDealSize +
        pharmacies.length * (aiRules.commercial.averageDealSize * 0.7) +
        (prospects.length - hotels.length - pharmacies.length) * (aiRules.commercial.averageDealSize * 0.4)
      
      // Progression vers l'objectif mensuel
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

  // Générer le planning hebdomadaire avec les règles IA
  async function generateWeeklyPlanning() {
    setGeneratingPlan(true)
    try {
      const planning = await generatePlanningWithAIRules(prospects)
      setWeeklyPlanning(planning)
      
      // Proposition de création automatique des RDV
      const totalProspects = Object.values(planning).reduce((sum, day) => sum + day.prospects.length, 0)
      
      if (totalProspects > 0) {
        const confirm = window.confirm(
          `L'IA a planifié ${totalProspects} visites optimisées.\n` +
          `Voulez-vous créer automatiquement les RDV dans votre agenda ?`
        )
        
        if (confirm) {
          await createAutomaticRdvsFromPlanning(planning)
        }
      }
      
      toast({
        title: '✅ Planning IA généré',
        description: `${totalProspects} visites optimisées selon vos règles personnalisées`
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le planning',
        variant: 'destructive'
      })
    } finally {
      setGeneratingPlan(false)
    }
  }

  // Générer le planning avec les règles IA
  async function generatePlanningWithAIRules(allProspects: Prospect[]): Promise<WeeklyPlanning> {
    const planning: WeeklyPlanning = {}
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
    
    // Filtrer les prospects selon le score minimum
    const eligibleProspects = allProspects.filter(p => 
      p.score >= aiRules.prioritization.scoreThreshold
    )
    
    // Grouper par zones et calculer les priorités
    const zoneGroups: Record<string, Prospect[]> = {}
    eligibleProspects.forEach(prospect => {
      const zone = getProspectZone(prospect.ville || '')
      if (!zoneGroups[zone]) zoneGroups[zone] = []
      
      // Vérifier si la zone est activée dans les règles
      if (aiRules.zoneRules[zone]?.enabled) {
        zoneGroups[zone].push(prospect)
      }
    })
    
    // Planifier selon les règles de zones
    days.forEach(day => {
      // Trouver les zones préférées pour ce jour
      const preferredZones = Object.entries(aiRules.zoneRules)
        .filter(([_, rule]) => rule.enabled && rule.preferredDays.includes(day))
        .sort((a, b) => b[1].priority - a[1].priority)
      
      if (preferredZones.length > 0) {
        const [selectedZone, zoneRule] = preferredZones[0]
        const zoneProspects = zoneGroups[selectedZone] || []
        
        // Filtrer par secteurs focus de la zone
        let dayProspects = zoneProspects.filter(p => 
          zoneRule.focusSectors.includes(p.secteur)
        )
        
        // Trier par priorité
        dayProspects.sort((a, b) => (b.priorite || 0) - (a.priorite || 0))
        
        // Limiter selon le max de RDV par jour
        dayProspects = dayProspects.slice(0, aiRules.scheduling.maxAppointmentsPerDay)
        
        // Calculer les métriques
        const estimatedRevenue = dayProspects.reduce((sum, p) => {
          if (p.secteur === 'hotel') return sum + aiRules.commercial.averageDealSize
          if (p.secteur === 'pharmacie') return sum + aiRules.commercial.averageDealSize * 0.7
          return sum + aiRules.commercial.averageDealSize * 0.4
        }, 0)
        
        const totalTime = dayProspects.length * 
          (aiRules.scheduling.appointmentDuration.decouverte + aiRules.scheduling.travelTime)
        
        const totalDistance = dayProspects.length * 15 // Estimation moyenne
        
        planning[day] = {
          zone: selectedZone,
          focus: ZONES_MAURICE[selectedZone as keyof typeof ZONES_MAURICE]?.focus || '',
          prospects: dayProspects,
          estimatedRevenue,
          totalTime,
          totalDistance
        }
      } else {
        // Aucune zone préférée, planning par défaut
        planning[day] = {
          zone: 'Centre',
          focus: 'Zone par défaut',
          prospects: [],
          estimatedRevenue: 0,
          totalTime: 0,
          totalDistance: 0
        }
      }
    })
    
    return planning
  }

  // Créer automatiquement les RDV depuis le planning
  async function createAutomaticRdvsFromPlanning(planning: WeeklyPlanning) {
    let successCount = 0
    let errorCount = 0
    
    for (const [jour, data] of Object.entries(planning)) {
      const date = getNextDateForDay(jour)
      let currentTime = parseTimeToMinutes(aiRules.scheduling.startHour)
      
      for (const prospect of data.prospects) {
        // Vérifier la pause déjeuner
        const lunchStart = parseTimeToMinutes(aiRules.scheduling.lunchBreakStart)
        const lunchEnd = parseTimeToMinutes(aiRules.scheduling.lunchBreakEnd)
        
        if (currentTime >= lunchStart && currentTime < lunchEnd) {
          currentTime = lunchEnd
        }
        
        // Vérifier la fin de journée
        const endTime = parseTimeToMinutes(aiRules.scheduling.endHour)
        if (currentTime >= endTime) break
        
        const hours = Math.floor(currentTime / 60)
        const minutes = currentTime % 60
        
        try {
          const rdvData = {
            prospect_id: prospect.id,
            prospect_nom: prospect.nom,
            commercial: commercial || 'Karine MOMUS',
            date_time: `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
            duree_min: aiRules.scheduling.appointmentDuration.decouverte,
            type_visite: 'decouverte',
            priorite: prospect.isHotLead ? 'urgente' : prospect.priorite! >= 80 ? 'haute' : 'normale',
            statut: 'planifie',
            lieu: prospect.adresse || `${prospect.ville}`,
            notes: `RDV planifié par IA - Score: ${prospect.priorite}/100${prospect.isHotLead ? ' - 🔥 HOT LEAD' : ''}`,
            prospect: prospect
          }
          
          const res = await fetch('/api/rdv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rdvData)
          })
          
          if (res.ok) {
            successCount++
          } else {
            errorCount++
          }
          
          // Passer au créneau suivant
          currentTime += aiRules.scheduling.appointmentDuration.decouverte + 
                        aiRules.scheduling.travelTime + 
                        aiRules.scheduling.bufferTime
          
        } catch (error) {
          errorCount++
        }
      }
    }
    
    await loadRdvStats() // Recharger les stats
    
    toast({
      title: '✅ RDV créés',
      description: `${successCount} RDV créés avec succès${errorCount > 0 ? `, ${errorCount} erreurs` : ''}`
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

  // Créer un RDV manuel
  async function handleCreateRdv(prospect: Prospect) {
    setSelectedProspectForRdv(prospect)
    setShowRdvDialog(true)
  }

  // Sauvegarder le RDV
  async function saveRdv(data: any) {
    try {
      const response = await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          date_time: `${data.date}T${data.time}:00`,
          commercial: commercial || 'Karine MOMUS'
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
      console.error('Erreur création RDV:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le RDV',
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
                <CardTitle className="text-2xl">ProspectMed IA - Assistant Commercial Intelligent</CardTitle>
                <CardDescription>
                  Optimisation automatique basée sur vos règles personnalisées
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
                GPT-4 Turbo
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Métriques IA */}
      {aiMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
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

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Opportunités</p>
                  <p className="text-2xl font-bold">{aiMetrics.opportunitesIdentifiees}</p>
                </div>
                <Target className="h-8 w-8 text-green-500 opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Qualifiées</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion</p>
                  <p className="text-2xl font-bold">{aiMetrics.tauxConversionPrevu}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
              <Progress value={aiMetrics.tauxConversionPrevu} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Potentiel</p>
                  <p className="text-xl font-bold">Rs {(aiMetrics.revenuPotentielMensuel / 1000).toFixed(0)}k</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Objectif</p>
                  <p className="text-2xl font-bold">{Math.round(aiMetrics.objectifProgression)}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-500 opacity-50" />
              </div>
              <Progress value={aiMetrics.objectifProgression} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">RDV Jour</p>
                  <p className="text-2xl font-bold">{rdvStats.today}</p>
                </div>
                <Calendar className="h-8 w-8 text-cyan-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Confirmés</p>
                  <p className="text-2xl font-bold">{rdvStats.confirmed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-orange-600" />
                <p className="text-xs font-medium">Action Prioritaire</p>
              </div>
              <p className="text-xs font-bold text-orange-700 line-clamp-2">
                {aiMetrics.prochaineActionPrioritaire}
              </p>
            </CardContent>
          </Card>
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
            Planning Auto
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

        {/* Tab Dashboard IA */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Hot Leads Alert */}
          {prospects.filter(p => p.isHotLead).length > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-orange-900">
                      🔥 {prospects.filter(p => p.isHotLead).length} Hot Leads détectés !
                    </span>
                    <div className="mt-2 space-y-1">
                      {prospects.filter(p => p.isHotLead).slice(0, 3).map(lead => (
                        <div key={lead.id} className="flex items-center gap-2">
                          <Badge className="bg-orange-600">HOT</Badge>
                          <span className="text-sm">{lead.nom} - {lead.ville}</span>
                          <Button
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => handleCreateRdv(lead)}
                          >
                            Contacter
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Zones Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance par Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {zoneStats.map(stat => (
                  <div key={stat.zone} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {ZONES_MAURICE[stat.zone as keyof typeof ZONES_MAURICE]?.icone}
                      </span>
                      <div>
                        <p className="font-medium">{stat.zone}</p>
                        <p className="text-sm text-muted-foreground">
                          {stat.prospects} prospects • Score moy: {stat.scoreAverage}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {stat.hotLeads > 0 && (
                        <Badge className="bg-orange-100 text-orange-800">
                          🔥 {stat.hotLeads} hot
                        </Badge>
                      )}
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          Rs {(stat.potentiel / 1000).toFixed(0)}k
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stat.hotels}H + {stat.pharmacies}P
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Recommandations IA Personnalisées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiMetrics?.zonesOptimales.map(zone => (
                  <div key={zone} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Zone {zone} prioritaire cette semaine</p>
                      <p className="text-sm text-muted-foreground">
                        {aiRules.zoneRules[zone]?.preferredDays.join(', ')} - 
                        Focus: {aiRules.zoneRules[zone]?.focusSectors.join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
                
                {aiRules.scheduling.maxAppointmentsPerDay < 10 && (
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Optimisation suggérée</p>
                      <p className="text-sm text-muted-foreground">
                        Augmentez le nombre de RDV/jour à 10 pour atteindre l'objectif mensuel
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Planning Automatique */}
        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Planning Hebdomadaire Intelligent
                  </CardTitle>
                  <CardDescription>
                    Génération basée sur vos règles IA personnalisées
                  </CardDescription>
                </div>
                <Button 
                  onClick={generateWeeklyPlanning}
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
                      Générer Planning IA
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {weeklyPlanning ? (
                <div className="space-y-4">
                  {Object.entries(weeklyPlanning).map(([jour, data]) => {
                    const zoneConfig = ZONES_MAURICE[data.zone as keyof typeof ZONES_MAURICE]
                    const zoneRule = aiRules.zoneRules[data.zone]
                    
                    return (
                      <Card key={jour} className="border-l-4" style={{ borderLeftColor: `var(--${zoneConfig?.couleur || 'blue'}-500)` }}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{zoneConfig?.icone}</span>
                                <div>
                                  <h3 className="font-semibold text-lg">{jour}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    Zone {data.zone} • {data.focus}
                                  </p>
                                </div>
                                {zoneRule && (
                                  <Badge variant="outline">
                                    Priorité {zoneRule.priority}/5
                                  </Badge>
                                )}
                              </div>
                              
                              {data.prospects.length > 0 ? (
                                <div className="space-y-2 mt-3">
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span>{data.prospects.length} visites</span>
                                    <span>~{Math.round(data.totalTime / 60)}h</span>
                                    <span>~{data.totalDistance}km</span>
                                    <span className="font-medium text-green-600">
                                      Rs {(data.estimatedRevenue / 1000).toFixed(0)}k
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {data.prospects.slice(0, 4).map((prospect, idx) => (
                                      <div 
                                        key={idx} 
                                        className="flex items-center gap-2 text-sm p-2 bg-muted rounded cursor-pointer hover:bg-accent"
                                        onClick={() => handleCreateRdv(prospect)}
                                      >
                                        <Badge variant="outline" className="text-xs">
                                          {prospect.secteur === 'hotel' ? '🏨' : 
                                           prospect.secteur === 'pharmacie' ? '💊' :
                                           prospect.secteur === 'clinique' ? '🏥' : '🏢'}
                                        </Badge>
                                        <span className="flex-1 truncate">{prospect.nom}</span>
                                        {prospect.isHotLead && (
                                          <Badge className="bg-orange-500 text-xs">HOT</Badge>
                                        )}
                                        <Badge className={prospect.priorite! >= 80 ? 'bg-red-500' : 'bg-blue-500'}>
                                          {prospect.priorite}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {data.prospects.length > 4 && (
                                    <p className="text-xs text-muted-foreground">
                                      +{data.prospects.length - 4} autres prospects
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <Alert>
                                  <Info className="h-4 w-4" />
                                  <AlertDescription>
                                    Aucun prospect éligible pour cette zone selon vos règles
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    Cliquez sur "Générer Planning IA" pour créer votre planning optimisé selon vos règles personnalisées
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Zones */}
        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse Géographique Intelligente</CardTitle>
              <CardDescription>
                Zones optimisées selon vos règles IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(ZONES_MAURICE).map(([zone, config]) => {
                  const stat = zoneStats.find(s => s.zone === zone)
                  const zoneRule = aiRules.zoneRules[zone]
                  const isEnabled = zoneRule?.enabled ?? false
                  
                  return (
                    <Card 
                      key={zone} 
                      className={`cursor-pointer hover:shadow-lg transition-all ${!isEnabled ? 'opacity-50' : ''}`}
                      onClick={() => setSelectedZone(zone)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{config.icone}</span>
                            <h3 className="font-semibold">{zone}</h3>
                          </div>
                          {isEnabled ? (
                            <Badge className={`bg-${config.couleur}-100 text-${config.couleur}-800`}>
                              P{zoneRule?.priority}/5
                            </Badge>
                          ) : (
                            <Badge variant="outline">Désactivée</Badge>
                          )}
                        </div>
                        
                        {stat && (
                          <>
                            <p className="text-xs text-muted-foreground mb-3">{config.focus}</p>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  Prospects
                                </span>
                                <span className="font-medium">{stat.prospects}</span>
                              </div>
                              
                              {stat.hotLeads > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                  <span>🔥 Hot Leads</span>
                                  <Badge className="bg-orange-100 text-orange-800">
                                    {stat.hotLeads}
                                  </Badge>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between text-sm">
                                <span>Potentiel</span>
                                <span className="font-medium text-green-600">
                                  Rs {(stat.potentiel / 1000).toFixed(0)}k
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <span>Score moy.</span>
                                <span className="text-yellow-500">
                                  {'★'.repeat(Math.round(stat.scoreAverage))}
                                  {'☆'.repeat(5 - Math.round(stat.scoreAverage))}
                                </span>
                              </div>
                            </div>
                            
                            {zoneRule && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-muted-foreground">Jours préférés:</p>
                                <p className="text-xs font-medium mt-1">
                                  {zoneRule.preferredDays.join(', ')}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Hôtels */}
        <TabsContent value="hotels" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Hotel className="h-5 w-5" />
                    Hôtels Prioritaires - Scoring IA
                  </CardTitle>
                  <CardDescription>
                    Classement automatique basé sur vos règles
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  <Star className="h-4 w-4 mr-1" />
                  {prospects.filter(p => p.secteur === 'hotel').length} hôtels
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {prospects
                  .filter(p => p.secteur === 'hotel')
                  .sort((a, b) => (b.priorite || 0) - (a.priorite || 0))
                  .slice(0, 10)
                  .map((hotel, idx) => (
                    <Card 
                      key={hotel.id} 
                      className="hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleCreateRdv(hotel)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="font-semibold flex items-center gap-2">
                                  {hotel.nom}
                                  {hotel.isHotLead && (
                                    <Badge className="bg-orange-500 text-xs">🔥 HOT</Badge>
                                  )}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {hotel.ville} • Zone {getProspectZone(hotel.ville)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                Score: {hotel.score}/5
                              </span>
                              <Badge variant="outline">
                                Priorité IA: {hotel.priorite}/100
                              </Badge>
                              <Badge variant={hotel.statut === 'nouveau' ? 'default' : 'secondary'}>
                                {hotel.statut}
                              </Badge>
                              <span className="text-green-600 font-medium">
                                Rs {(aiRules.commercial.averageDealSize / 1000).toFixed(0)}k/mois
                              </span>
                            </div>
                            
                            {hotel.notes && hotel.isHotLead && (
                              <Alert className="mt-2 p-2 bg-orange-50 border-orange-200">
                                <AlertDescription className="text-xs">
                                  {hotel.notes}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {hotel.telephone && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.location.href = `tel:${hotel.telephone}`
                                }}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCreateRdv(hotel)
                              }}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              RDV
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Pharmacies */}
        <TabsContent value="pharmacies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Pharmacies Stratégiques
                  </CardTitle>
                  <CardDescription>
                    Partenaires prioritaires selon l'IA
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  💊 {prospects.filter(p => p.secteur === 'pharmacie').length} pharmacies
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prospects
                  .filter(p => p.secteur === 'pharmacie')
                  .sort((a, b) => (b.priorite || 0) - (a.priorite || 0))
                  .slice(0, 8)
                  .map((pharmacy) => (
                    <Card 
                      key={pharmacy.id} 
                      className="hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleCreateRdv(pharmacy)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold flex items-center gap-2">
                              💊 {pharmacy.nom}
                              {pharmacy.isHotLead && (
                                <Badge className="bg-orange-500 text-xs">HOT</Badge>
                              )}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {pharmacy.ville} • Zone {getProspectZone(pharmacy.ville)}
                            </p>
                            
                            <div className="flex items-center gap-3 mt-3 text-sm">
                              <Badge variant="outline">
                                Score: {pharmacy.score}/5
                              </Badge>
                              <Badge variant="outline">
                                IA: {pharmacy.priorite}/100
                              </Badge>
                            </div>
                            
                            <div className="mt-3 p-2 bg-green-50 rounded text-xs">
                              <p className="font-medium text-green-800">Potentiel:</p>
                              <p className="text-green-700 mt-1">
                                Rs {(aiRules.commercial.averageDealSize * 0.7 / 1000).toFixed(0)}k/mois + commissions
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
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
          // Recharger les données avec les nouvelles règles
          loadProspects()
          setShowRulesConfig(false)
        }}
      />
    </div>
  )
}
