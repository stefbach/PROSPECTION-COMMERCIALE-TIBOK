'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Target,
  TrendingUp,
  Navigation,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  Edit,
  Car,
  Users,
  BarChart3,
  Activity,
  FileText,
  Star,
  Briefcase,
  DollarSign,
  Timer,
  Route
} from 'lucide-react'
import { PlanningEvent, Note, Commercial, generateDailyPlanning, calculateDistance, calculateIndemnites } from '@/lib/commercial-system'
import { MAURITIUS_CONFIG, Prospect } from '@/lib/mauritius-config'
import { useToast } from '@/hooks/use-toast'

// Commercial connecté (mock)
const currentCommercial: Commercial = {
  id: '1',
  userId: 'user1',
  nom: 'Martin',
  prenom: 'Jean',
  email: 'jean.martin@crm.mu',
  telephone: '+230 5123 4567',
  adresse: {
    rue: '10 Rue La Bourdonnais',
    ville: 'Port Louis',
    district: 'port-louis',
    codePostal: '11328'
  },
  dateEmbauche: new Date('2023-01-15'),
  statut: 'actif',
  vehicule: {
    type: 'personnel',
    marque: 'Toyota',
    modele: 'Yaris',
    immatriculation: 'AA 1234',
    tauxKm: 25
  },
  zones: ['port-louis', 'plaines-wilhems', 'moka'],
  secteurs: ['hotel', 'restaurant', 'retail'],
  objectifs: {
    mensuel: { ca: 500000, nouveauxClients: 10, rdv: 40 },
    annuel: { ca: 6000000, nouveauxClients: 120 }
  },
  stats: {
    periode: 'mois',
    caGenere: 425000,
    caEnCours: 180000,
    nombreProspects: 45,
    nombreClients: 8,
    tauxConversion: 17.8,
    rdvEffectues: 32,
    rdvPlanifies: 8,
    appelsEffectues: 156,
    emailsEnvoyes: 89,
    kmParcourus: 1250,
    indemnitesKm: 31250,
    tempsRoute: 1875,
    scorePerformance: 78,
    ranking: 2
  }
}

// Prospects mock
const mockProspects: Prospect[] = [
  {
    id: 1,
    nom: "Hotel Le Meridien",
    secteur: "hotel",
    ville: "Port Louis",
    district: "port-louis",
    statut: "en-negociation",
    contact: "M. Kumar",
    telephone: "+230 5234 5678",
    email: "contact@meridien.mu",
    score: 5,
    budget: "Rs 200k",
    notes: "Très intéressé par notre solution",
    adresse: "Caudan Waterfront"
  },
  {
    id: 2,
    nom: "Restaurant Le Capitaine",
    secteur: "restaurant",
    ville: "Curepipe",
    district: "plaines-wilhems",
    statut: "qualifie",
    contact: "Mme Leclerc",
    telephone: "+230 5345 6789",
    email: "info@lecapitaine.mu",
    score: 4,
    budget: "Rs 80k",
    notes: "RDV prévu cette semaine",
    adresse: "Royal Road, Curepipe"
  },
  {
    id: 3,
    nom: "Winners Supermarket",
    secteur: "retail",
    ville: "Phoenix",
    district: "plaines-wilhems",
    statut: "nouveau",
    contact: "M. Patel",
    telephone: "+230 5456 7890",
    email: "manager@winners.mu",
    score: 3,
    budget: "À définir",
    notes: "Premier contact à établir",
    adresse: "Phoenix Mall"
  }
]

export default function CommercialDashboard() {
  const [prospects, setProspects] = React.useState<Prospect[]>(mockProspects)
  const [selectedProspect, setSelectedProspect] = React.useState<Prospect | null>(null)
  const [planning, setPlanning] = React.useState<PlanningEvent[]>([])
  const [showNoteDialog, setShowNoteDialog] = React.useState(false)
  const [currentEvent, setCurrentEvent] = React.useState<PlanningEvent | null>(null)
  const { toast } = useToast()

  // Générer le planning du jour
  React.useEffect(() => {
    const dailyPlanning = generateDailyPlanning(currentCommercial, prospects, new Date())
    setPlanning(dailyPlanning.events)
  }, [prospects])

  // Calculer les stats du jour
  const statsJour = React.useMemo(() => {
    const rdvCount = planning.filter(e => e.type === 'rdv').length
    const totalKm = planning
      .filter(e => e.type === 'trajet')
      .reduce((sum, e) => sum + (e.trajet?.distance || 0), 0)
    const totalTime = planning.reduce((sum, e) => sum + e.duree, 0)
    
    return {
      rdv: rdvCount,
      km: totalKm,
      temps: totalTime,
      indemnites: calculateIndemnites(totalKm)
    }
  }, [planning])

  const updateProspectStatus = (prospectId: number, newStatus: Prospect['statut']) => {
    setProspects(prev => prev.map(p => 
      p.id === prospectId ? { ...p, statut: newStatus } : p
    ))
    toast({
      title: "Statut mis à jour",
      description: `Le prospect a été marqué comme ${MAURITIUS_CONFIG.statuts[newStatus].label}`
    })
  }

  const addNote = (prospectId: number, note: string, type: Note['type']) => {
    // Ici, faire l'appel API pour sauvegarder la note
    toast({
      title: "Note ajoutée",
      description: "Votre commentaire a été enregistré"
    })
    setShowNoteDialog(false)
  }

  const completeEvent = (eventId: string, result: 'succes' | 'echec' | 'a-recontacter') => {
    setPlanning(prev => prev.map(e => 
      e.id === eventId ? { ...e, statut: 'termine', resultat: result } : e
    ))
    toast({
      title: "Activité terminée",
      description: "Le statut a été mis à jour"
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header avec stats personnelles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Bonjour {currentCommercial.prenom} 👋
          </h1>
          <p className="text-muted-foreground mt-2">
            Voici votre planning optimisé pour aujourd'hui
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            <Trophy className="mr-2 h-4 w-4" />
            Rang #{currentCommercial.stats?.ranking}
          </Badge>
          <Badge variant="default" className="px-3 py-1">
            Score: {currentCommercial.stats?.scorePerformance}/100
          </Badge>
        </div>
      </div>

      {/* KPIs personnels */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CA ce mois</p>
                <p className="text-2xl font-bold">
                  Rs {((currentCommercial.stats?.caGenere || 0) / 1000).toFixed(0)}k
                </p>
                <Progress 
                  value={(currentCommercial.stats?.caGenere || 0) / currentCommercial.objectifs.mensuel.ca * 100} 
                  className="mt-2 h-1"
                />
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nouveaux clients</p>
                <p className="text-2xl font-bold">
                  {currentCommercial.stats?.nombreClients}/{currentCommercial.objectifs.mensuel.nouveauxClients}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentCommercial.stats?.tauxConversion?.toFixed(0)}% conversion
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">RDV aujourd'hui</p>
                <p className="text-2xl font-bold">{statsJour.rdv}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(statsJour.temps / 60)}h de travail
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Km prévus</p>
                <p className="text-2xl font-bold">{statsJour.km}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rs {statsJour.indemnites}
                </p>
              </div>
              <Car className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prospects actifs</p>
                <p className="text-2xl font-bold">{prospects.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {prospects.filter(p => p.statut === 'en-negociation').length} en négo
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="planning" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="planning">
            <Calendar className="mr-2 h-4 w-4" />
            Planning du jour
          </TabsTrigger>
          <TabsTrigger value="prospects">
            <Users className="mr-2 h-4 w-4" />
            Mes Prospects
          </TabsTrigger>
          <TabsTrigger value="activite">
            <Activity className="mr-2 h-4 w-4" />
            Mon Activité
          </TabsTrigger>
          <TabsTrigger value="objectifs">
            <Target className="mr-2 h-4 w-4" />
            Mes Objectifs
          </TabsTrigger>
        </TabsList>

        {/* Tab: Planning du jour */}
        <TabsContent value="planning" className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Activity className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Optimisation IA:</strong> Votre circuit a été optimisé pour économiser 
              15% de km et 45 minutes sur votre journée. 
              <span className="text-blue-600 font-medium ml-2">Score d'optimisation: 85/100</span>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Planning du {new Date().toLocaleDateString('fr-FR')}</CardTitle>
              <CardDescription>
                Circuit optimisé par l'IA - {statsJour.rdv} rendez-vous, {statsJour.km} km
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {planning.map((event, index) => (
                  <div key={event.id} className={`border rounded-lg p-4 ${
                    event.statut === 'termine' ? 'bg-gray-50' : 
                    event.statut === 'en-cours' ? 'bg-blue-50 border-blue-300' : ''
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-lg font-bold">{event.heureDebut}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.duree} min
                          </p>
                        </div>
                        
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center
                          ${event.type === 'rdv' ? 'bg-blue-100 text-blue-600' :
                            event.type === 'trajet' ? 'bg-green-100 text-green-600' :
                            event.type === 'pause' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-gray-100 text-gray-600'}`}>
                          {event.type === 'rdv' ? <Users className="h-5 w-5" /> :
                           event.type === 'trajet' ? <Route className="h-5 w-5" /> :
                           event.type === 'pause' ? <Clock className="h-5 w-5" /> :
                           <Activity className="h-5 w-5" />}
                        </div>
                        
                        <div className="flex-1">
                          {event.type === 'rdv' && event.prospect && (
                            <>
                              <p className="font-medium">{event.prospect.nom}</p>
                              <p className="text-sm text-muted-foreground">
                                {event.prospect.contact} • {event.prospect.adresse}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={event.priorite === 'haute' ? 'default' : 'secondary'} className="text-xs">
                                  {event.priorite}
                                </Badge>
                                {event.scoreOpportunite && (
                                  <Badge variant="outline" className="text-xs">
                                    Score: {event.scoreOpportunite}%
                                  </Badge>
                                )}
                              </div>
                            </>
                          )}
                          
                          {event.type === 'trajet' && event.trajet && (
                            <>
                              <p className="font-medium">
                                Trajet: {event.trajet.depart} → {event.trajet.arrivee}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {event.trajet.distance} km • {event.trajet.duree} min • 
                                Rs {calculateIndemnites(event.trajet.distance)}
                              </p>
                            </>
                          )}
                          
                          {event.type === 'pause' && (
                            <p className="font-medium">Pause déjeuner</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {event.statut === 'termine' ? (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Terminé
                          </Badge>
                        ) : event.statut === 'en-cours' ? (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="mr-1 h-3 w-3" />
                            En cours
                          </Badge>
                        ) : (
                          <>
                            {event.type === 'rdv' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setCurrentEvent(event)
                                    setShowNoteDialog(true)
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Note
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => completeEvent(event.id, 'succes')}
                                >
                                  Terminer
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Mes Prospects */}
        <TabsContent value="prospects" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <Input 
              placeholder="Rechercher un prospect..." 
              className="max-w-sm"
            />
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau prospect
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prospects.map((prospect) => (
              <Card key={prospect.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{prospect.nom}</h3>
                      <p className="text-sm text-muted-foreground">
                        {MAURITIUS_CONFIG.secteurs[prospect.secteur].icon} {MAURITIUS_CONFIG.secteurs[prospect.secteur].label}
                      </p>
                    </div>
                    <Badge variant={
                      prospect.statut === 'signe' ? 'default' :
                      prospect.statut === 'en-negociation' ? 'secondary' :
                      'outline'
                    }>
                      {MAURITIUS_CONFIG.statuts[prospect.statut].label}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{prospect.ville}, {MAURITIUS_CONFIG.districts[prospect.district].label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{prospect.telephone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{prospect.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Budget: {prospect.budget}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 my-3">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < prospect.score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded text-sm mb-4">
                    {prospect.notes}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" variant="outline">
                      <Phone className="h-4 w-4 mr-1" />
                      Appeler
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedProspect(prospect)}
                    >
                      Qualifier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Mon Activité */}
        <TabsContent value="activite" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activité de la semaine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">RDV effectués</span>
                      <span className="text-sm font-medium">8/10</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Appels</span>
                      <span className="text-sm font-medium">45/50</span>
                    </div>
                    <Progress value={90} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Emails envoyés</span>
                      <span className="text-sm font-medium">23/25</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Nouveaux contacts</span>
                      <span className="text-sm font-medium">6/5</span>
                    </div>
                    <Progress value={120} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historique récent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Contrat signé - Hotel Paradise</p>
                      <p className="text-xs text-muted-foreground">Il y a 2 jours</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">RDV avec Restaurant Le Cap</p>
                      <p className="text-xs text-muted-foreground">Il y a 3 jours</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Appel de qualification - Winners</p>
                      <p className="text-xs text-muted-foreground">Il y a 5 jours</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Mes Objectifs */}
        <TabsContent value="objectifs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Objectifs mensuels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Chiffre d'affaires</span>
                    <span className="font-bold">
                      Rs {((currentCommercial.stats?.caGenere || 0) / 1000).toFixed(0)}k / 
                      {(currentCommercial.objectifs.mensuel.ca / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <Progress 
                    value={(currentCommercial.stats?.caGenere || 0) / currentCommercial.objectifs.mensuel.ca * 100} 
                    className="h-3"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Nouveaux clients</span>
                    <span className="font-bold">
                      {currentCommercial.stats?.nombreClients} / {currentCommercial.objectifs.mensuel.nouveauxClients}
                    </span>
                  </div>
                  <Progress 
                    value={(currentCommercial.stats?.nombreClients || 0) / currentCommercial.objectifs.mensuel.nouveauxClients * 100} 
                    className="h-3"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Rendez-vous</span>
                    <span className="font-bold">
                      {currentCommercial.stats?.rdvEffectues} / {currentCommercial.objectifs.mensuel.rdv}
                    </span>
                  </div>
                  <Progress 
                    value={(currentCommercial.stats?.rdvEffectues || 0) / currentCommercial.objectifs.mensuel.rdv * 100} 
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="60"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="60"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 60}`}
                        strokeDashoffset={`${2 * Math.PI * 60 * (1 - (currentCommercial.stats?.scorePerformance || 0) / 100)}`}
                        className="text-blue-600 transform -rotate-90 origin-center"
                      />
                    </svg>
                    <span className="absolute text-3xl font-bold">
                      {currentCommercial.stats?.scorePerformance}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">Score de performance</p>
                  <Badge variant="outline" className="mt-2">
                    Rang #{currentCommercial.stats?.ranking} sur l'équipe
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog pour ajouter une note */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Type de note</label>
              <select className="w-full border rounded-md px-3 py-2 mt-1">
                <option value="rdv">Compte-rendu RDV</option>
                <option value="appel">Note d'appel</option>
                <option value="email">Suivi email</option>
                <option value="general">Note générale</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Sentiment</label>
              <div className="flex gap-2 mt-1">
                <Button size="sm" variant="outline" className="flex-1">
                  😊 Positif
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  😐 Neutre
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  😟 Négatif
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Commentaire</label>
              <Textarea 
                placeholder="Détails de l'échange..." 
                className="mt-1"
                rows={4}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Prochaine action</label>
              <Input type="date" className="mt-1" />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                Annuler
              </Button>
              <Button onClick={() => addNote(1, "Note test", "rdv")}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Icône Trophy manquante
function Trophy({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
