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

// Types basés sur la vraie structure de la base de données
interface Prospect {
  id: number
  nom: string
  email: string
  telephone: string
  adresse: string
  ville: string
  code_postal?: string
  pays?: string
  secteur: string
  statut: 'nouveau' | 'contacte' | 'qualifie' | 'en-negociation' | 'signe' | 'perdu'
  score?: number
  notes?: string
  created_at?: string
  updated_at?: string
  // Champs additionnels pour enrichir les données
  contact_principal?: string
  budget_estime?: string
  ca_potentiel?: number
  taille_entreprise?: string
  dernier_contact?: string
  prochain_contact?: string
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
  statut?: 'planifie' | 'confirme' | 'en-cours' | 'termine' | 'annule' | 'reporte'
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
  charge: number
}

// Commerciaux disponibles (à remplacer par une vraie API si disponible)
const commercials: Commercial[] = [
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
  },
  {
    id: "3",
    nom: "M. Bernard",
    region: "PACA",
    disponibilites: [],
    rdv_jour: 3,
    charge: 50
  },
  {
    id: "4",
    nom: "Mme Roux",
    region: "Grand Est",
    disponibilites: [],
    rdv_jour: 4,
    charge: 65
  }
]

export default function RdvCompletSection() {
  // États principaux - Utilisation des vraies données de la base
  const [prospects, setProspects] = React.useState<Prospect[]>([])
  const [rdvs, setRdvs] = React.useState<RDV[]>([])
  const [loading, setLoading] = React.useState(true)
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
  
  // États pour le formulaire nouveau prospect
  const [newProspect, setNewProspect] = React.useState<Partial<Prospect>>({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    code_postal: '',
    pays: 'France',
    secteur: 'Santé',
    statut: 'nouveau',
    notes: ''
  })
  
  const { toast } = useToast()
  const today = new Date().toISOString().split("T")[0]

  // Chargement des données depuis la vraie base de données
  async function loadProspects() {
    try {
      console.log('Chargement des prospects...')
      const response = await fetch('/api/prospects', { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' 
      })
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Prospects reçus:', data)
      
      if (Array.isArray(data)) {
        // Enrichir les données avec des valeurs par défaut si nécessaire
        const enrichedProspects = data.map((p: Prospect) => ({
          ...p,
          score: p.score || Math.floor(Math.random() * 10) + 1, // Score aléatoire si pas défini
          ca_potentiel: p.ca_potentiel || Math.floor(Math.random() * 100000) + 10000
        }))
        setProspects(enrichedProspects)
        console.log(`${enrichedProspects.length} prospects chargés`)
      } else {
        console.warn('Les données reçues ne sont pas un tableau:', data)
        setProspects([])
      }
    } catch (error) {
      console.error('Erreur détaillée chargement prospects:', error)
      toast({
        title: "Erreur de connexion",
        description: "Impossible de charger les prospects. Vérifiez votre connexion.",
        variant: "destructive"
      })
      // Données de démonstration si l'API ne fonctionne pas
      setProspects([
        {
          id: 1,
          nom: "Exemple Clinique Saint-Martin",
          email: "contact@exemple.fr",
          telephone: "+33 1 23 45 67 89",
          adresse: "123 rue Exemple",
          ville: "Paris",
          code_postal: "75001",
          secteur: "Santé",
          statut: "nouveau",
          notes: "Prospect de démonstration"
        },
        {
          id: 2,
          nom: "Exemple EHPAD Les Jardins",
          email: "info@exemple2.fr",
          telephone: "+33 1 98 76 54 32",
          adresse: "456 avenue Test",
          ville: "Lyon",
          code_postal: "69001",
          secteur: "Senior",
          statut: "qualifie",
          notes: "Second prospect de démonstration"
        }
      ])
    }
  }

  async function loadRdvs() {
    try {
      console.log('Chargement des RDV...')
      const response = await fetch('/api/rdv', { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' 
      })
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('RDV reçus:', data)
      
      if (Array.isArray(data)) {
        // Enrichir les RDV avec les données prospects
        const enrichedRdvs = data.map((rdv: RDV) => ({
          ...rdv,
          prospect: prospects.find(p => p.id === rdv.prospect_id)
        }))
        setRdvs(enrichedRdvs)
        console.log(`${enrichedRdvs.length} RDV chargés`)
      } else {
        console.warn('Les données RDV reçues ne sont pas un tableau:', data)
        setRdvs([])
      }
    } catch (error) {
      console.error('Erreur détaillée chargement RDV:', error)
      setRdvs([])
    }
  }

  // Chargement initial
  React.useEffect(() => {
    async function loadData() {
      setLoading(true)
      await loadProspects()
      setLoading(false)
    }
    loadData()
  }, [])

  // Charger les RDV quand les prospects sont chargés
  React.useEffect(() => {
    if (prospects.length > 0) {
      loadRdvs()
    }
  }, [prospects])

  // Actualiser périodiquement les données
  React.useEffect(() => {
    const interval = setInterval(() => {
      loadProspects()
      loadRdvs()
    }, 30000) // Toutes les 30 secondes

    return () => clearInterval(interval)
  }, [])

  // Filtrage des prospects
  const filteredProspects = React.useMemo(() => {
    let filtered = [...prospects]
    
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.secteur.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.telephone && p.telephone.includes(searchTerm))
      )
    }
    
    if (filterSecteur !== 'all') {
      filtered = filtered.filter(p => p.secteur === filterSecteur)
    }
    
    if (filterStatut !== 'all') {
      filtered = filtered.filter(p => p.statut === filterStatut)
    }
    
    if (filterScore !== 'all') {
      const score = p.score || 5
      if (filterScore === 'high') filtered = filtered.filter(p => score >= 8)
      else if (filterScore === 'medium') filtered = filtered.filter(p => score >= 5 && score < 8)
      else if (filterScore === 'low') filtered = filtered.filter(p => score < 5)
    }
    
    // Tri par score décroissant (ou par date de création si pas de score)
    filtered.sort((a, b) => {
      if (a.score && b.score) return b.score - a.score
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
    
    return filtered
  }, [prospects, searchTerm, filterSecteur, filterStatut, filterScore])

  // Suggestions intelligentes de prospects à contacter
  const suggestedProspects = React.useMemo(() => {
    return prospects
      .filter(p => {
        // Prospects nouveaux ou qualifiés non contactés récemment
        return (p.statut === 'nouveau' || p.statut === 'qualifie') && p.statut !== 'signe' && p.statut !== 'perdu'
      })
      .sort((a, b) => {
        const scoreA = a.score || 5
        const scoreB = b.score || 5
        return scoreB - scoreA
      })
      .slice(0, 5)
  }, [prospects])

  // Extraction des secteurs uniques depuis les vrais données
  const secteurs = React.useMemo(() => {
    const uniqueSecteurs = [...new Set(prospects.map(p => p.secteur).filter(Boolean))]
    return uniqueSecteurs
  }, [prospects])

  // Statistiques basées sur les vraies données
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
        date_time: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
        type_visite: typeVisite,
        priorite: priorite,
        duree_min: parseInt(duree),
        notes: notes || '',
        statut: 'planifie'
      }

      console.log('Création RDV avec données:', rdvData)

      const response = await fetch('/api/rdv', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rdvData)
      })

      console.log('Réponse création RDV:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erreur API:', errorText)
        throw new Error(`Erreur création RDV: ${response.status}`)
      }

      const createdRdv = await response.json()
      console.log('RDV créé:', createdRdv)

      // Ajouter le RDV localement immédiatement pour feedback rapide
      const newRdv = {
        ...rdvData,
        id: createdRdv.id || Date.now(),
        prospect: selectedProspect
      }
      setRdvs(prev => [...prev, newRdv])
      
      // Mettre à jour le statut du prospect si nécessaire
      if (selectedProspect.statut === 'nouveau') {
        try {
          await fetch(`/api/prospects/${selectedProspect.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut: 'contacte' })
          })
          // Mettre à jour localement
          setProspects(prev => prev.map(p => 
            p.id === selectedProspect.id 
              ? { ...p, statut: 'contacte' }
              : p
          ))
        } catch (error) {
          console.error('Erreur mise à jour prospect:', error)
        }
      }

      toast({ 
        title: "✅ RDV planifié avec succès", 
        description: `RDV avec ${selectedProspect.nom} le ${new Date(selectedDate).toLocaleDateString('fr-FR')} à ${selectedTime}`
      })

      resetRdvForm()
      
      // Recharger les données après un délai
      setTimeout(() => {
        loadRdvs()
      }, 1000)
      
    } catch (error) {
      console.error('Erreur complète création RDV:', error)
      toast({ 
        title: "Erreur de création", 
        description: "Impossible de créer le RDV. Vérifiez les données et réessayez.",
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
  async function createProspect(e: React.FormEvent) {
    e.preventDefault()
    
    if (!newProspect.nom || !newProspect.email || !newProspect.telephone) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez remplir tous les champs obligatoires (nom, email, téléphone)",
        variant: "destructive"
      })
      return
    }

    try {
      console.log('Création prospect avec données:', newProspect)
      
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProspect,
          statut: newProspect.statut || 'nouveau'
        })
      })

      console.log('Réponse création prospect:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erreur API prospect:', errorText)
        throw new Error(`Erreur: ${response.status}`)
      }

      const createdProspect = await response.json()
      console.log('Prospect créé:', createdProspect)
      
      // Ajouter localement pour feedback immédiat
      setProspects(prev => [...prev, createdProspect])
      
      toast({ 
        title: "✅ Prospect créé avec succès", 
        description: `${newProspect.nom} a été ajouté à la base`
      })

      setShowNewProspect(false)
      setNewProspect({
        nom: '',
        email: '',
        telephone: '',
        adresse: '',
        ville: '',
        code_postal: '',
        pays: 'France',
        secteur: 'Santé',
        statut: 'nouveau',
        notes: ''
      })
      
      // Recharger après un délai
      setTimeout(() => {
        loadProspects()
      }, 1000)
      
    } catch (error) {
      console.error('Erreur complète création prospect:', error)
      toast({ 
        title: "Erreur de création", 
        description: "Impossible de créer le prospect. Vérifiez votre connexion et les données.",
        variant: "destructive"
      })
    }
  }

  // Supprimer un RDV
  async function deleteRdv(rdvId: number) {
    try {
      const response = await fetch(`/api/rdv?id=${rdvId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erreur suppression RDV')

      await loadRdvs()
      toast({ 
        title: "✅ RDV supprimé", 
        description: "Le rendez-vous a été supprimé"
      })
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Impossible de supprimer le RDV",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    )
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
              {prospects.length > 0 
                ? `${prospects.length} prospects dans la base • ${rdvs.length} RDV planifiés`
                : "Connexion à la base de données..."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={async () => {
                setLoading(true)
                await loadProspects()
                await loadRdvs()
                setLoading(false)
                toast({
                  title: "✅ Données actualisées",
                  description: `${prospects.length} prospects et ${rdvs.length} RDV chargés`
                })
              }}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
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
            <strong className="text-amber-900">Prospects prioritaires :</strong>{' '}
            <span className="text-amber-800">
              {suggestedProspects.length} prospect(s) à contacter : {' '}
              {suggestedProspects.slice(0, 3).map(p => p.nom).join(', ')}
              {suggestedProspects.length > 3 && '...'}
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
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Tab Planning */}
        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Planning de la semaine</CardTitle>
              <CardDescription>
                Vue d'ensemble des RDV planifiés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* RDV du jour et à venir */}
              <div className="space-y-4">
                <h4 className="font-semibold">Prochains rendez-vous</h4>
                <div className="space-y-2">
                  {rdvs
                    .filter(r => new Date(r.date_time) >= new Date())
                    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
                    .slice(0, 10)
                    .map(rdv => (
                      <div key={rdv.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-sm font-bold">
                              {new Date(rdv.date_time).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short'
                              })}
                            </div>
                            <div className="text-lg">
                              {new Date(rdv.date_time).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{rdv.prospect?.nom || rdv.titre}</div>
                            <div className="text-sm text-gray-500">
                              {rdv.commercial} • {rdv.type_visite} • {rdv.duree_min} min
                            </div>
                            {rdv.prospect && (
                              <div className="text-xs text-gray-400">
                                {rdv.prospect.ville} • {rdv.prospect.secteur}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            rdv.priorite === 'urgente' ? 'destructive' : 
                            rdv.priorite === 'haute' ? 'default' : 
                            'secondary'
                          }>
                            {rdv.priorite}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => deleteRdv(rdv.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  
                  {rdvs.filter(r => new Date(r.date_time) >= new Date()).length === 0 && (
                    <p className="text-center text-gray-500 py-4">Aucun rendez-vous planifié</p>
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
                    placeholder="Rechercher un prospect (nom, ville, email, téléphone)..."
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
                    {secteurs.map(secteur => (
                      <option key={secteur} value={secteur}>{secteur}</option>
                    ))}
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
              
              {filteredProspects.length !== prospects.length && (
                <Alert className="mt-4">
                  <AlertDescription>
                    {filteredProspects.length} résultat(s) sur {prospects.length} prospects
                  </AlertDescription>
                </Alert>
              )}
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
                <p className="text-muted-foreground">
                  {searchTerm || filterSecteur !== 'all' || filterStatut !== 'all' 
                    ? "Aucun prospect ne correspond à vos critères"
                    : "Aucun prospect dans la base de données"}
                </p>
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
                              {prospect.statut}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Liste complète des prospects */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Tous les prospects ({prospects.length})</h4>
                  <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-2">
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
                                {prospect.ville} • {prospect.telephone}
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
                          </div>
                        </div>
                      ))}
                    
                    {prospects.filter(p => p.statut !== 'signe' && p.statut !== 'perdu').length === 0 && (
                      <p className="text-center text-gray-500 py-4">
                        Aucun prospect disponible pour un RDV
                      </p>
                    )}
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
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{selectedProspect.telephone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="break-all">{selectedProspect.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{selectedProspect.adresse}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span>{selectedProspect.ville} {selectedProspect.code_postal}</span>
                      </div>
                    </div>

                    {/* Statut actuel */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Statut actuel</h4>
                      <Badge 
                        variant={
                          selectedProspect.statut === 'nouveau' ? 'default' :
                          selectedProspect.statut === 'qualifie' ? 'secondary' :
                          selectedProspect.statut === 'en-negociation' ? 'default' :
                          'outline'
                        }
                      >
                        {selectedProspect.statut}
                      </Badge>
                    </div>

                    {/* Notes */}
                    {selectedProspect.notes && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Notes</h4>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm">
                          {selectedProspect.notes}
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="text-xs text-gray-500">
                      {selectedProspect.created_at && (
                        <p>Créé le {new Date(selectedProspect.created_at).toLocaleDateString('fr-FR')}</p>
                      )}
                      {selectedProspect.updated_at && (
                        <p>Modifié le {new Date(selectedProspect.updated_at).toLocaleDateString('fr-FR')}</p>
                      )}
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
                      <span className="text-sm">Prospects qualifiés</span>
                      <span className="text-sm font-bold">
                        {prospects.filter(p => p.statut === 'qualifie').length} / {stats.totalProspects}
                      </span>
                    </div>
                    <Progress value={(prospects.filter(p => p.statut === 'qualifie').length / stats.totalProspects) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">RDV réalisés ce mois</span>
                      <span className="text-sm font-bold">
                        {rdvs.filter(r => r.statut === 'termine').length} / {rdvs.length}
                      </span>
                    </div>
                    <Progress value={rdvs.length > 0 ? (rdvs.filter(r => r.statut === 'termine').length / rdvs.length) * 100 : 0} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Répartition par statut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['nouveau', 'contacte', 'qualifie', 'en-negociation', 'signe', 'perdu'].map(statut => {
                    const count = prospects.filter(p => p.statut === statut).length
                    const percentage = stats.totalProspects > 0 ? Math.round((count / stats.totalProspects) * 100) : 0
                    
                    return (
                      <div key={statut} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              statut === 'nouveau' ? 'default' :
                              statut === 'qualifie' ? 'secondary' :
                              statut === 'signe' ? 'success' :
                              statut === 'perdu' ? 'destructive' :
                              'outline'
                            }
                            className="text-xs"
                          >
                            {statut}
                          </Badge>
                          <span className="text-sm">{count} prospects</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="w-20" />
                          <span className="text-xs text-gray-500 w-10">{percentage}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal nouveau prospect */}
      {showNewProspect && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Créer un nouveau prospect</CardTitle>
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
                      required
                    >
                      <option value="Santé">Santé</option>
                      <option value="Senior">Senior</option>
                      <option value="Médical">Médical</option>
                      <option value="Pharmacie">Pharmacie</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <Input
                      type="email"
                      value={newProspect.email}
                      onChange={(e) => setNewProspect({...newProspect, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone *</label>
                    <Input
                      value={newProspect.telephone}
                      onChange={(e) => setNewProspect({...newProspect, telephone: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Adresse</label>
                  <Input
                    value={newProspect.adresse}
                    onChange={(e) => setNewProspect({...newProspect, adresse: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ville</label>
                    <Input
                      value={newProspect.ville}
                      onChange={(e) => setNewProspect({...newProspect, ville: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Code postal</label>
                    <Input
                      value={newProspect.code_postal}
                      onChange={(e) => setNewProspect({...newProspect, code_postal: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Pays</label>
                    <Input
                      value={newProspect.pays}
                      onChange={(e) => setNewProspect({...newProspect, pays: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <Textarea
                    rows={3}
                    value={newProspect.notes}
                    onChange={(e) => setNewProspect({...newProspect, notes: e.target.value})}
                    placeholder="Informations complémentaires..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowNewProspect(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Créer le prospect
                  </Button>
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Entreprise</h4>
                  <p className="font-semibold">{selectedProspect.nom}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Secteur</h4>
                  <p>{selectedProspect.secteur}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Email</h4>
                  <p className="break-all">{selectedProspect.email}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Téléphone</h4>
                  <p>{selectedProspect.telephone}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Adresse</h4>
                  <p>{selectedProspect.adresse}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Ville</h4>
                  <p>{selectedProspect.ville} {selectedProspect.code_postal}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Statut</h4>
                  <Badge>{selectedProspect.statut}</Badge>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Score</h4>
                  <p>{selectedProspect.score || 'Non défini'}</p>
                </div>
              </div>
              
              {selectedProspect.notes && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Notes</h4>
                  <p className="bg-gray-50 p-3 rounded-lg">{selectedProspect.notes}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => {
                  setSelectedProspect(selectedProspect)
                  setShowProspectDetails(false)
                  setActiveTab("nouveau-rdv")
                }}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Planifier un RDV
                </Button>
              </div>
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
                  <Badge variant="outline">
                    {prospect.secteur}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {prospect.ville}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {prospect.telephone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {prospect.email}
                  </span>
                </div>
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
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{prospect.ville} {prospect.code_postal}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{prospect.telephone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{prospect.email}</span>
          </div>
        </div>
        
        {prospect.notes && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 line-clamp-2">
            {prospect.notes}
          </div>
        )}
        
        <div className="flex gap-2 mt-4">
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
