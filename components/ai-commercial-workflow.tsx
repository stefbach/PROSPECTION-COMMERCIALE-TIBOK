// components/ai-commercial-workflow.tsx
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
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import {
  Phone,
  Calendar,
  Hotel,
  Building2,
  Briefcase,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  MapPin,
  Star,
  ArrowRight,
  PhoneCall,
  PhoneOff,
  CalendarCheck,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  Sparkles,
  FileText,
  User,
  Mail,
  MessageSquare,
  Timer,
  DollarSign
} from 'lucide-react'

// Types pour le workflow commercial
interface CallTarget {
  id: number
  nom: string
  secteur: 'hotel' | 'pharmacie' | 'entreprise' | 'clinique' | 'autre'
  telephone?: string
  contact?: string
  email?: string
  score: number
  priorite: number
  statut: string
  ville: string
  district: string
  
  // Nouveaux champs pour le suivi des appels
  callStatus?: 'a_appeler' | 'appele_interesse' | 'appele_rdv' | 'appele_refus' | 'rappeler'
  lastCallDate?: string
  callNotes?: string
  callCount?: number
  bestTimeToCall?: string
  decisionMaker?: string
  budget?: string
  interesse?: boolean
  rdvProgramme?: boolean
  dateRdvPropose?: string
}

interface CallSession {
  date: string
  targets: CallTarget[]
  completed: number
  rdvObtenus: number
  rappelsAProgrammer: number
}

interface FieldVisit {
  prospect: CallTarget
  dateVisite: string
  heureVisite: string
  duree: number
  typeVisite: 'decouverte' | 'presentation' | 'demo' | 'signature'
  preparationNotes?: string
  documentsAPreparer?: string[]
}

// Configuration des priorités sectorielles
const SECTOR_PRIORITY = {
  hotel: {
    priority: 100,
    icon: '🏨',
    label: 'Hôtel',
    targetProfile: '4-5 étoiles, clientèle internationale',
    avgCallDuration: 8,
    conversionRate: 40,
    monthlyValue: 35000,
    bestCallTime: '10h-12h ou 14h-15h',
    keyArguments: [
      'Service médical 24/7 pour touristes',
      'Multilingue (8 langues)',
      'Différenciateur TripAdvisor',
      'ROI rapide'
    ]
  },
  pharmacie: {
    priority: 80,
    icon: '💊',
    label: 'Pharmacie',
    targetProfile: 'Grandes pharmacies, chaînes',
    avgCallDuration: 6,
    conversionRate: 30,
    monthlyValue: 25000,
    bestCallTime: '14h-16h (moins de clients)',
    keyArguments: [
      'Commission Rs 200/consultation',
      'Installation gratuite',
      'Nouveau service moderne',
      'Formation équipe incluse'
    ]
  },
  entreprise: {
    priority: 60,
    icon: '🏢',
    label: 'Entreprise',
    targetProfile: '+50 employés',
    avgCallDuration: 10,
    conversionRate: 25,
    monthlyValue: 20000,
    bestCallTime: '9h-11h ou 14h-16h',
    keyArguments: [
      'Service santé au travail',
      'Réduction absentéisme',
      'Avantage employés',
      'CSR/Bien-être'
    ]
  },
  clinique: {
    priority: 70,
    icon: '🏥',
    label: 'Clinique',
    targetProfile: 'Cliniques privées',
    avgCallDuration: 7,
    conversionRate: 35,
    monthlyValue: 30000,
    bestCallTime: '11h-12h ou 15h-16h',
    keyArguments: [
      'Désengorgement urgences',
      'Extension horaires',
      'Pré-triage intelligent',
      'Rentabilisation espaces'
    ]
  },
  autre: {
    priority: 40,
    icon: '📍',
    label: 'Autre',
    targetProfile: 'À qualifier',
    avgCallDuration: 5,
    conversionRate: 15,
    monthlyValue: 15000,
    bestCallTime: '10h-16h',
    keyArguments: [
      'Service innovant',
      'Modernisation',
      'Accessibilité santé'
    ]
  }
}

// Composant principal du workflow commercial
export function AICommercialWorkflow() {
  const [activePhase, setActivePhase] = React.useState<'calls' | 'visits'>('calls')
  const [prospects, setProspects] = React.useState<CallTarget[]>([])
  const [callTargets, setCallTargets] = React.useState<CallTarget[]>([])
  const [scheduledVisits, setScheduledVisits] = React.useState<FieldVisit[]>([])
  const [currentCallSession, setCurrentCallSession] = React.useState<CallSession | null>(null)
  const [selectedSectors, setSelectedSectors] = React.useState<string[]>(['hotel', 'pharmacie'])
  const [callsPerDay, setCallsPerDay] = React.useState(30)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()

  // Charger les prospects au démarrage
  React.useEffect(() => {
    loadProspects()
  }, [])

  // Charger tous les prospects
  async function loadProspects() {
    setLoading(true)
    try {
      const res = await fetch('/api/prospects?limit=1000')
      const result = await res.json()
      const data = (result.data || result || []).map((p: any) => ({
        ...p,
        priorite: calculatePriority(p),
        callStatus: p.callStatus || 'a_appeler',
        callCount: p.callCount || 0
      }))
      
      setProspects(data)
    } catch (error) {
      console.error('Erreur chargement prospects:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculer la priorité d'un prospect
  function calculatePriority(prospect: any): number {
    const sectorConfig = SECTOR_PRIORITY[prospect.secteur as keyof typeof SECTOR_PRIORITY]
    if (!sectorConfig) return 0
    
    let priority = sectorConfig.priority
    
    // Bonus pour score qualité
    priority += (prospect.score || 3) * 3
    
    // Bonus si jamais appelé
    if (!prospect.callStatus || prospect.callStatus === 'a_appeler') {
      priority += 20
    }
    
    // Bonus pour statut
    if (prospect.statut === 'nouveau') priority += 15
    else if (prospect.statut === 'qualifie') priority += 10
    
    // Pénalité si déjà refusé
    if (prospect.callStatus === 'appele_refus') priority -= 50
    
    return Math.max(0, Math.min(150, priority))
  }

  // PHASE 1 : Générer la liste d'appels optimisée
  function generateCallList() {
    // Filtrer par secteurs sélectionnés et statut
    let targets = prospects.filter(p => 
      selectedSectors.includes(p.secteur) &&
      p.callStatus !== 'appele_refus' &&
      p.callStatus !== 'appele_rdv'
    )
    
    // Trier par priorité (hôtels d'abord, puis pharmacies, puis entreprises)
    targets.sort((a, b) => {
      // D'abord par type de secteur
      const sectorOrder = { hotel: 1, pharmacie: 2, entreprise: 3, clinique: 4, autre: 5 }
      const sectorDiff = (sectorOrder[a.secteur] || 5) - (sectorOrder[b.secteur] || 5)
      if (sectorDiff !== 0) return sectorDiff
      
      // Ensuite par priorité calculée
      return b.priorite - a.priorite
    })
    
    // Limiter au nombre d'appels par jour
    const dailyTargets = targets.slice(0, callsPerDay)
    
    // Grouper par secteur pour affichage
    const grouped = {
      hotels: dailyTargets.filter(t => t.secteur === 'hotel'),
      pharmacies: dailyTargets.filter(t => t.secteur === 'pharmacie'),
      entreprises: dailyTargets.filter(t => t.secteur === 'entreprise'),
      autres: dailyTargets.filter(t => !['hotel', 'pharmacie', 'entreprise'].includes(t.secteur))
    }
    
    setCallTargets(dailyTargets)
    
    // Créer une session d'appels
    setCurrentCallSession({
      date: new Date().toISOString().split('T')[0],
      targets: dailyTargets,
      completed: 0,
      rdvObtenus: 0,
      rappelsAProgrammer: 0
    })
    
    toast({
      title: '✅ Liste d\'appels générée',
      description: `${dailyTargets.length} prospects à appeler : ${grouped.hotels.length} hôtels, ${grouped.pharmacies.length} pharmacies, ${grouped.entreprises.length} entreprises`
    })
  }

  // Marquer un appel comme effectué
  function markCallCompleted(targetId: number, status: 'interesse' | 'rdv' | 'refus' | 'rappeler', notes?: string) {
    setCallTargets(prev => prev.map(t => {
      if (t.id === targetId) {
        const newStatus = status === 'rdv' ? 'appele_rdv' : 
                         status === 'interesse' ? 'appele_interesse' :
                         status === 'refus' ? 'appele_refus' : 'rappeler'
        
        return {
          ...t,
          callStatus: newStatus,
          lastCallDate: new Date().toISOString(),
          callNotes: notes || t.callNotes,
          callCount: (t.callCount || 0) + 1,
          interesse: status === 'interesse' || status === 'rdv',
          rdvProgramme: status === 'rdv'
        }
      }
      return t
    }))
    
    // Mettre à jour la session
    if (currentCallSession) {
      setCurrentCallSession(prev => ({
        ...prev!,
        completed: prev!.completed + 1,
        rdvObtenus: status === 'rdv' ? prev!.rdvObtenus + 1 : prev!.rdvObtenus,
        rappelsAProgrammer: status === 'rappeler' ? prev!.rappelsAProgrammer + 1 : prev!.rappelsAProgrammer
      }))
    }
    
    // Si RDV obtenu, préparer la visite terrain
    if (status === 'rdv') {
      const target = callTargets.find(t => t.id === targetId)
      if (target) {
        prepareFieldVisit(target)
      }
    }
  }

  // PHASE 2 : Préparer une visite terrain suite à un appel réussi
  function prepareFieldVisit(target: CallTarget) {
    // Calculer la date de visite optimale selon le secteur
    const sectorConfig = SECTOR_PRIORITY[target.secteur as keyof typeof SECTOR_PRIORITY]
    const visitDate = getOptimalVisitDate(target)
    
    const newVisit: FieldVisit = {
      prospect: target,
      dateVisite: visitDate,
      heureVisite: target.secteur === 'hotel' ? '10:00' : '14:00',
      duree: target.secteur === 'hotel' ? 60 : 45,
      typeVisite: target.statut === 'nouveau' ? 'decouverte' : 'presentation',
      preparationNotes: `Préparer: brochure ${target.secteur}, QR code démo, contrat type`,
      documentsAPreparer: [
        'Brochure ProspectMed',
        `Cas d'usage ${target.secteur}`,
        'Tablette avec démo',
        'QR Code test',
        'Contrat et CGV'
      ]
    }
    
    setScheduledVisits(prev => [...prev, newVisit])
    
    toast({
      title: '📅 Visite terrain programmée',
      description: `RDV avec ${target.nom} le ${visitDate}`
    })
  }

  // Calculer la date optimale de visite selon le secteur et la zone
  function getOptimalVisitDate(target: CallTarget): string {
    const today = new Date()
    let daysToAdd = 2 // Par défaut, dans 2 jours
    
    // Ajuster selon le secteur
    if (target.secteur === 'hotel') {
      // Hôtels : mardi ou jeudi de préférence
      const dayOfWeek = today.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 1) daysToAdd = 2 // Mardi
      else if (dayOfWeek === 2 || dayOfWeek === 3) daysToAdd = 2 // Jeudi
      else daysToAdd = 4 // Mardi suivant
    } else if (target.secteur === 'pharmacie') {
      // Pharmacies : mercredi ou vendredi après-midi
      daysToAdd = 3
    }
    
    const visitDate = new Date(today)
    visitDate.setDate(today.getDate() + daysToAdd)
    
    return visitDate.toISOString().split('T')[0]
  }

  // Exporter la liste d'appels
  function exportCallList() {
    const csv = [
      'Nom,Secteur,Téléphone,Contact,Ville,Score,Priorité,Statut,Notes',
      ...callTargets.map(t => 
        `"${t.nom}","${t.secteur}","${t.telephone || ''}","${t.contact || ''}","${t.ville}",${t.score},${t.priorite},"${t.statut}","${t.callNotes || ''}"`
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `liste_appels_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Statistiques de performance
  const stats = React.useMemo(() => {
    const hotelTargets = callTargets.filter(t => t.secteur === 'hotel')
    const pharmacyTargets = callTargets.filter(t => t.secteur === 'pharmacie')
    const completedCalls = callTargets.filter(t => t.callStatus?.startsWith('appele'))
    const rdvObtenus = callTargets.filter(t => t.callStatus === 'appele_rdv')
    
    return {
      totalTargets: callTargets.length,
      hotelCount: hotelTargets.length,
      pharmacyCount: pharmacyTargets.length,
      completedCalls: completedCalls.length,
      rdvCount: rdvObtenus.length,
      conversionRate: completedCalls.length > 0 ? 
        Math.round((rdvObtenus.length / completedCalls.length) * 100) : 0,
      potentialRevenue: rdvObtenus.reduce((sum, t) => {
        const config = SECTOR_PRIORITY[t.secteur as keyof typeof SECTOR_PRIORITY]
        return sum + (config?.monthlyValue || 15000)
      }, 0),
      estimatedCallTime: callTargets.reduce((sum, t) => {
        const config = SECTOR_PRIORITY[t.secteur as keyof typeof SECTOR_PRIORITY]
        return sum + (config?.avgCallDuration || 5)
      }, 0)
    }
  }, [callTargets])

  return (
    <div className="space-y-6">
      {/* Header avec workflow */}
      <Card className="border-gradient bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <Phone className="h-6 w-6" />
            Workflow Commercial Intelligent - Téléconsultation Médicale
          </CardTitle>
          <CardDescription>
            Phase 1: Organisation des appels → Phase 2: Planification RDV terrain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 p-3 rounded-lg ${activePhase === 'calls' ? 'bg-white shadow-md' : 'bg-gray-50'}`}>
              <PhoneCall className="h-5 w-5 text-blue-600" />
              <span className="font-medium">1. Appels Qualification</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className={`flex items-center gap-2 p-3 rounded-lg ${activePhase === 'visits' ? 'bg-white shadow-md' : 'bg-gray-50'}`}>
              <Calendar className="h-5 w-5 text-green-600" />
              <span className="font-medium">2. Visites Terrain</span>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <span className="font-medium">3. Signature</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Hotel className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <p className="text-2xl font-bold">{stats.hotelCount}</p>
              <p className="text-xs text-muted-foreground">Hôtels</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Building2 className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <p className="text-2xl font-bold">{stats.pharmacyCount}</p>
              <p className="text-xs text-muted-foreground">Pharmacies</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Phone className="h-6 w-6 mx-auto mb-1 text-orange-600" />
              <p className="text-2xl font-bold">{stats.totalTargets}</p>
              <p className="text-xs text-muted-foreground">À appeler</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Timer className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <p className="text-xl font-bold">{Math.round(stats.estimatedCallTime / 60)}h</p>
              <p className="text-xs text-muted-foreground">Temps appels</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <p className="text-2xl font-bold">{stats.completedCalls}</p>
              <p className="text-xs text-muted-foreground">Appelés</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <CalendarCheck className="h-6 w-6 mx-auto mb-1 text-indigo-600" />
              <p className="text-2xl font-bold">{stats.rdvCount}</p>
              <p className="text-xs text-muted-foreground">RDV obtenus</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-1 text-red-600" />
              <p className="text-2xl font-bold">{stats.conversionRate}%</p>
              <p className="text-xs text-muted-foreground">Conversion</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <div className="text-center">
              <DollarSign className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <p className="text-lg font-bold">Rs {(stats.potentialRevenue / 1000).toFixed(0)}k</p>
              <p className="text-xs text-muted-foreground">Potentiel</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs value={activePhase} onValueChange={(v) => setActivePhase(v as 'calls' | 'visits')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calls" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Phase 1 : Organisation Appels
          </TabsTrigger>
          <TabsTrigger value="visits" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Phase 2 : Visites Terrain
          </TabsTrigger>
        </TabsList>

        {/* PHASE 1 : Organisation des appels */}
        <TabsContent value="calls" className="space-y-4">
          {/* Contrôles de génération */}
          <Card>
            <CardHeader>
              <CardTitle>Générer Liste d'Appels Optimisée</CardTitle>
              <CardDescription>
                Le système priorise automatiquement : Hôtels → Pharmacies → Entreprises
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Secteurs à cibler</label>
                  <div className="flex gap-3">
                    {Object.entries(SECTOR_PRIORITY).map(([key, config]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedSectors.includes(key)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSectors([...selectedSectors, key])
                            } else {
                              setSelectedSectors(selectedSectors.filter(s => s !== key))
                            }
                          }}
                        />
                        <span className="text-sm">
                          {config.icon} {config.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre d'appels/jour</label>
                  <Input
                    type="number"
                    value={callsPerDay}
                    onChange={(e) => setCallsPerDay(parseInt(e.target.value) || 30)}
                    className="w-24"
                  />
                </div>
                
                <div className="flex items-end gap-2">
                  <Button
                    onClick={generateCallList}
                    disabled={loading || selectedSectors.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer Liste
                  </Button>
                  
                  {callTargets.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={exportCallList}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exporter CSV
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Conseils par secteur */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Stratégie optimale :</strong> Appelez les hôtels le matin (10h-12h), 
                  les pharmacies l'après-midi (14h-16h), et les entreprises en milieu de matinée ou après-midi.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Liste des appels à faire */}
          {callTargets.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Liste d'Appels du Jour</CardTitle>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Progression : {stats.completedCalls}/{stats.totalTargets}</span>
                    <Progress value={(stats.completedCalls / stats.totalTargets) * 100} className="w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Hôtels en priorité */}
                  {callTargets.filter(t => t.secteur === 'hotel').length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Hotel className="h-5 w-5 text-blue-600" />
                        Hôtels - Priorité MAXIMALE
                      </h3>
                      <div className="space-y-2">
                        {callTargets.filter(t => t.secteur === 'hotel').map(target => (
                          <CallCard
                            key={target.id}
                            target={target}
                            onCallComplete={(status, notes) => markCallCompleted(target.id, status, notes)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Pharmacies ensuite */}
                  {callTargets.filter(t => t.secteur === 'pharmacie').length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-green-600" />
                        Pharmacies - Priorité HAUTE
                      </h3>
                      <div className="space-y-2">
                        {callTargets.filter(t => t.secteur === 'pharmacie').map(target => (
                          <CallCard
                            key={target.id}
                            target={target}
                            onCallComplete={(status, notes) => markCallCompleted(target.id, status, notes)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Entreprises après */}
                  {callTargets.filter(t => t.secteur === 'entreprise').length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-purple-600" />
                        Entreprises - Opportunités
                      </h3>
                      <div className="space-y-2">
                        {callTargets.filter(t => t.secteur === 'entreprise').map(target => (
                          <CallCard
                            key={target.id}
                            target={target}
                            onCallComplete={(status, notes) => markCallCompleted(target.id, status, notes)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PHASE 2 : Visites terrain */}
        <TabsContent value="visits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visites Terrain Programmées</CardTitle>
              <CardDescription>
                RDV obtenus suite aux appels téléphoniques réussis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledVisits.length > 0 ? (
                <div className="space-y-3">
                  {scheduledVisits.map((visit, idx) => (
                    <VisitCard key={idx} visit={visit} />
                  ))}
                </div>
              ) : (
                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    Aucune visite programmée. Les visites apparaîtront ici après obtention de RDV lors des appels.
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

// Composant pour une carte d'appel
function CallCard({ 
  target, 
  onCallComplete 
}: { 
  target: CallTarget
  onCallComplete: (status: 'interesse' | 'rdv' | 'refus' | 'rappeler', notes?: string) => void 
}) {
  const [showScript, setShowScript] = React.useState(false)
  const [notes, setNotes] = React.useState('')
  const [completed, setCompleted] = React.useState(target.callStatus?.startsWith('appele') || false)
  const sectorConfig = SECTOR_PRIORITY[target.secteur as keyof typeof SECTOR_PRIORITY]
  
  return (
    <Card className={`transition-all ${completed ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{sectorConfig?.icon}</span>
              <div>
                <h4 className="font-semibold">{target.nom}</h4>
                <p className="text-sm text-muted-foreground">
                  {target.ville} • {target.contact || 'Contact à identifier'}
                </p>
              </div>
              <Badge className="ml-auto">
                Priorité {target.priorite}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {target.telephone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {target.telephone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                Score: {target.score}/5
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ~{sectorConfig?.avgCallDuration} min
              </span>
            </div>
            
            {/* Script d'appel */}
            {showScript && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium mb-2">Script d'approche :</h5>
                <p className="text-sm mb-2">
                  "Bonjour {target.contact || 'Monsieur/Madame'}, je suis [Votre nom] de ProspectMed. 
                  {target.secteur === 'hotel' ? 
                    " Nous aidons les hôtels comme le vôtre à offrir un service médical 24/7 à leurs clients internationaux via QR code." :
                    " Nous proposons aux pharmacies un service de téléconsultation qui génère des revenus complémentaires."
                  }
                  Auriez-vous 5 minutes pour en discuter ?"
                </p>
                <div className="mt-2">
                  <h6 className="font-medium text-xs mb-1">Arguments clés :</h6>
                  <ul className="text-xs space-y-1">
                    {sectorConfig?.keyArguments.map((arg, i) => (
                      <li key={i}>• {arg}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Zone de notes */}
            <div className="mt-3">
              <Textarea
                placeholder="Notes de l'appel..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowScript(!showScript)}
            disabled={completed}
          >
            <FileText className="h-4 w-4 mr-1" />
            {showScript ? 'Masquer' : 'Voir'} Script
          </Button>
          
          {target.telephone && (
            <Button
              size="sm"
              variant="outline"
              className="text-blue-600"
              onClick={() => window.location.href = `tel:${target.telephone}`}
              disabled={completed}
            >
              <Phone className="h-4 w-4 mr-1" />
              Appeler
            </Button>
          )}
          
          <div className="flex gap-1 ml-auto">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                onCallComplete('rdv', notes)
                setCompleted(true)
              }}
              disabled={completed}
            >
              <CalendarCheck className="h-4 w-4 mr-1" />
              RDV obtenu
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="text-orange-600"
              onClick={() => {
                onCallComplete('interesse', notes)
                setCompleted(true)
              }}
              disabled={completed}
            >
              Intéressé
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="text-blue-600"
              onClick={() => {
                onCallComplete('rappeler', notes)
                setCompleted(true)
              }}
              disabled={completed}
            >
              Rappeler
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="text-red-600"
              onClick={() => {
                onCallComplete('refus', notes)
                setCompleted(true)
              }}
              disabled={completed}
            >
              Refus
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Composant pour une carte de visite terrain
function VisitCard({ visit }: { visit: FieldVisit }) {
  const sectorConfig = SECTOR_PRIORITY[visit.prospect.secteur as keyof typeof SECTOR_PRIORITY]
  
  return (
    <Card className="border-l-4 border-l-green-500">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{sectorConfig?.icon}</span>
              <div>
                <h4 className="font-semibold">{visit.prospect.nom}</h4>
                <p className="text-sm text-muted-foreground">
                  {visit.prospect.ville} • {visit.prospect.contact}
                </p>
              </div>
              <Badge className="ml-auto bg-green-100 text-green-800">
                RDV Confirmé
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(visit.dateVisite).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Heure</p>
                <p className="font-medium">{visit.heureVisite}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Durée</p>
                <p className="font-medium">{visit.duree} min</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{visit.typeVisite}</p>
              </div>
            </div>
            
            {visit.preparationNotes && (
              <div className="mt-3 p-2 bg-yellow-50 rounded">
                <p className="text-xs font-medium text-yellow-800 mb-1">À préparer :</p>
                <p className="text-xs text-yellow-700">{visit.preparationNotes}</p>
              </div>
            )}
            
            {visit.documentsAPreparer && (
              <div className="mt-2">
                <p className="text-xs font-medium mb-1">Documents :</p>
                <div className="flex flex-wrap gap-1">
                  {visit.documentsAPreparer.map((doc, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {doc}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
