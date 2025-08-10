"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { 
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  CalendarDays,
  FileText,
  Star,
  TrendingUp,
  Building,
  User,
  Timer,
  Car,
  Route,
  Navigation,
  DollarSign,
  Activity,
  RefreshCw,
  BellRing,
  BarChart3,
  Trophy,
  Briefcase
} from 'lucide-react'

// Import des configurations Maurice depuis votre système existant
import { MAURITIUS_CONFIG, Prospect as MauritiusProspect } from '@/lib/mauritius-config'
import { 
  Commercial, 
  PlanningEvent, 
  generateDailyPlanning, 
  calculateDistance, 
  calculateIndemnites 
} from '@/lib/commercial-system'

// Types étendus pour RDV
interface RDV {
  id: number
  prospect_id: number
  titre: string
  commercial_id: string
  commercial_nom: string
  date_time: string
  type_visite: 'decouverte' | 'presentation' | 'negociation' | 'signature' | 'suivi' | 'support'
  priorite: 'normale' | 'haute' | 'urgente'
  duree_min: number
  notes: string
  statut: 'planifie' | 'confirme' | 'en-cours' | 'termine' | 'annule' | 'reporte'
  prospect?: MauritiusProspect
  compte_rendu?: string
  prochaines_actions?: string
  resultat?: 'succes' | 'a-revoir' | 'echec' | 'en-attente'
  distance_km?: number
  temps_trajet?: number
  indemnite_km?: number
}

// Commercial unique : KARINE MOMUS avec accès à toute l'île Maurice
const commerciauxMauritius: Commercial[] = [
  {
    id: '1',
    userId: 'karine-momus',
    nom: 'MOMUS',
    prenom: 'Karine',
    email: 'karine.momus@crm.mu',
    telephone: '+230 5123 4567',
    adresse: {
      rue: 'Royal Road',
      ville: 'Port Louis',
      district: 'port-louis',
      codePostal: '11328'
    },
    dateEmbauche: new Date('2024-01-01'),
    statut: 'actif',
    vehicule: {
      type: 'personnel',
      marque: 'Toyota',
      modele: 'Yaris',
      immatriculation: 'KM 2024',
      tauxKm: 25
    },
    // Accès à toutes les zones de Maurice
    zones: [
      'port-louis', 
      'pamplemousses', 
      'riviere-du-rempart',
      'flacq',
      'grand-port',
      'savanne',
      'plaines-wilhems',
      'moka',
      'riviere-noire'
    ],
    // Tous les secteurs d'activité
    secteurs: ['hotel', 'restaurant', 'retail', 'clinique', 'pharmacie', 'wellness', 'spa', 'tourisme'],
    objectifs: {
      mensuel: { ca: 500000, nouveauxClients: 10, rdv: 40 },
      annuel: { ca: 6000000, nouveauxClients: 120 }
    }
  }
]

export default function RdvMauritiusSection() {
  // États principaux
  const [prospects, setProspects] = React.useState<MauritiusProspect[]>([])
  const [rdvs, setRdvs] = React.useState<RDV[]>([])
  const [commercials] = React.useState<Commercial[]>(commerciauxMauritius)
  const selectedCommercial = commerciauxMauritius[0] // Karine MOMUS toujours sélectionnée
  const [planning, setPlanning] = React.useState<PlanningEvent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState("planning")
  
  // États pour le formulaire RDV  
  const [selectedProspect, setSelectedProspect] = React.useState<MauritiusProspect | null>(null)
  const selectedCommercial = commerciauxMauritius[0] // Karine Momus toujours sélectionnée
  const [selectedDate, setSelectedDate] = React.useState("")
  const [selectedTime, setSelectedTime] = React.useState("")
  const [typeVisite, setTypeVisite] = React.useState<RDV['type_visite']>("decouverte")
  const [priorite, setPriorite] = React.useState<RDV['priorite']>("normale")
  const [duree, setDuree] = React.useState("60")
  const [notes, setNotes] = React.useState("")
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterDistrict, setFilterDistrict] = React.useState("all")
  const [filterSecteur, setFilterSecteur] = React.useState("all")
  const [filterStatut, setFilterStatut] = React.useState("all")
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [showProspectDetails, setShowProspectDetails] = React.useState(false)
  const [showNewProspect, setShowNewProspect] = React.useState(false)
  
  // État pour le nouveau prospect
  const [newProspect, setNewProspect] = React.useState<Partial<MauritiusProspect>>({
    nom: '',
    secteur: 'hotel',
    ville: '',
    district: 'port-louis',
    statut: 'nouveau',
    contact: '',
    telephone: '',
    email: '',
    score: 3,
    budget: '',
    notes: '',
    adresse: ''
  })
  
  const { toast } = useToast()
  const today = new Date().toISOString().split("T")[0]

  // Chargement des données
  async function loadProspects() {
    try {
      const response = await fetch('/api/prospects/mauritius', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store' 
      })
      
      if (response.ok) {
        const data = await response.json()
        setProspects(Array.isArray(data) ? data : [])
      } else {
        // Données de démonstration pour Maurice
        setProspects([
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
          },
          {
            id: 4,
            nom: "Spa Attitude",
            secteur: "spa",
            ville: "Grand Baie",
            district: "riviere-du-rempart",
            statut: "contacte",
            contact: "Mme Ramgoolam",
            telephone: "+230 5567 8901",
            email: "spa@attitude.mu",
            score: 4,
            budget: "Rs 150k",
            notes: "Intéressé par package wellness",
            adresse: "Royal Road, Grand Baie"
          }
        ])
      }
    } catch (error) {
      console.error('Erreur chargement prospects:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadRdvs() {
    try {
      const response = await fetch('/api/rdv/mauritius', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store' 
      })
      
      if (response.ok) {
        const data = await response.json()
        const enrichedRdvs = data.map((rdv: RDV) => ({
          ...rdv,
          prospect: prospects.find(p => p.id === rdv.prospect_id)
        }))
        setRdvs(Array.isArray(enrichedRdvs) ? enrichedRdvs : [])
      }
    } catch (error) {
      console.error('Erreur chargement RDV:', error)
    }
  }

  // Générer le planning optimisé pour Karine
  React.useEffect(() => {
    if (prospects.length > 0) {
      const dailyPlanning = generateDailyPlanning(selectedCommercial, prospects, new Date())
      setPlanning(dailyPlanning.events)
    }
  }, [prospects])

  // Chargement initial
  React.useEffect(() => {
    loadProspects()
  }, [])

  React.useEffect(() => {
    if (prospects.length > 0) {
      loadRdvs()
    }
  }, [prospects])

  // Filtrage des prospects
  const filteredProspects = React.useMemo(() => {
    let filtered = [...prospects]
    
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.secteur.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filterDistrict !== 'all') {
      filtered = filtered.filter(p => p.district === filterDistrict)
    }
    
    if (filterSecteur !== 'all') {
      filtered = filtered.filter(p => p.secteur === filterSecteur)
    }
    
    if (filterStatut !== 'all') {
      filtered = filtered.filter(p => p.statut === filterStatut)
    }
    
    // Tri par score décroissant
    filtered.sort((a, b) => (b.score || 0) - (a.score || 0))
    
    return filtered
  }, [prospects, searchTerm, filterDistrict, filterSecteur, filterStatut])

  // Les RDV sont tous pour Karine, pas besoin de filtrer
  const filteredRdvs = React.useMemo(() => {
    return rdvs.sort((a, b) => 
      new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
    )
  }, [rdvs])

  // Suggestions de prospects prioritaires (toute l'île)
  const suggestedProspects = React.useMemo(() => {
    return prospects
      .filter(p => {
        // Prospects avec statut prioritaire
        const isPriority = p.statut === 'nouveau' || p.statut === 'qualifie'
        return isPriority
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5)
  }, [prospects])

  // Statistiques par district
  const statsByDistrict = React.useMemo(() => {
    const stats: Record<string, { total: number; nouveaux: number; signes: number }> = {}
    
    Object.keys(MAURITIUS_CONFIG.districts).forEach(district => {
      const districtProspects = prospects.filter(p => p.district === district)
      stats[district] = {
        total: districtProspects.length,
        nouveaux: districtProspects.filter(p => p.statut === 'nouveau').length,
        signes: districtProspects.filter(p => p.statut === 'signe').length
      }
    })
    
    return stats
  }, [prospects])

  // Statistiques globales
  const stats = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return {
      totalProspects: prospects.length,
      nouveaux: prospects.filter(p => p.statut === 'nouveau').length,
      enCours: prospects.filter(p => ['contacte', 'qualifie', 'en-negociation'].includes(p.statut)).length,
      signes: prospects.filter(p => p.statut === 'signe').length,
      rdvSemaine: rdvs.filter(r => {
        const rdvDate = new Date(r.date_time)
        const weekFromNow = new Date(today)
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        return rdvDate >= today && rdvDate <= weekFromNow
      }).length,
      kmPrevus: planning
        .filter(e => e.type === 'trajet')
        .reduce((sum, e) => sum + (e.trajet?.distance || 0), 0),
      indemnites: planning
        .filter(e => e.type === 'trajet')
        .reduce((sum, e) => sum + calculateIndemnites(e.trajet?.distance || 0), 0)
    }
  }, [prospects, rdvs, planning])

  // Créer un RDV avec calcul de distance
  async function createRdv() {
    if (!selectedProspect || !selectedDate || !selectedTime) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    try {
      // Calculer la distance depuis le bureau de Karine
      const distance = calculateDistance(
        selectedCommercial.adresse.district,
        selectedProspect.district
      )
      
      const rdvData = {
        prospect_id: selectedProspect.id,
        titre: `RDV - ${selectedProspect.nom}`,
        commercial_id: selectedCommercial.id,
        commercial_nom: `${selectedCommercial.prenom} ${selectedCommercial.nom}`,
        date_time: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
        type_visite: typeVisite,
        priorite: priorite,
        duree_min: parseInt(duree),
        notes: notes || '',
        statut: 'planifie' as const,
        distance_km: distance,
        temps_trajet: Math.round(distance * 2.5), // Estimation 2.5 min/km à Maurice
        indemnite_km: calculateIndemnites(distance)
      }

      const response = await fetch('/api/rdv/mauritius', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rdvData)
      })

      if (response.ok) {
        const createdRdv = await response.json()
        setRdvs(prev => [...prev, { ...createdRdv, prospect: selectedProspect }])
        
        toast({ 
          title: "✅ RDV planifié avec succès", 
          description: `${selectedProspect.nom} - ${MAURITIUS_CONFIG.districts[selectedProspect.district].label} (${distance}km - Rs ${calculateIndemnites(distance)})`
        })
        
        resetRdvForm()
        setActiveTab("planning")
      }
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Impossible de créer le RDV",
        variant: "destructive"
      })
    }
  }

  function resetRdvForm() {
    setSelectedProspect(null)
    setSelectedDate("")
    setSelectedTime("")
    setTypeVisite("decouverte")
    setPriorite("normale")
    setDuree("60")
    setNotes("")
  }

  // Créer un nouveau prospect
  async function createProspect(e: React.FormEvent) {
    e.preventDefault()
    
    if (!newProspect.nom || !newProspect.contact || !newProspect.telephone) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez remplir les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/prospects/mauritius', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProspect)
      })

      if (response.ok) {
        await loadProspects()
        toast({ 
          title: "✅ Prospect créé", 
          description: `${newProspect.nom} ajouté dans ${MAURITIUS_CONFIG.districts[newProspect.district!].label}`
        })
        setShowNewProspect(false)
        setNewProspect({
          nom: '',
          secteur: 'hotel',
          ville: '',
          district: 'port-louis',
          statut: 'nouveau',
          contact: '',
          telephone: '',
          email: '',
          score: 3,
          budget: '',
          notes: '',
          adresse: ''
        })
      }
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Impossible de créer le prospect",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Chargement des données Maurice...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec contexte Maurice */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              Gestion des Rendez-Vous - Île Maurice
            </h2>
            <p className="text-gray-600">
              Commercial: <strong>Karine MOMUS</strong> • {prospects.length} prospects • {rdvs.length} RDV planifiés
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={async () => {
                await loadProspects()
                await loadRdvs()
                toast({ title: "✅ Données actualisées" })
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" onClick={() => setShowNewProspect(true)}>
              <Building className="h-4 w-4 mr-2" />
              Nouveau Prospect
            </Button>
            <Button onClick={() => setActiveTab("nouveau-rdv")}>
              <Plus className="h-4 w-4 mr-2" />
              Planifier RDV
            </Button>
          </div>
        </div>

        {/* KPIs avec focus Maurice */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Prospects</p>
                  <p className="text-xl font-bold">{stats.totalProspects}</p>
                </div>
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Nouveaux</p>
                  <p className="text-xl font-bold">{stats.nouveaux}</p>
                </div>
                <Target className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">En cours</p>
                  <p className="text-xl font-bold">{stats.enCours}</p>
                </div>
                <Activity className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Signés</p>
                  <p className="text-xl font-bold">{stats.signes}</p>
                </div>
                <Trophy className="h-6 w-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">RDV/sem</p>
                  <p className="text-xl font-bold">{stats.rdvSemaine}</p>
                </div>
                <Calendar className="h-6 w-6 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Km prévus</p>
                  <p className="text-xl font-bold">{stats.kmPrevus}</p>
                </div>
                <Car className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Indemnités</p>
                  <p className="text-lg font-bold">Rs {stats.indemnites}</p>
                </div>
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Districts</p>
                  <p className="text-xl font-bold">9</p>
                </div>
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alertes pour prospects prioritaires */}
      {suggestedProspects.length > 0 && (
        <Alert className="bg-amber-50 border-amber-200">
          <BellRing className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <strong className="text-amber-900">Prospects prioritaires à contacter :</strong>{' '}
            <span className="text-amber-800">
              {suggestedProspects.map(p => 
                `${p.nom} (${MAURITIUS_CONFIG.districts[p.district].label})`
              ).join(', ')}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="planning">
            <Route className="h-4 w-4 mr-2" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="prospects">
            <Users className="h-4 w-4 mr-2" />
            Prospects
          </TabsTrigger>
          <TabsTrigger value="nouveau-rdv">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau RDV
          </TabsTrigger>
          <TabsTrigger value="carte">
            <MapPin className="h-4 w-4 mr-2" />
            Carte
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        {/* Tab Planning Optimisé */}
        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planning optimisé du jour - Karine MOMUS</CardTitle>
              <CardDescription>
                Circuit optimisé par zones pour minimiser les distances dans toute l'île Maurice
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Planning du jour */}
              {planning.length > 0 ? (
                <div className="space-y-2">
                  {planning.map((event, index) => (
                    <div key={event.id} className={`border rounded-lg p-4 ${
                      event.type === 'trajet' ? 'bg-green-50' :
                      event.type === 'rdv' ? 'bg-blue-50' :
                      event.type === 'pause' ? 'bg-yellow-50' :
                      'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-lg font-bold">{event.heureDebut}</p>
                            <p className="text-xs text-muted-foreground">{event.duree} min</p>
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
                                  {event.prospect.contact} • {MAURITIUS_CONFIG.districts[event.prospect.district].label}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {MAURITIUS_CONFIG.secteurs[event.prospect.secteur].label}
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
                                  Trajet: {MAURITIUS_CONFIG.districts[event.trajet.depart]?.label || event.trajet.depart} → {MAURITIUS_CONFIG.districts[event.trajet.arrivee]?.label || event.trajet.arrivee}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {event.trajet.distance} km • {event.trajet.duree} min • Rs {calculateIndemnites(event.trajet.distance)}
                                </p>
                              </>
                            )}
                            
                            {event.type === 'pause' && (
                              <p className="font-medium">Pause déjeuner</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Résumé du planning */}
                  <Card className="mt-4 bg-gray-50">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-sm text-muted-foreground">RDV</p>
                          <p className="text-xl font-bold">
                            {planning.filter(e => e.type === 'rdv').length}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Distance totale</p>
                          <p className="text-xl font-bold">
                            {planning.filter(e => e.type === 'trajet').reduce((sum, e) => sum + (e.trajet?.distance || 0), 0)} km
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Temps route</p>
                          <p className="text-xl font-bold">
                            {Math.round(planning.filter(e => e.type === 'trajet').reduce((sum, e) => sum + (e.trajet?.duree || 0), 0) / 60)}h
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Indemnités</p>
                          <p className="text-xl font-bold">
                            Rs {planning.filter(e => e.type === 'trajet').reduce((sum, e) => sum + calculateIndemnites(e.trajet?.distance || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Aucun RDV planifié pour aujourd'hui
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Prospects avec filtres par district */}
        <TabsContent value="prospects" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un prospect..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    className="border rounded-md px-3 py-2 text-sm"
                    value={filterDistrict}
                    onChange={(e) => setFilterDistrict(e.target.value)}
                  >
                    <option value="all">Tous les districts</option>
                    {Object.entries(MAURITIUS_CONFIG.districts).map(([key, district]) => (
                      <option key={key} value={key}>{district.label}</option>
                    ))}
                  </select>
                  
                  <select
                    className="border rounded-md px-3 py-2 text-sm"
                    value={filterSecteur}
                    onChange={(e) => setFilterSecteur(e.target.value)}
                  >
                    <option value="all">Tous les secteurs</option>
                    {Object.entries(MAURITIUS_CONFIG.secteurs).map(([key, secteur]) => (
                      <option key={key} value={key}>{secteur.label}</option>
                    ))}
                  </select>
                  
                  <select
                    className="border rounded-md px-3 py-2 text-sm"
                    value={filterStatut}
                    onChange={(e) => setFilterStatut(e.target.value)}
                  >
                    <option value="all">Tous les statuts</option>
                    {Object.entries(MAURITIUS_CONFIG.statuts).map(([key, statut]) => (
                      <option key={key} value={key}>{statut.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredProspects.map(prospect => (
              <Card key={prospect.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{prospect.nom}</h4>
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
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{prospect.contact}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{prospect.telephone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
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
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedProspect(prospect)
                        setActiveTab("nouveau-rdv")
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Planifier RDV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab Nouveau RDV avec vérification des zones */}
        <TabsContent value="nouveau-rdv" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sélection du prospect */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Sélectionner un prospect</CardTitle>
                <CardDescription>
                  Karine MOMUS peut intervenir dans toute l'île Maurice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Prospects prioritaires */}
                  {suggestedProspects.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2 text-red-600">
                        ⚠️ Prospects prioritaires
                      </h4>
                      <div className="space-y-2">
                        {suggestedProspects.map(prospect => (
                          <div
                            key={prospect.id}
                            className={`p-2 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                              selectedProspect?.id === prospect.id ? 'bg-blue-50 border-blue-300' : ''
                            }`}
                            onClick={() => setSelectedProspect(prospect)}
                          >
                            <div className="font-medium text-sm">{prospect.nom}</div>
                            <div className="text-xs text-gray-500">
                              {MAURITIUS_CONFIG.districts[prospect.district].label} • Score {prospect.score}/5
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tous les prospects */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tous les prospects</h4>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {prospects
                        .filter(p => p.statut !== 'signe' && p.statut !== 'perdu')
                        .map(prospect => (
                          <div
                            key={prospect.id}
                            className={`p-2 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                              selectedProspect?.id === prospect.id ? 'bg-blue-50 border-blue-300' : ''
                            }`}
                            onClick={() => setSelectedProspect(prospect)}
                          >
                            <div className="font-medium text-sm">{prospect.nom}</div>
                            <div className="text-xs text-gray-500">
                              {MAURITIUS_CONFIG.districts[prospect.district].label} • {MAURITIUS_CONFIG.secteurs[prospect.secteur].label}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulaire RDV */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2. Détails du RDV</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProspect ? (
                  <form onSubmit={(e) => { e.preventDefault(); createRdv(); }} className="space-y-4">
                    {/* Info prospect sélectionné */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium">{selectedProspect.nom}</p>
                      <p className="text-sm text-gray-500">
                        {MAURITIUS_CONFIG.districts[selectedProspect.district].label} • 
                        Distance depuis Port Louis: {calculateDistance('port-louis', selectedProspect.district)} km
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Date *</label>
                        <Input
                          type="date"
                          min={today}
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Heure *</label>
                        <Input
                          type="time"
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Type</label>
                        <select
                          className="w-full border rounded-md px-3 py-2"
                          value={typeVisite}
                          onChange={(e) => setTypeVisite(e.target.value as RDV['type_visite'])}
                        >
                          <option value="decouverte">Découverte</option>
                          <option value="presentation">Présentation</option>
                          <option value="negociation">Négociation</option>
                          <option value="signature">Signature</option>
                          <option value="suivi">Suivi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Priorité</label>
                        <select
                          className="w-full border rounded-md px-3 py-2"
                          value={priorite}
                          onChange={(e) => setPriorite(e.target.value as RDV['priorite'])}
                        >
                          <option value="normale">Normale</option>
                          <option value="haute">Haute</option>
                          <option value="urgente">Urgente</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Notes</label>
                      <Textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Objectifs du RDV..."
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Planifier le RDV
                    </Button>
                  </form>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Sélectionnez un prospect pour planifier un RDV
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Carte des districts */}
        <TabsContent value="carte" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Répartition géographique des prospects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(MAURITIUS_CONFIG.districts).map(([key, district]) => (
                  <div key={key} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{district.label}</h4>
                    <div className="space-y-1 text-sm">
                      <p>Total: {statsByDistrict[key]?.total || 0} prospects</p>
                      <p className="text-green-600">Nouveaux: {statsByDistrict[key]?.nouveaux || 0}</p>
                      <p className="text-blue-600">Signés: {statsByDistrict[key]?.signes || 0}</p>
                    </div>
                    <Progress 
                      value={(statsByDistrict[key]?.signes || 0) / Math.max(1, statsByDistrict[key]?.total || 1) * 100}
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Statistiques */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance par secteur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(MAURITIUS_CONFIG.secteurs).map(([key, secteur]) => {
                    const secteurProspects = prospects.filter(p => p.secteur === key)
                    const signes = secteurProspects.filter(p => p.statut === 'signe').length
                    const taux = secteurProspects.length > 0 ? (signes / secteurProspects.length * 100) : 0
                    
                    return (
                      <div key={key}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">
                            {secteur.icon} {secteur.label}
                          </span>
                          <span className="text-sm font-bold">
                            {signes}/{secteurProspects.length} ({taux.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={taux} />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance de Karine MOMUS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-lg">Karine MOMUS</p>
                        <p className="text-sm text-gray-600">
                          Commercial - Toute l'île Maurice
                        </p>
                      </div>
                      <Trophy className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{rdvs.filter(r => r.statut === 'termine').length}</p>
                        <p className="text-xs text-gray-500">RDV terminés</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{rdvs.filter(r => r.statut === 'planifie').length}</p>
                        <p className="text-xs text-gray-500">RDV planifiés</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{prospects.filter(p => p.statut === 'signe').length}</p>
                        <p className="text-xs text-gray-500">Contrats signés</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Zones couvertes:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.values(MAURITIUS_CONFIG.districts).map(district => (
                          <Badge key={district.label} variant="secondary" className="text-xs">
                            {district.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal nouveau prospect Maurice */}
      {showNewProspect && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Créer un nouveau prospect à Maurice</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createProspect} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom de l'entreprise *</label>
                    <Input
                      value={newProspect.nom}
                      onChange={(e) => setNewProspect({...newProspect, nom: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Secteur *</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={newProspect.secteur}
                      onChange={(e) => setNewProspect({...newProspect, secteur: e.target.value})}
                    >
                      {Object.entries(MAURITIUS_CONFIG.secteurs).map(([key, secteur]) => (
                        <option key={key} value={key}>
                          {secteur.icon} {secteur.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">District *</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={newProspect.district}
                      onChange={(e) => setNewProspect({...newProspect, district: e.target.value})}
                    >
                      {Object.entries(MAURITIUS_CONFIG.districts).map(([key, district]) => (
                        <option key={key} value={key}>{district.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ville *</label>
                    <Input
                      value={newProspect.ville}
                      onChange={(e) => setNewProspect({...newProspect, ville: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Contact principal *</label>
                    <Input
                      value={newProspect.contact}
                      onChange={(e) => setNewProspect({...newProspect, contact: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone *</label>
                    <Input
                      value={newProspect.telephone}
                      onChange={(e) => setNewProspect({...newProspect, telephone: e.target.value})}
                      placeholder="+230..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={newProspect.email}
                    onChange={(e) => setNewProspect({...newProspect, email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Adresse</label>
                  <Input
                    value={newProspect.adresse}
                    onChange={(e) => setNewProspect({...newProspect, adresse: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Budget estimé</label>
                    <Input
                      value={newProspect.budget}
                      onChange={(e) => setNewProspect({...newProspect, budget: e.target.value})}
                      placeholder="Rs..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Score priorité (1-5)</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={newProspect.score}
                      onChange={(e) => setNewProspect({...newProspect, score: parseInt(e.target.value)})}
                    >
                      {[1,2,3,4,5].map(score => (
                        <option key={score} value={score}>{score} étoile(s)</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <Textarea
                    rows={3}
                    value={newProspect.notes}
                    onChange={(e) => setNewProspect({...newProspect, notes: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowNewProspect(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    <Building className="h-4 w-4 mr-2" />
                    Créer le prospect
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
