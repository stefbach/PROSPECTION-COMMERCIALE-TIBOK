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
  ArrowUpDown,
  Grid,
  List,
  History,
  BellRing,
  BarChart3,
  Briefcase,
  UserPlus,
  MessageSquare,
  Activity,
  RefreshCw,
  Info,
  Trophy,
  DollarSign,
  ChevronLeft,
  CheckSquare
} from 'lucide-react'

// Types étendus
interface Prospect {
  id: number
  nom: string
  secteur: string
  ville: string
  statut: 'nouveau' | 'contacte' | 'qualifie' | 'en-negociation' | 'signe' | 'perdu'
  adresse: string
  telephone: string
  email: string
  contact_principal: string
  score: number // Score de priorité 1-10
  budget_estime: string
  dernier_contact: string | null
  prochain_contact: string | null
  notes: string
  created_at: string
  historique_rdv?: RDV[]
  ca_potentiel?: number
  taille_entreprise?: string
  besoins?: string[]
}

interface RDV {
  id: number
  prospect_id: number
  titre: string
  commercial: string
  date_time: string
  type_visite: 'decouverte' | 'presentation' | 'negociation' | 'signature' | 'suivi' | 'support'
  priorite: 'normale' | 'haute' | 'urgente'
  duree_min: number
  notes: string
  statut: 'planifie' | 'confirme' | 'en-cours' | 'termine' | 'annule' | 'reporte'
  prospect?: Prospect
  compte_rendu?: string
  prochaines_actions?: string
  resultat?: 'succes' | 'a-revoir' | 'echec' | 'en-attente'
}

interface Commercial {
  id: string
  nom: string
  region: string
  disponibilites: { date: string; creneaux: string[] }[]
  rdv_jour: number
  charge: number // % de charge
}

// Données mockées enrichies
const mockProspects: Prospect[] = [
  {
    id: 1,
    nom: "Clinique Saint-Martin",
    secteur: "Santé",
    ville: "Paris",
    statut: "en-negociation",
    adresse: "45 rue de la Santé, 75014 Paris",
    telephone: "+33 1 45 67 89 00",
    email: "contact@clinique-st-martin.fr",
    contact_principal: "Dr. Marie Dubois",
    score: 9,
    budget_estime: "50-100k€",
    dernier_contact: "2024-01-10",
    prochain_contact: "2024-01-20",
    notes: "Très intéressés par notre solution. Budget validé en interne.",
    created_at: "2023-12-01",
    ca_potentiel: 75000,
    taille_entreprise: "50-100 employés",
    besoins: ["Gestion patients", "Planning", "Facturation"]
  },
  {
    id: 2,
    nom: "EHPAD Les Jardins",
    secteur: "Senior",
    ville: "Lyon",
    statut: "qualifie",
    adresse: "12 avenue des Roses, 69003 Lyon",
    telephone: "+33 4 78 90 12 34",
    email: "direction@ehpad-jardins.fr",
    contact_principal: "M. Jean Bertrand",
    score: 7,
    budget_estime: "30-50k€",
    dernier_contact: "2024-01-08",
    prochain_contact: "2024-01-15",
    notes: "Besoin urgent de modernisation. Décision Q1 2024.",
    created_at: "2023-11-15",
    ca_potentiel: 40000,
    taille_entreprise: "20-50 employés",
    besoins: ["Suivi résidents", "Planning soignants"]
  },
  {
    id: 3,
    nom: "Cabinet Dr. Moreau",
    secteur: "Médical",
    ville: "Marseille",
    statut: "nouveau",
    adresse: "78 boulevard Michelet, 13008 Marseille",
    telephone: "+33 4 91 22 33 44",
    email: "cabinet@dr-moreau.fr",
    contact_principal: "Dr. Pierre Moreau",
    score: 6,
    budget_estime: "10-20k€",
    dernier_contact: null,
    prochain_contact: "2024-01-12",
    notes: "Premier contact à établir. Recommandé par Dr. Dubois.",
    created_at: "2024-01-05",
    ca_potentiel: 15000,
    taille_entreprise: "1-10 employés",
    besoins: ["Gestion cabinet", "Prise RDV en ligne"]
  },
  {
    id: 4,
    nom: "Hôpital Privé Centrale",
    secteur: "Santé",
    ville: "Paris",
    statut: "contacte",
    adresse: "100 rue de la République, 75011 Paris",
    telephone: "+33 1 55 66 77 88",
    email: "admin@hopital-centrale.fr",
    contact_principal: "Mme Sophie Laurent",
    score: 8,
    budget_estime: "100-200k€",
    dernier_contact: "2024-01-05",
    prochain_contact: "2024-01-18",
    notes: "Grand compte potentiel. Processus de décision long.",
    created_at: "2023-10-20",
    ca_potentiel: 150000,
    taille_entreprise: "100+ employés",
    besoins: ["ERP complet", "Multi-sites", "Formation"]
  }
]

const mockCommercials: Commercial[] = [
  {
    id: "1",
    nom: "M. Dupont",
    region: "Paris",
    disponibilites: [
      { date: "2024-01-15", creneaux: ["09:00", "10:00", "14:00", "15:00", "16:00"] },
      { date: "2024-01-16", creneaux: ["09:00", "11:00", "14:00", "15:00"] },
      { date: "2024-01-17", creneaux: ["10:00", "11:00", "14:00", "16:00"] }
    ],
    rdv_jour: 4,
    charge: 75
  },
  {
    id: "2",
    nom: "Mme Martin",
    region: "Lyon",
    disponibilites: [
      { date: "2024-01-15", creneaux: ["09:00", "10:00", "11:00", "14:00", "15:00"] },
      { date: "2024-01-16", creneaux: ["09:00", "10:00", "14:00", "15:00", "16:00"] }
    ],
    rdv_jour: 3,
    charge: 60
  }
]

export default function RdvCompletSection() {
  // États principaux
  const [prospects, setProspects] = React.useState<Prospect[]>(mockProspects)
  const [rdvs, setRdvs] = React.useState<RDV[]>([])
  const [commercials] = React.useState<Commercial[]>(mockCommercials)
  const [activeTab, setActiveTab] = React.useState("planning")
  
  // États pour le formulaire RDV
  const [selectedProspect, setSelectedProspect] = React.useState<Prospect | null>(null)
  const [selectedCommercial, setSelectedCommercial] = React.useState<Commercial | null>(null)
  const [selectedDate, setSelectedDate] = React.useState("")
  const [selectedTime, setSelectedTime] = React.useState("")
  const [typeVisite, setTypeVisite] = React.useState<RDV['type_visite']>("decouverte")
  const [priorite, setPriorite] = React.useState<RDV['priorite']>("normale")
  const [duree, setDuree] = React.useState("60")
  const [notes, setNotes] = React.useState("")
  
  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterSecteur, setFilterSecteur] = React.useState("all")
  const [filterStatut, setFilterStatut] = React.useState("all")
  const [filterScore, setFilterScore] = React.useState("all")
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [showProspectDetails, setShowProspectDetails] = React.useState(false)
  const [showNewProspect, setShowNewProspect] = React.useState(false)
  
  const { toast } = useToast()
  const today = new Date().toISOString().split("T")[0]

  // Chargement initial des RDV
  React.useEffect(() => {
    loadRdvs()
  }, [])

  async function loadRdvs() {
    try {
      const response = await fetch('/api/rdv')
      const data = await response.json()
      if (Array.isArray(data)) {
        // Enrichir avec les données prospects
        const enrichedRdvs = data.map((rdv: RDV) => ({
          ...rdv,
          prospect: prospects.find(p => p.id === rdv.prospect_id)
        }))
        setRdvs(enrichedRdvs)
      }
    } catch (error) {
      console.error('Erreur chargement RDV:', error)
    }
  }

  // Filtrage des prospects
  const filteredProspects = React.useMemo(() => {
    let filtered = [...prospects]
    
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contact_principal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.secteur.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filterSecteur !== 'all') {
      filtered = filtered.filter(p => p.secteur === filterSecteur)
    }
    
    if (filterStatut !== 'all') {
      filtered = filtered.filter(p => p.statut === filterStatut)
    }
    
    if (filterScore !== 'all') {
      if (filterScore === 'high') filtered = filtered.filter(p => p.score >= 8)
      else if (filterScore === 'medium') filtered = filtered.filter(p => p.score >= 5 && p.score < 8)
      else if (filterScore === 'low') filtered = filtered.filter(p => p.score < 5)
    }
    
    // Tri par score décroissant
    filtered.sort((a, b) => b.score - a.score)
    
    return filtered
  }, [prospects, searchTerm, filterSecteur, filterStatut, filterScore])

  // Suggestions intelligentes de prospects à contacter
  const suggestedProspects = React.useMemo(() => {
    return prospects
      .filter(p => {
        // Prospects qui nécessitent un suivi
        if (p.prochain_contact) {
          const nextContact = new Date(p.prochain_contact)
          const today = new Date()
          return nextContact <= today && p.statut !== 'signe' && p.statut !== 'perdu'
        }
        // Nouveaux prospects non contactés
        return p.statut === 'nouveau' && !p.dernier_contact
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [prospects])

  // Statistiques
  const stats = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return {
      totalProspects: prospects.length,
      nouveaux: prospects.filter(p => p.statut === 'nouveau').length,
      enCours: prospects.filter(p => ['contacte', 'qualifie', 'en-negociation'].includes(p.statut)).length,
      signes: prospects.filter(p => p.statut === 'signe').length,
      aContacter: suggestedProspects.length,
      rdvSemaine: rdvs.filter(r => {
        const rdvDate = new Date(r.date_time)
        const weekFromNow = new Date(today)
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        return rdvDate >= today && rdvDate <= weekFromNow
      }).length,
      caPotentiel: prospects.reduce((sum, p) => sum + (p.ca_potentiel || 0), 0),
      tauxConversion: prospects.length > 0 
        ? Math.round((prospects.filter(p => p.statut === 'signe').length / prospects.length) * 100)
        : 0
    }
  }, [prospects, rdvs, suggestedProspects])

  // Créer un RDV
  async function createRdv() {
    if (!selectedProspect || !selectedCommercial || !selectedDate || !selectedTime) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    try {
      const rdvData = {
        prospect_id: selectedProspect.id,
        titre: `RDV - ${selectedProspect.nom}`,
        commercial: selectedCommercial.nom,
        date_time: `${selectedDate}T${selectedTime}:00`,
        type_visite: typeVisite,
        priorite,
        duree_min: parseInt(duree),
        notes,
        statut: 'planifie'
      }

      const response = await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rdvData)
      })

      if (!response.ok) throw new Error('Erreur création RDV')

      await loadRdvs()
      
      // Mettre à jour le prospect
      setProspects(prev => prev.map(p => 
        p.id === selectedProspect.id 
          ? { ...p, prochain_contact: selectedDate, statut: p.statut === 'nouveau' ? 'contacte' : p.statut }
          : p
      ))

      toast({ 
        title: "✅ RDV planifié", 
        description: `RDV avec ${selectedProspect.nom} le ${new Date(selectedDate).toLocaleDateString('fr-FR')}`
      })

      // Réinitialiser le formulaire
      resetRdvForm()
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
    setSelectedCommercial(null)
    setSelectedDate("")
    setSelectedTime("")
    setTypeVisite("decouverte")
    setPriorite("normale")
    setDuree("60")
    setNotes("")
  }

  // Créer un nouveau prospect
  async function createProspect(prospectData: Partial<Prospect>) {
    try {
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prospectData)
      })

      if (!response.ok) throw new Error('Erreur création prospect')

      const newProspect = await response.json()
      setProspects(prev => [...prev, newProspect])
      
      toast({ 
        title: "✅ Prospect créé", 
        description: `${prospectData.nom} ajouté à la base`
      })

      setShowNewProspect(false)
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Impossible de créer le prospect",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              Gestion Complète des Rendez-Vous
            </h2>
            <p className="text-gray-600">
              Planification intelligente avec accès complet à la base prospects
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowNewProspect(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nouveau Prospect
            </Button>
            <Button onClick={() => setActiveTab("nouveau-rdv")}>
              <Plus className="h-4 w-4 mr-2" />
              Planifier RDV
            </Button>
          </div>
        </div>

        {/* KPIs */}
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
                <UserPlus className="h-6 w-6 text-green-500" />
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
                  <p className="text-xs text-muted-foreground">À contacter</p>
                  <p className="text-xl font-bold text-red-600">{stats.aContacter}</p>
                </div>
                <BellRing className="h-6 w-6 text-red-500" />
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
                  <p className="text-xs text-muted-foreground">CA potentiel</p>
                  <p className="text-lg font-bold">{(stats.caPotentiel / 1000).toFixed(0)}k€</p>
                </div>
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Conversion</p>
                  <p className="text-xl font-bold">{stats.tauxConversion}%</p>
                </div>
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alertes et suggestions */}
      {suggestedProspects.length > 0 && (
        <Alert className="bg-amber-50 border-amber-200">
          <BellRing className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <strong className="text-amber-900">Attention :</strong>{' '}
            <span className="text-amber-800">
              {suggestedProspects.length} prospect(s) nécessitent un suivi urgent aujourd'hui
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="planning">
            <Calendar className="h-4 w-4 mr-2" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="prospects">
            <Users className="h-4 w-4 mr-2" />
            Base Prospects
          </TabsTrigger>
          <TabsTrigger value="nouveau-rdv">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau RDV
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytiques
          </TabsTrigger>
        </TabsList>

        {/* Tab Planning */}
        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planning de la semaine</CardTitle>
              <CardDescription>
                Vue d'ensemble des RDV planifiés et suggestions d'optimisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Calendrier hebdomadaire simplifié */}
              <div className="grid grid-cols-5 gap-4">
                {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((jour, idx) => (
                  <div key={jour} className="border rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-2">{jour}</h4>
                    <div className="space-y-1">
                      {rdvs
                        .filter(r => {
                          const date = new Date(r.date_time)
                          return date.getDay() === idx + 1
                        })
                        .slice(0, 3)
                        .map(rdv => (
                          <div key={rdv.id} className="text-xs p-1 bg-blue-50 rounded">
                            <div className="font-medium">{rdv.prospect?.nom}</div>
                            <div className="text-gray-500">
                              {new Date(rdv.date_time).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* RDV du jour */}
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Rendez-vous aujourd'hui</h4>
                <div className="space-y-2">
                  {rdvs
                    .filter(r => new Date(r.date_time).toDateString() === new Date().toDateString())
                    .map(rdv => (
                      <div key={rdv.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-lg font-bold">
                              {new Date(rdv.date_time).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">{rdv.duree_min} min</div>
                          </div>
                          <div>
                            <div className="font-medium">{rdv.prospect?.nom}</div>
                            <div className="text-sm text-gray-500">
                              {rdv.prospect?.contact_principal} • {rdv.type_visite}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={rdv.priorite === 'urgente' ? 'destructive' : rdv.priorite === 'haute' ? 'default' : 'secondary'}>
                            {rdv.priorite}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  
                  {rdvs.filter(r => new Date(r.date_time).toDateString() === new Date().toDateString()).length === 0 && (
                    <p className="text-center text-gray-500 py-4">Aucun rendez-vous aujourd'hui</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Base Prospects */}
        <TabsContent value="prospects" className="space-y-4">
          {/* Barre de recherche et filtres */}
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
                    value={filterSecteur}
                    onChange={(e) => setFilterSecteur(e.target.value)}
                  >
                    <option value="all">Tous secteurs</option>
                    <option value="Santé">Santé</option>
                    <option value="Senior">Senior</option>
                    <option value="Médical">Médical</option>
                  </select>
                  
                  <select
                    className="border rounded-md px-3 py-2 text-sm"
                    value={filterStatut}
                    onChange={(e) => setFilterStatut(e.target.value)}
                  >
                    <option value="all">Tous statuts</option>
                    <option value="nouveau">Nouveau</option>
                    <option value="contacte">Contacté</option>
                    <option value="qualifie">Qualifié</option>
                    <option value="en-negociation">En négociation</option>
                    <option value="signe">Signé</option>
                    <option value="perdu">Perdu</option>
                  </select>
                  
                  <select
                    className="border rounded-md px-3 py-2 text-sm"
                    value={filterScore}
                    onChange={(e) => setFilterScore(e.target.value)}
                  >
                    <option value="all">Tous scores</option>
                    <option value="high">Score élevé (8+)</option>
                    <option value="medium">Score moyen (5-7)</option>
                    <option value="low">Score faible (&lt;5)</option>
                  </select>
                  
                  <div className="flex gap-1 border rounded-md">
                    <Button
                      size="sm"
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des prospects avec actions RDV */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredProspects.map(prospect => (
              <ProspectCard
                key={prospect.id}
                prospect={prospect}
                viewMode={viewMode}
                onSelectForRdv={() => {
                  setSelectedProspect(prospect)
                  setActiveTab("nouveau-rdv")
                }}
                onViewDetails={() => {
                  setSelectedProspect(prospect)
                  setShowProspectDetails(true)
                }}
              />
            ))}
          </div>

          {filteredProspects.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun prospect ne correspond à vos critères</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Nouveau RDV avec accès prospects */}
        <TabsContent value="nouveau-rdv" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne gauche: Sélection prospect */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">1. Sélectionner un prospect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Suggestions prioritaires */}
                {suggestedProspects.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2 text-red-600">
                      ⚠️ À contacter en priorité
                    </h4>
                    <div className="space-y-2">
                      {suggestedProspects.slice(0, 3).map(prospect => (
                        <div
                          key={prospect.id}
                          className={`p-2 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                            selectedProspect?.id === prospect.id ? 'bg-blue-50 border-blue-300' : ''
                          }`}
                          onClick={() => setSelectedProspect(prospect)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{prospect.nom}</div>
                              <div className="text-xs text-gray-500">{prospect.ville}</div>
                            </div>
                            <Badge variant="destructive" className="text-xs">
                              Score {prospect.score}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Liste complète des prospects */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Tous les prospects</h4>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {prospects
                      .filter(p => p.statut !== 'signe' && p.statut !== 'perdu')
                      .map(prospect => (
                        <div
                          key={prospect.id}
                          className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                            selectedProspect?.id === prospect.id ? 'bg-blue-50 border-blue-300' : ''
                          }`}
                          onClick={() => setSelectedProspect(prospect)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{prospect.nom}</div>
                              <div className="text-sm text-gray-500">
                                {prospect.contact_principal} • {prospect.ville}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {prospect.secteur}
                                </Badge>
                                <Badge 
                                  variant={
                                    prospect.statut === 'nouveau' ? 'default' :
                                    prospect.statut === 'qualifie' ? 'secondary' :
                                    'outline'
                                  } 
                                  className="text-xs"
                                >
                                  {prospect.statut}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < Math.floor(prospect.score / 2) 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {prospect.budget_estime}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setShowNewProspect(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Créer un nouveau prospect
                </Button>
              </CardContent>
            </Card>

            {/* Colonne centrale: Détails du prospect sélectionné */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">2. Informations prospect</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProspect ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedProspect.nom}</h3>
                      <p className="text-sm text-gray-500">{selectedProspect.secteur}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{selectedProspect.contact_principal}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{selectedProspect.telephone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{selectedProspect.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{selectedProspect.adresse}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span>Budget: {selectedProspect.budget_estime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span>{selectedProspect.taille_entreprise}</span>
                      </div>
                    </div>

                    {/* Besoins identifiés */}
                    {selectedProspect.besoins && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Besoins identifiés</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedProspect.besoins.map((besoin, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {besoin}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Notes</h4>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        {selectedProspect.notes}
                      </div>
                    </div>

                    {/* Historique */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Historique</h4>
                      <div className="space-y-2">
                        {selectedProspect.dernier_contact && (
                          <div className="text-sm">
                            <span className="text-gray-500">Dernier contact:</span>{' '}
                            {new Date(selectedProspect.dernier_contact).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                        {selectedProspect.prochain_contact && (
                          <div className="text-sm">
                            <span className="text-gray-500">Prochain contact prévu:</span>{' '}
                            <span className="font-medium text-orange-600">
                              {new Date(selectedProspect.prochain_contact).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Sélectionnez un prospect pour voir ses informations</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Colonne droite: Formulaire RDV */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">3. Planifier le rendez-vous</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); createRdv(); }} className="space-y-4">
                  {/* Commercial */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Commercial assigné *</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={selectedCommercial?.id || ""}
                      onChange={(e) => {
                        const commercial = commercials.find(c => c.id === e.target.value)
                        setSelectedCommercial(commercial || null)
                      }}
                      required
                    >
                      <option value="">Sélectionner un commercial</option>
                      {commercials.map(commercial => (
                        <option key={commercial.id} value={commercial.id}>
                          {commercial.nom} - {commercial.region} (Charge: {commercial.charge}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date et heure */}
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

                  {/* Créneaux disponibles du commercial */}
                  {selectedCommercial && selectedDate && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Créneaux disponibles
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedCommercial.disponibilites
                          .find(d => d.date === selectedDate)
                          ?.creneaux.map(creneau => (
                            <Button
                              key={creneau}
                              type="button"
                              size="sm"
                              variant={selectedTime === creneau ? "default" : "outline"}
                              onClick={() => setSelectedTime(creneau)}
                            >
                              {creneau}
                            </Button>
                          )) || (
                          <p className="text-sm text-gray-500">
                            Aucun créneau prédéfini pour cette date
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Type de visite et priorité */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Type de visite</label>
                      <select
                        className="w-full border rounded-md px-3 py-2"
                        value={typeVisite}
                        onChange={(e) => setTypeVisite(e.target.value as RDV['type_visite'])}
                      >
                        <option value="decouverte">🔍 Découverte</option>
                        <option value="presentation">📊 Présentation</option>
                        <option value="negociation">💼 Négociation</option>
                        <option value="signature">✍️ Signature</option>
                        <option value="suivi">📞 Suivi</option>
                        <option value="support">🛠️ Support</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Priorité</label>
                      <select
                        className="w-full border rounded-md px-3 py-2"
                        value={priorite}
                        onChange={(e) => setPriorite(e.target.value as RDV['priorite'])}
                      >
                        <option value="normale">🟢 Normale</option>
                        <option value="haute">🟡 Haute</option>
                        <option value="urgente">🔴 Urgente</option>
                      </select>
                    </div>
                  </div>

                  {/* Durée */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Durée estimée</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={duree}
                      onChange={(e) => setDuree(e.target.value)}
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">1 heure</option>
                      <option value="90">1h30</option>
                      <option value="120">2 heures</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Notes & Objectifs du RDV
                    </label>
                    <Textarea
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Objectifs, points à aborder, préparation nécessaire..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1" disabled={!selectedProspect || !selectedCommercial}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Planifier le RDV
                    </Button>
                    <Button type="button" variant="outline" onClick={resetRdvForm}>
                      Réinitialiser
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance commerciale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Taux de conversion</span>
                      <span className="text-sm font-bold">{stats.tauxConversion}%</span>
                    </div>
                    <Progress value={stats.tauxConversion} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Objectif CA mensuel</span>
                      <span className="text-sm font-bold">
                        {(stats.caPotentiel / 1000).toFixed(0)}k / 200k€
                      </span>
                    </div>
                    <Progress value={(stats.caPotentiel / 200000) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">RDV complétés ce mois</span>
                      <span className="text-sm font-bold">12 / 20</span>
                    </div>
                    <Progress value={60} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top prospects par score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prospects
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5)
                    .map(prospect => (
                      <div key={prospect.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{prospect.nom}</div>
                          <div className="text-xs text-gray-500">{prospect.ville}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {prospect.budget_estime}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(prospect.score / 2) 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal nouveau prospect */}
      {showNewProspect && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle>Créer un nouveau prospect</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Formulaire création prospect */}
              <form onSubmit={(e) => {
                e.preventDefault()
                // Logique de création
                setShowNewProspect(false)
              }} className="space-y-4">
                {/* Champs du formulaire... */}
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowNewProspect(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Créer le prospect</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal détails prospect */}
      {showProspectDetails && selectedProspect && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fiche complète - {selectedProspect.nom}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProspectDetails(false)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Détails complets du prospect */}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Composant ProspectCard
function ProspectCard({
  prospect,
  viewMode,
  onSelectForRdv,
  onViewDetails
}: {
  prospect: Prospect
  viewMode: 'grid' | 'list'
  onSelectForRdv: () => void
  onViewDetails: () => void
}) {
  const statusColor = {
    nouveau: 'bg-blue-100 text-blue-700',
    contacte: 'bg-yellow-100 text-yellow-700',
    qualifie: 'bg-green-100 text-green-700',
    'en-negociation': 'bg-purple-100 text-purple-700',
    signe: 'bg-emerald-100 text-emerald-700',
    perdu: 'bg-red-100 text-red-700'
  }[prospect.statut]

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{prospect.nom}</h4>
                  <Badge className={statusColor}>
                    {prospect.statut}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(prospect.score / 2) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {prospect.contact_principal}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {prospect.ville}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {prospect.telephone}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {prospect.budget_estime}
                  </span>
                </div>
                {prospect.prochain_contact && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Rappel: {new Date(prospect.prochain_contact).toLocaleDateString('fr-FR')}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onViewDetails}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={onSelectForRdv}>
                <Calendar className="h-4 w-4 mr-1" />
                RDV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold">{prospect.nom}</h4>
            <p className="text-sm text-muted-foreground">{prospect.secteur}</p>
          </div>
          <Badge className={statusColor}>
            {prospect.statut}
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{prospect.contact_principal}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{prospect.ville}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{prospect.telephone}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{prospect.budget_estime}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 my-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(prospect.score / 2) 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        
        {prospect.prochain_contact && (
          <Alert className="p-2 mb-3">
            <AlertDescription className="text-xs">
              <Clock className="h-3 w-3 inline mr-1" />
              Rappel: {new Date(prospect.prochain_contact).toLocaleDateString('fr-FR')}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={onViewDetails}>
            <Eye className="h-4 w-4 mr-1" />
            Détails
          </Button>
          <Button size="sm" className="flex-1" onClick={onSelectForRdv}>
            <Calendar className="h-4 w-4 mr-1" />
            RDV
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
