// components/ai-dashboard-enhanced.tsx
'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  Brain,
  Calendar,
  MapPin,
  TrendingUp,
  Target,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Phone,
  Mail,
  User,
  BarChart3,
  Navigation,
  Zap,
  Send,
  Hotel,
  Building2,
  Map,
  RefreshCw,
  FileText,
  Download,
  Star,
  Activity
} from 'lucide-react'

// Types
interface ZonePlanning {
  zone: string
  jour: string
  prospects: Array<{
    id: number
    nom: string
    secteur: string
    ville: string
    score: number
    priorite: number
    telephone?: string
    statut?: string
  }>
  potentielRevenu: number
  distanceEstimee: number
  tempsEstime: number
}

interface WeeklyPlanning {
  [key: string]: {
    zone: string
    focus: string
    prospects: any[]
  }
}

interface AIMetrics {
  scoreGlobal: number
  opportunitesIdentifiees: number
  tauxConversionPrevu: number
  revenuPotentielMensuel: number
  zonesOptimales: string[]
  prochaineActionPrioritaire: string
}

export function AIDashboardEnhanced({ commercial }: { commercial: string }) {
  const [loading, setLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('planning')
  const [weeklyPlanning, setWeeklyPlanning] = React.useState<WeeklyPlanning | null>(null)
  const [selectedZone, setSelectedZone] = React.useState<string>('Nord')
  const [aiMetrics, setAiMetrics] = React.useState<AIMetrics | null>(null)
  const [prospects, setProspects] = React.useState<any[]>([])
  const [generatingPlan, setGeneratingPlan] = React.useState(false)
  const { toast } = useToast()

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
    calculateAIMetrics()
  }, [])

  // Charger les prospects
  async function loadProspects() {
    try {
      const res = await fetch('/api/prospects?limit=500')
      const result = await res.json()
      const data = result.data || result || []
      
      // Enrichir avec scoring priorité
      const enrichedProspects = data.map((p: any) => ({
        ...p,
        priorite: calculatePriority(p)
      }))
      
      setProspects(enrichedProspects)
      return enrichedProspects
    } catch (error) {
      console.error('Erreur chargement prospects:', error)
      return []
    }
  }

  // Calculer le score de priorité
  function calculatePriority(prospect: any): number {
    let score = 50
    
    // Bonus secteur (hôtels et pharmacies prioritaires)
    if (prospect.secteur === 'hotel') score += 35
    else if (prospect.secteur === 'pharmacie') score += 30
    else if (prospect.secteur === 'clinique') score += 20
    else if (prospect.secteur === 'entreprise') score += 15
    
    // Bonus score qualité
    score += (prospect.score || 3) * 5
    
    // Bonus statut
    if (prospect.statut === 'qualifie') score += 10
    else if (prospect.statut === 'proposition') score += 15
    else if (prospect.statut === 'negociation') score += 20
    
    return Math.min(100, score)
  }

  // Calculer les métriques IA globales
  async function calculateAIMetrics() {
    try {
      const prospectsData = prospects.length > 0 ? prospects : await loadProspects()
      
      const hotels = prospectsData.filter((p: any) => p.secteur === 'hotel')
      const pharmacies = prospectsData.filter((p: any) => p.secteur === 'pharmacie')
      
      const metrics: AIMetrics = {
        scoreGlobal: Math.round((hotels.length * 2 + pharmacies.length * 1.5 + prospectsData.length) / 10),
        opportunitesIdentifiees: hotels.length + pharmacies.length,
        tauxConversionPrevu: hotels.length > 0 ? 35 : 25,
        revenuPotentielMensuel: (hotels.length * 35000 + pharmacies.length * 25000 + (prospectsData.length - hotels.length - pharmacies.length) * 15000),
        zonesOptimales: ['Nord', 'Centre', 'Ouest'],
        prochaineActionPrioritaire: hotels.length > 0 ? 
          `Contacter ${hotels[0]?.nom || 'hôtel prioritaire'} - Fort potentiel` :
          'Prospecter nouveaux hôtels Grand Baie'
      }
      
      setAiMetrics(metrics)
    } catch (error) {
      console.error('Erreur calcul métriques:', error)
    }
  }

  // Générer le planning hebdomadaire automatique
  async function generateWeeklyPlanning() {
    setGeneratingPlan(true)
    try {
      // Simuler l'appel API (en production, utiliser le service AIService)
      const planning = await generatePlanningFromProspects(prospects)
      setWeeklyPlanning(planning)
      
      toast({
        title: '✅ Planning généré avec succès',
        description: `${Object.values(planning).reduce((sum, day) => sum + day.prospects.length, 0)} visites planifiées sur la semaine`
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

  // Logique de génération du planning
  async function generatePlanningFromProspects(allProspects: any[]): Promise<WeeklyPlanning> {
    // Grouper par zones
    const zoneGroups: Record<string, any[]> = {}
    
    allProspects.forEach(prospect => {
      const zone = getProspectZone(prospect.district || prospect.ville)
      if (!zoneGroups[zone]) zoneGroups[zone] = []
      zoneGroups[zone].push(prospect)
    })
    
    // Créer le planning optimisé
    const planning: WeeklyPlanning = {
      'Lundi': {
        zone: 'Centre',
        focus: 'Pharmacies et entreprises Port Louis',
        prospects: (zoneGroups['Centre'] || [])
          .filter(p => ['pharmacie', 'entreprise'].includes(p.secteur))
          .sort((a, b) => b.priorite - a.priorite)
          .slice(0, 8)
      },
      'Mardi': {
        zone: 'Nord',
        focus: 'Hôtels Grand Baie et Pereybère',
        prospects: (zoneGroups['Nord'] || [])
          .filter(p => p.secteur === 'hotel')
          .sort((a, b) => b.priorite - a.priorite)
          .slice(0, 6)
      },
      'Mercredi': {
        zone: 'Centre',
        focus: 'Cliniques et pharmacies Quatre Bornes',
        prospects: (zoneGroups['Centre'] || [])
          .filter(p => ['clinique', 'pharmacie'].includes(p.secteur))
          .sort((a, b) => b.priorite - a.priorite)
          .slice(0, 7)
      },
      'Jeudi': {
        zone: 'Ouest',
        focus: 'Hôtels Flic en Flac et Tamarin',
        prospects: (zoneGroups['Ouest'] || [])
          .filter(p => p.secteur === 'hotel')
          .sort((a, b) => b.priorite - a.priorite)
          .slice(0, 5)
      },
      'Vendredi': {
        zone: 'Sud',
        focus: 'Zone aéroport et hôtels Blue Bay',
        prospects: (zoneGroups['Sud'] || [])
          .sort((a, b) => b.priorite - a.priorite)
          .slice(0, 5)
      }
    }
    
    return planning
  }

  // Déterminer la zone d'un prospect
  function getProspectZone(location: string): string {
    if (!location) return 'Centre'
    
    for (const [zone, config] of Object.entries(ZONES_MAURICE)) {
      if (config.villes.some(ville => location.toLowerCase().includes(ville.toLowerCase()))) {
        return zone
      }
    }
    
    return 'Centre'
  }

  // Créer des RDV automatiquement pour une journée
  async function createAutomaticAppointments(jour: string, prospects: any[]) {
    setLoading(true)
    let successCount = 0
    
    try {
      // Calculer les créneaux horaires
      const startHour = 9
      const appointmentDuration = 45 // minutes
      const travelTime = 30 // minutes entre RDV
      
      for (let i = 0; i < prospects.length; i++) {
        const prospect = prospects[i]
        const totalMinutes = startHour * 60 + i * (appointmentDuration + travelTime)
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        
        if (hours >= 17) break // Arrêter après 17h
        
        const appointmentData = {
          prospect_id: prospect.id,
          date: getNextDateForDay(jour),
          time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
          duree_min: appointmentDuration,
          type_visite: prospect.statut === 'nouveau' ? 'decouverte' : 'presentation',
          priorite: prospect.priorite >= 80 ? 'haute' : 'normale',
          notes: `Visite automatique - ${prospect.secteur === 'hotel' ? 'Présentation service hôtelier' : 'Démonstration téléconsultation'}`,
          commercial: commercial
        }
        
        const res = await fetch('/api/rdv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appointmentData)
        })
        
        if (res.ok) {
          successCount++
        }
      }
      
      toast({
        title: '✅ RDV créés',
        description: `${successCount} rendez-vous planifiés pour ${jour}`
      })
      
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Problème lors de la création des RDV',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Obtenir la prochaine date pour un jour donné
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

  return (
    <div className="space-y-6">
      {/* Header avec métriques IA */}
      <Card className="border-gradient bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">ProspectMed IA - Téléconsultation Médicale</CardTitle>
                <CardDescription>
                  Optimisation intelligente pour installations QR Code chez partenaires
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              GPT-4 Turbo
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Métriques principales */}
      {aiMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Score Global IA</p>
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
              <p className="text-xs text-muted-foreground mt-2">Hôtels + Pharmacies</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taux Conversion</p>
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
                  <p className="text-sm text-muted-foreground">Potentiel/mois</p>
                  <p className="text-xl font-bold">Rs {(aiMetrics.revenuPotentielMensuel / 1000).toFixed(0)}k</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <p className="text-sm font-medium">Action Prioritaire</p>
              </div>
              <p className="text-sm font-bold text-indigo-700">
                {aiMetrics.prochaineActionPrioritaire}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="planning" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Planning Auto
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Zones & Secteurs
          </TabsTrigger>
          <TabsTrigger value="hotels" className="flex items-center gap-2">
            <Hotel className="h-4 w-4" />
            Hôtels Prioritaires
          </TabsTrigger>
          <TabsTrigger value="pharmacies" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Pharmacies
          </TabsTrigger>
        </TabsList>

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
                    Génération automatique basée sur les zones et priorités
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
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Générer Planning
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {weeklyPlanning ? (
                <div className="space-y-4">
                  {Object.entries(weeklyPlanning).map(([jour, data]) => {
                    const zoneConfig = ZONES_MAURICE[data.zone]
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
                              </div>
                              
                              <div className="space-y-2 mt-3">
                                {data.prospects.length > 0 ? (
                                  <>
                                    <p className="text-sm font-medium text-muted-foreground">
                                      {data.prospects.length} visites planifiées
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {data.prospects.slice(0, 4).map((prospect, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                                          <Badge variant="outline" className="text-xs">
                                            {prospect.secteur === 'hotel' ? '🏨' : 
                                             prospect.secteur === 'pharmacie' ? '💊' :
                                             prospect.secteur === 'clinique' ? '🏥' : '🏢'}
                                          </Badge>
                                          <span className="flex-1 truncate">{prospect.nom}</span>
                                          <Badge className={prospect.priorite >= 80 ? 'bg-red-500' : 'bg-blue-500'}>
                                            P{prospect.priorite}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                    {data.prospects.length > 4 && (
                                      <p className="text-xs text-muted-foreground">
                                        +{data.prospects.length - 4} autres prospects
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                      Aucun prospect disponible pour cette zone
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              {data.prospects.length > 0 && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => createAutomaticAppointments(jour, data.prospects)}
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Créer RDV
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Détails
                                  </Button>
                                </>
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
                    Cliquez sur "Générer Planning" pour créer automatiquement votre planning hebdomadaire optimisé
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Recommandations IA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Recommandations IA pour la Prospection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Prioriser Grand Baie et Pereybère</p>
                    <p className="text-sm text-muted-foreground">
                      Concentration maximale d'hôtels 4-5 étoiles avec clientèle internationale
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Visiter pharmacies après 14h</p>
                    <p className="text-sm text-muted-foreground">
                      Moins d'affluence, pharmaciens plus disponibles pour démonstration
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Argument clé hôtels : Touristes sans médecin local</p>
                    <p className="text-sm text-muted-foreground">
                      Service 24/7 multilingue, évite complications et mauvais avis TripAdvisor
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Package démo : QR Code test + 1 mois gratuit</p>
                    <p className="text-sm text-muted-foreground">
                      Proposition sans risque pour faciliter la signature
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Zones & Secteurs */}
        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des Zones Géographiques</CardTitle>
              <CardDescription>
                Répartition optimale par zones pour maximiser les opportunités
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(ZONES_MAURICE).map(([zone, config]) => {
                  const zoneProspects = prospects.filter(p => 
                    config.villes.some(v => p.ville?.toLowerCase().includes(v.toLowerCase()))
                  )
                  const hotels = zoneProspects.filter(p => p.secteur === 'hotel').length
                  const pharmacies = zoneProspects.filter(p => p.secteur === 'pharmacie').length
                  
                  return (
                    <Card key={zone} className="cursor-pointer hover:shadow-lg transition-all"
                          onClick={() => setSelectedZone(zone)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{config.icone}</span>
                            <h3 className="font-semibold">{zone}</h3>
                          </div>
                          <Badge className={`bg-${config.couleur}-100 text-${config.couleur}-800`}>
                            {zoneProspects.length} prospects
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-3">{config.focus}</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Hotel className="h-3 w-3" />
                              Hôtels
                            </span>
                            <span className="font-medium">{hotels}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              Pharmacies
                            </span>
                            <span className="font-medium">{pharmacies}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Potentiel</span>
                            <span className="font-medium text-green-600">
                              Rs {((hotels * 35 + pharmacies * 25) / 1000).toFixed(0)}k/mois
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground">Villes principales:</p>
                          <p className="text-xs font-medium mt-1">{config.villes.slice(0, 3).join(', ')}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Hôtels Prioritaires */}
        <TabsContent value="hotels" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Hotel className="h-5 w-5" />
                    Hôtels Prioritaires - Cibles Premium
                  </CardTitle>
                  <CardDescription>
                    Focus sur hôtels 4-5 étoiles avec clientèle internationale
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
                  .sort((a, b) => b.priorite - a.priorite)
                  .slice(0, 10)
                  .map((hotel, idx) => (
                    <Card key={hotel.id} className="hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="font-semibold">{hotel.nom}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {hotel.ville} • {getProspectZone(hotel.ville)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                Score: {hotel.score}/5
                              </span>
                              <Badge variant={hotel.statut === 'nouveau' ? 'default' : 'secondary'}>
                                {hotel.statut}
                              </Badge>
                              <span className="text-green-600 font-medium">
                                Rs 35k/mois
                              </span>
                            </div>
                            
                            {hotel.notes && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                                {hotel.notes}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                              <Calendar className="h-4 w-4 mr-1" />
                              RDV
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              
              {prospects.filter(p => p.secteur === 'hotel').length === 0 && (
                <Alert>
                  <Hotel className="h-4 w-4" />
                  <AlertDescription>
                    Aucun hôtel dans la base. Commencez par ajouter des hôtels 4-5 étoiles de Grand Baie et Flic en Flac.
                  </AlertDescription>
                </Alert>
              )}
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
                    Partenaires pour service de téléconsultation avec commission
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
                  .sort((a, b) => b.priorite - a.priorite)
                  .slice(0, 8)
                  .map((pharmacy) => (
                    <Card key={pharmacy.id} className="hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold flex items-center gap-2">
                              💊 {pharmacy.nom}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {pharmacy.ville} • Zone {getProspectZone(pharmacy.ville)}
                            </p>
                            
                            <div className="flex items-center gap-3 mt-3 text-sm">
                              <Badge variant="outline">
                                Score: {pharmacy.score}/5
                              </Badge>
                              <span className="text-green-600 font-medium">
                                Rs 25k/mois + commissions
                              </span>
                            </div>
                            
                            <div className="mt-3 p-2 bg-green-50 rounded text-xs">
                              <p className="font-medium text-green-800">Avantages clés:</p>
                              <ul className="mt-1 space-y-0.5 text-green-700">
                                <li>• Revenus additionnels garantis</li>
                                <li>• Service moderne différenciant</li>
                                <li>• Formation équipe incluse</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              
              {prospects.filter(p => p.secteur === 'pharmacie').length === 0 && (
                <Alert>
                  <Building2 className="h-4 w-4" />
                  <AlertDescription>
                    Aucune pharmacie dans la base. Ajoutez les grandes pharmacies de Port Louis et Quatre Bornes en priorité.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
