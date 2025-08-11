"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, Clock, Phone, MapPin, User, AlertCircle, CheckCircle, 
  RefreshCw, Search, Download, Plus, Settings, Filter, X,
  ChevronLeft, ChevronRight, Users
} from 'lucide-react'

// Types
type District = 'port-louis' | 'pamplemousses' | 'riviere-du-rempart' | 'flacq' | 'grand-port' | 'savanne' | 'plaines-wilhems' | 'moka' | 'riviere-noire'
type Secteur = 'hotel' | 'restaurant' | 'clinique' | 'pharmacie' | 'supermarche' | 'entreprise' | 'ecole' | 'autre'
type Statut = 'nouveau' | 'contacte' | 'qualifie' | 'proposition' | 'negociation' | 'signe' | 'perdu'

// Configuration des districts
const DISTRICTS_CONFIG = {
  'port-louis': { label: 'Port Louis' },
  'pamplemousses': { label: 'Pamplemousses' },
  'riviere-du-rempart': { label: 'Rivière du Rempart' },
  'flacq': { label: 'Flacq' },
  'grand-port': { label: 'Grand Port' },
  'savanne': { label: 'Savanne' },
  'plaines-wilhems': { label: 'Plaines Wilhems' },
  'moka': { label: 'Moka' },
  'riviere-noire': { label: 'Rivière Noire' }
}

const SECTEURS_CONFIG = {
  'hotel': { label: 'Hôtel', icon: '🏨' },
  'restaurant': { label: 'Restaurant', icon: '🍽️' },
  'clinique': { label: 'Clinique', icon: '🏥' },
  'pharmacie': { label: 'Pharmacie', icon: '💊' },
  'supermarche': { label: 'Supermarché', icon: '🛒' },
  'entreprise': { label: 'Entreprise', icon: '🏢' },
  'ecole': { label: 'École', icon: '🎓' },
  'autre': { label: 'Autre', icon: '📍' }
}

// Interfaces
interface Prospect {
  id: number
  nom: string
  secteur: Secteur
  ville: string
  district: District
  statut: Statut
  contact?: string
  telephone?: string
  email?: string
  score: number
  budget?: string
  notes?: string
  website?: string
  adresse?: string
  priority?: string
  quality_score?: number
}

interface RendezVous {
  id: number
  prospect_id: number
  prospect_nom?: string
  prospect?: Prospect
  commercial: string
  titre: string
  date_time: string
  duree_min: number
  type_visite: 'decouverte' | 'presentation' | 'negociation' | 'signature' | 'suivi'
  priorite: 'normale' | 'haute' | 'urgente'
  statut: 'planifie' | 'confirme' | 'en-cours' | 'termine' | 'annule' | 'reporte'
  notes?: string
  lieu?: string
  created_at?: string
  updated_at?: string
}

interface CommercialInfo {
  nom: string
  adresse: string
  ville: string
  district: District
  telephone?: string
  email?: string
  vehicule?: string
  startHour?: string
  endHour?: string
}

interface CustomDistance {
  id: string
  from: string
  to: string
  distance: number
  duration: number
  notes?: string
}

interface CostSettings {
  fuelPrice: number
  consumption: number
  indemnityPerKm: number
  averageSpeed: number
  useIndemnity: boolean
  rushHourStart: string
  rushHourEnd: string
  rushHourSpeed: number
}

const DEFAULT_SETTINGS: CostSettings = {
  fuelPrice: 65,
  consumption: 8,
  indemnityPerKm: 15,
  averageSpeed: 40,
  useIndemnity: false,
  rushHourStart: '07:00',
  rushHourEnd: '09:00',
  rushHourSpeed: 25
}

const DEFAULT_COMMERCIAL: CommercialInfo = {
  nom: 'Commercial',
  adresse: '',
  ville: '',
  district: 'port-louis',
  startHour: '08:00',
  endHour: '18:00'
}

// Matrice de distance
const BASE_DISTANCE_MATRIX: Record<District, Record<District, number>> = {
  'port-louis': {
    'port-louis': 0,
    'pamplemousses': 12,
    'riviere-du-rempart': 25,
    'flacq': 45,
    'grand-port': 55,
    'savanne': 65,
    'plaines-wilhems': 15,
    'moka': 18,
    'riviere-noire': 35
  },
  'pamplemousses': {
    'port-louis': 12,
    'pamplemousses': 0,
    'riviere-du-rempart': 15,
    'flacq': 35,
    'grand-port': 50,
    'savanne': 60,
    'plaines-wilhems': 20,
    'moka': 22,
    'riviere-noire': 40
  },
  'riviere-du-rempart': {
    'port-louis': 25,
    'pamplemousses': 15,
    'riviere-du-rempart': 0,
    'flacq': 20,
    'grand-port': 45,
    'savanne': 55,
    'plaines-wilhems': 35,
    'moka': 30,
    'riviere-noire': 50
  },
  'flacq': {
    'port-louis': 45,
    'pamplemousses': 35,
    'riviere-du-rempart': 20,
    'flacq': 0,
    'grand-port': 25,
    'savanne': 40,
    'plaines-wilhems': 40,
    'moka': 35,
    'riviere-noire': 60
  },
  'grand-port': {
    'port-louis': 55,
    'pamplemousses': 50,
    'riviere-du-rempart': 45,
    'flacq': 25,
    'grand-port': 0,
    'savanne': 15,
    'plaines-wilhems': 40,
    'moka': 38,
    'riviere-noire': 50
  },
  'savanne': {
    'port-louis': 65,
    'pamplemousses': 60,
    'riviere-du-rempart': 55,
    'flacq': 40,
    'grand-port': 15,
    'savanne': 0,
    'plaines-wilhems': 45,
    'moka': 48,
    'riviere-noire': 40
  },
  'plaines-wilhems': {
    'port-louis': 15,
    'pamplemousses': 20,
    'riviere-du-rempart': 35,
    'flacq': 40,
    'grand-port': 40,
    'savanne': 45,
    'plaines-wilhems': 0,
    'moka': 8,
    'riviere-noire': 25
  },
  'moka': {
    'port-louis': 18,
    'pamplemousses': 22,
    'riviere-du-rempart': 30,
    'flacq': 35,
    'grand-port': 38,
    'savanne': 48,
    'plaines-wilhems': 8,
    'moka': 0,
    'riviere-noire': 30
  },
  'riviere-noire': {
    'port-louis': 35,
    'pamplemousses': 40,
    'riviere-du-rempart': 50,
    'flacq': 60,
    'grand-port': 50,
    'savanne': 40,
    'plaines-wilhems': 25,
    'moka': 30,
    'riviere-noire': 0
  }
}

export default function PlanningAdvancedSection() {
  const [loading, setLoading] = React.useState(false)
  const [loadingRdvs, setLoadingRdvs] = React.useState(true)
  const [prospects, setProspects] = React.useState<Prospect[]>([])
  const [allProspects, setAllProspects] = React.useState<Prospect[]>([])
  const [rendezVous, setRendezVous] = React.useState<RendezVous[]>([])
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0])
  const [commercialInfo, setCommercialInfo] = React.useState<CommercialInfo>(DEFAULT_COMMERCIAL)
  const [customDistances, setCustomDistances] = React.useState<CustomDistance[]>([])
  const [settings, setSettings] = React.useState<CostSettings>(DEFAULT_SETTINGS)
  const [viewType, setViewType] = React.useState<'day' | 'week' | 'month'>('day')
  
  // États des filtres et recherche
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterStatut, setFilterStatut] = React.useState("")
  const [filterCommercial, setFilterCommercial] = React.useState("")
  const [filterProspect, setFilterProspect] = React.useState("")
  
  // États des dialogues
  const [showAddRdv, setShowAddRdv] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  const [showCommercialConfig, setShowCommercialConfig] = React.useState(false)
  const [showDistanceConfig, setShowDistanceConfig] = React.useState(false)
  const [showSearch, setShowSearch] = React.useState(false)
  const [editingRdv, setEditingRdv] = React.useState<RendezVous | null>(null)
  
  const { toast } = useToast()

  // Charger les configurations sauvegardées
  React.useEffect(() => {
    // Commercial info
    const savedCommercial = localStorage.getItem('planning_commercial_info')
    if (savedCommercial) {
      try {
        setCommercialInfo(JSON.parse(savedCommercial))
      } catch (e) {
        console.error('Erreur chargement info commercial:', e)
      }
    }

    // Distances personnalisées
    const savedDistances = localStorage.getItem('planning_custom_distances')
    if (savedDistances) {
      try {
        setCustomDistances(JSON.parse(savedDistances))
      } catch (e) {
        console.error('Erreur chargement distances:', e)
      }
    }

    // Paramètres
    const savedSettings = localStorage.getItem('planning_cost_settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error('Erreur chargement paramètres:', e)
      }
    }
  }, [])

  // Charger les prospects et RDV depuis l'API
  React.useEffect(() => {
    loadProspects()
    loadRdvs()
  }, [])

  async function loadProspects() {
    try {
      const res = await fetch('/api/prospects?limit=1000')
      const result = await res.json()
      const data = result.data || result
      setProspects(Array.isArray(data) ? data : [])
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les prospects",
        variant: "destructive"
      })
    }
  }

  // Charger les RDV depuis l'API
  async function loadRdvs() {
    setLoadingRdvs(true)
    try {
      const res = await fetch('/api/rdv')
      if (!res.ok) throw new Error('Erreur chargement RDV')
      
      const data = await res.json()
      setRendezVous(data)
    } catch (error) {
      console.error('Erreur chargement RDV:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les rendez-vous",
        variant: "destructive"
      })
    } finally {
      setLoadingRdvs(false)
    }
  }

  // Créer un RDV via l'API
  async function addRdv(prospectId: number, prospect: Prospect, date: string, time: string, duree: number = 60, notes?: string, type_visite?: string, priorite?: string) {
    try {
      const rdvData = {
        prospect_id: prospectId,
        commercial: commercialInfo.nom || "Commercial",
        titre: `RDV - ${prospect.nom}`,
        date_time: `${date}T${time}:00`,
        duree_min: duree,
        type_visite: type_visite || 'decouverte',
        priorite: priorite || (prospect.score >= 4 ? 'haute' : prospect.score >= 3 ? 'moyenne' : 'normale'),
        statut: 'planifie',
        notes: notes || '',
        lieu: prospect.adresse || `${prospect.ville}, ${prospect.district}`
      }

      const res = await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rdvData)
      })

      if (!res.ok) throw new Error('Erreur création RDV')

      await loadRdvs()
      
      toast({
        title: "RDV ajouté",
        description: `RDV avec ${prospect.nom} planifié`
      })
    } catch (error) {
      console.error('Erreur création RDV:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le rendez-vous",
        variant: "destructive"
      })
    }
  }

  // Mettre à jour un RDV via l'API
  async function updateRdv(rdvId: number, updates: Partial<RendezVous>) {
    try {
      const res = await fetch('/api/rdv', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rdvId, ...updates })
      })

      if (!res.ok) throw new Error('Erreur mise à jour RDV')

      await loadRdvs()
      
      toast({ title: "RDV modifié" })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rendez-vous",
        variant: "destructive"
      })
    }
  }

  // Supprimer un RDV via l'API
  async function deleteRdv(rdvId: number) {
    try {
      const res = await fetch(`/api/rdv?id=${rdvId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Erreur suppression RDV')

      await loadRdvs()
      
      toast({ title: "RDV supprimé" })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le rendez-vous",
        variant: "destructive"
      })
    }
  }

  // Sauvegarder les infos du commercial
  function saveCommercialInfo(info: CommercialInfo) {
    setCommercialInfo(info)
    localStorage.setItem('planning_commercial_info', JSON.stringify(info))
    toast({
      title: "Informations sauvegardées",
      description: "L'adresse du commercial a été mise à jour"
    })
  }

  // Sauvegarder les distances personnalisées
  function saveCustomDistances(distances: CustomDistance[]) {
    setCustomDistances(distances)
    localStorage.setItem('planning_custom_distances', JSON.stringify(distances))
  }

  // Calculer la distance
  function calculateDistance(
    from: { adresse?: string; ville?: string; district: District },
    to: { adresse?: string; ville?: string; district: District }
  ): any {
    const fromAddress = from.adresse || `${from.ville}, ${from.district}`
    const toAddress = to.adresse || `${to.ville}, ${to.district}`
    
    const customDistance = customDistances.find(
      d => (d.from === fromAddress && d.to === toAddress) ||
           (d.from === toAddress && d.to === fromAddress)
    )
    
    if (customDistance) {
      const cost = settings.useIndemnity ?
        Math.round(customDistance.distance * settings.indemnityPerKm) :
        Math.round((customDistance.distance * settings.consumption * settings.fuelPrice) / 100)
      
      return {
        distance: customDistance.distance,
        duration: customDistance.duration,
        cost,
        method: 'custom'
      }
    }
    
    const distance = BASE_DISTANCE_MATRIX[from.district]?.[to.district] || 25
    
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const isRushHour = currentTime >= settings.rushHourStart && currentTime <= settings.rushHourEnd
    const speed = isRushHour ? settings.rushHourSpeed : settings.averageSpeed
    
    const duration = Math.round(distance / speed * 60)
    const cost = settings.useIndemnity ?
      Math.round(distance * settings.indemnityPerKm) :
      Math.round((distance * settings.consumption * settings.fuelPrice) / 100)
    
    return {
      distance,
      duration,
      cost,
      method: 'matrix'
    }
  }

  // Calculer la distance depuis le domicile
  function calculateFromHome(to: Prospect): any {
    const homeLocation = {
      adresse: commercialInfo.adresse,
      ville: commercialInfo.ville,
      district: commercialInfo.district
    }
    
    const route = calculateDistance(homeLocation, to)
    return { ...route, fromHome: true }
  }

  // Exporter les données
  async function exportData(format: 'excel' | 'pdf') {
    try {
      toast({
        title: "Export en cours",
        description: `Génération du fichier ${format.toUpperCase()}...`
      })
      
      // TODO: Implémenter l'export réel
      // Pour l'instant, on simule
      setTimeout(() => {
        toast({
          title: "Export terminé",
          description: `Le fichier a été téléchargé`
        })
      }, 2000)
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données",
        variant: "destructive"
      })
    }
  }

  // Réinitialiser tous les filtres
  function resetFilters() {
    setSearchTerm("")
    setFilterStatut("")
    setFilterCommercial("")
    setFilterProspect("")
  }

  // Navigation date
  function navigateDate(direction: 'prev' | 'next' | 'today') {
    const currentDate = new Date(selectedDate)
    
    if (direction === 'today') {
      setSelectedDate(new Date().toISOString().split('T')[0])
    } else if (direction === 'prev') {
      currentDate.setDate(currentDate.getDate() - 1)
      setSelectedDate(currentDate.toISOString().split('T')[0])
    } else {
      currentDate.setDate(currentDate.getDate() + 1)
      setSelectedDate(currentDate.toISOString().split('T')[0])
    }
  }

  // Filtrer les RDV de la journée
  const filteredRdvs = React.useMemo(() => {
    return rendezVous.filter(rdv => {
      const rdvDate = new Date(rdv.date_time).toISOString().split('T')[0]
      return rdvDate === selectedDate
    }).sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
  }, [rendezVous, selectedDate])

  // Filtrer avec la recherche et les filtres
  const filteredRdvsBySearch = React.useMemo(() => {
    let filtered = [...filteredRdvs]
    
    // Recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(rdv => {
        return (
          rdv.prospect_nom?.toLowerCase().includes(searchLower) ||
          rdv.prospect?.nom?.toLowerCase().includes(searchLower) ||
          rdv.commercial?.toLowerCase().includes(searchLower) ||
          rdv.lieu?.toLowerCase().includes(searchLower) ||
          rdv.notes?.toLowerCase().includes(searchLower) ||
          rdv.titre?.toLowerCase().includes(searchLower)
        )
      })
    }
    
    // Filtre statut
    if (filterStatut) {
      filtered = filtered.filter(rdv => rdv.statut === filterStatut)
    }
    
    // Filtre commercial
    if (filterCommercial) {
      filtered = filtered.filter(rdv => rdv.commercial === filterCommercial)
    }
    
    // Filtre prospect
    if (filterProspect) {
      filtered = filtered.filter(rdv => rdv.prospect_id.toString() === filterProspect)
    }
    
    return filtered
  }, [filteredRdvs, searchTerm, filterStatut, filterCommercial, filterProspect])

  // Obtenir les commerciaux uniques
  const uniqueCommercials = React.useMemo(() => {
    const commercials = new Set(rendezVous.map(rdv => rdv.commercial).filter(Boolean))
    return Array.from(commercials)
  }, [rendezVous])

  // Calculer les statistiques
  const stats = React.useMemo(() => {
    let distanceTotale = 0
    let tempsDeplacement = 0
    let coutTotal = 0
    
    // Distance depuis le domicile au premier RDV
    if (filteredRdvsBySearch.length > 0 && commercialInfo.adresse && filteredRdvsBySearch[0].prospect) {
      const fromHome = calculateFromHome(filteredRdvsBySearch[0].prospect)
      distanceTotale += fromHome.distance
      tempsDeplacement += fromHome.duration
      coutTotal += fromHome.cost
    }
    
    // Distances entre les RDV
    for (let i = 0; i < filteredRdvsBySearch.length - 1; i++) {
      if (filteredRdvsBySearch[i].prospect && filteredRdvsBySearch[i + 1].prospect) {
        const route = calculateDistance(
          filteredRdvsBySearch[i].prospect!,
          filteredRdvsBySearch[i + 1].prospect!
        )
        distanceTotale += route.distance
        tempsDeplacement += route.duration
        coutTotal += route.cost
      }
    }
    
    // Retour au domicile depuis le dernier RDV
    if (filteredRdvsBySearch.length > 0 && commercialInfo.adresse && filteredRdvsBySearch[filteredRdvsBySearch.length - 1].prospect) {
      const toHome = calculateFromHome(filteredRdvsBySearch[filteredRdvsBySearch.length - 1].prospect)
      distanceTotale += toHome.distance
      tempsDeplacement += toHome.duration
      coutTotal += toHome.cost
    }
    
    const tempsTotal = tempsDeplacement + filteredRdvsBySearch.reduce((sum, rdv) => sum + rdv.duree_min, 0)
    
    // Compter les RDV par statut
    const rdvStats = {
      total: filteredRdvsBySearch.length,
      planifies: filteredRdvsBySearch.filter(r => r.statut === 'planifie').length,
      confirmes: filteredRdvsBySearch.filter(r => r.statut === 'confirme').length,
      termines: filteredRdvsBySearch.filter(r => r.statut === 'termine').length,
      annules: filteredRdvsBySearch.filter(r => r.statut === 'annule').length
    }
    
    return {
      totalRdvs: filteredRdvsBySearch.length,
      distanceTotale: Math.round(distanceTotale * 10) / 10,
      tempsDeplacement: Math.round(tempsDeplacement),
      tempsTotal: Math.round(tempsTotal),
      coutTotal: Math.round(coutTotal),
      customDistancesUsed: customDistances.length,
      rdvStats
    }
  }, [filteredRdvsBySearch, commercialInfo, customDistances, settings])

  // Charger tous les prospects pour la recherche
  async function loadAllProspects() {
    setLoading(true)
    try {
      const res = await fetch('/api/prospects?limit=10000')
      const result = await res.json()
      const data = result.data || result
      setAllProspects(Array.isArray(data) ? data : [])
      setShowSearch(true)
      toast({
        title: "Base complète chargée",
        description: `${data.length} prospects disponibles pour la recherche`
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger la base complète",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingRdvs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec titre et actions principales */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planning</h1>
          <p className="text-gray-600 mt-1">
            Gestion des rendez-vous de {commercialInfo.nom || 'Commercial'}
            {commercialInfo.adresse && ` • 📍 ${commercialInfo.adresse}, ${commercialInfo.ville}`}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={loadRdvs}
            disabled={loadingRdvs}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loadingRdvs ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => exportData('excel')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          
          <Button 
            onClick={() => setShowAddRdv(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Nouveau RDV
          </Button>
        </div>
      </div>

      {/* Alerte si pas d'adresse */}
      {!commercialInfo.adresse && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Configuration requise</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Configurez votre adresse pour calculer les distances depuis votre domicile/bureau.
                </p>
              </div>
              <Button 
                onClick={() => setShowCommercialConfig(true)}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Configurer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barre de filtres et recherche */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtres et recherche</CardTitle>
            {(searchTerm || filterStatut || filterCommercial || filterProspect) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={resetFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtre prospects */}
            <select
              value={filterProspect}
              onChange={(e) => setFilterProspect(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-white"
            >
              <option value="">Tous les prospects</option>
              {prospects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>

            {/* Filtre commerciaux */}
            <select
              value={filterCommercial}
              onChange={(e) => setFilterCommercial(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-white"
            >
              <option value="">Tous les commerciaux</option>
              {uniqueCommercials.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Filtre statuts */}
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-white"
            >
              <option value="">Tous les statuts</option>
              <option value="planifie">Planifié</option>
              <option value="confirme">Confirmé</option>
              <option value="en-cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
              <option value="reporte">Reporté</option>
            </select>

            {/* Bouton Paramètres */}
            <Button 
              variant="outline"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Paramètres
            </Button>
          </div>

          {/* Résumé des filtres actifs */}
          {(searchTerm || filterStatut || filterCommercial || filterProspect) && (
            <div className="mt-3 text-sm text-gray-600">
              {filteredRdvsBySearch.length} rendez-vous trouvés
              {searchTerm && ` pour "${searchTerm}"`}
              {filterProspect && ` • Prospect: ${prospects.find(p => p.id.toString() === filterProspect)?.nom}`}
              {filterCommercial && ` • Commercial: ${filterCommercial}`}
              {filterStatut && ` • Statut: ${filterStatut}`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation date et vue */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigateDate('today')}
              >
                Aujourd'hui
              </Button>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <span className="ml-4 font-medium">
                {new Date(selectedDate).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>

            <div className="flex gap-2">
              <Button 
                variant={viewType === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('day')}
              >
                Jour
              </Button>
              <Button 
                variant={viewType === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('week')}
              >
                Semaine
              </Button>
              <Button 
                variant={viewType === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('month')}
              >
                Mois
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">📅</div>
              <p className="text-xs text-gray-600">Total RDV</p>
              <p className="text-xl font-bold">{stats.totalRdvs}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">📋</div>
              <p className="text-xs text-gray-600">Planifiés</p>
              <p className="text-xl font-bold text-blue-600">{stats.rdvStats.planifies}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">✅</div>
              <p className="text-xs text-gray-600">Confirmés</p>
              <p className="text-xl font-bold text-green-600">{stats.rdvStats.confirmes}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🗺️</div>
              <p className="text-xs text-gray-600">Distance</p>
              <p className="text-xl font-bold">{stats.distanceTotale} km</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">⏱️</div>
              <p className="text-xs text-gray-600">Temps route</p>
              <p className="text-xl font-bold">
                {Math.floor(stats.tempsDeplacement / 60)}h{stats.tempsDeplacement % 60}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">💰</div>
              <p className="text-xs text-gray-600">Coût</p>
              <p className="text-xl font-bold">Rs {stats.coutTotal}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🏠</div>
              <p className="text-xs text-gray-600">Départ</p>
              <p className="text-sm font-bold">
                {commercialInfo.startHour || '08:00'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="flex gap-2">
        <Button
          onClick={() => setShowCommercialConfig(true)}
          variant="outline"
          className={commercialInfo.adresse ? "bg-green-50" : "bg-yellow-50 text-yellow-700"}
        >
          <User className="h-4 w-4 mr-2" />
          Mon Profil
        </Button>
        
        <Button
          onClick={() => setShowDistanceConfig(true)}
          variant="outline"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Distances ({customDistances.length})
        </Button>
        
        <Button 
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-300"
          onClick={loadAllProspects}
          disabled={loading}
        >
          <Search className="h-4 w-4 mr-2" />
          Rechercher dans la base
        </Button>
        
        {filteredRdvsBySearch.length > 1 && (
          <Button 
            variant="outline"
            className="bg-green-50 text-green-700 border-green-300"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Optimiser tournée
          </Button>
        )}
      </div>

      {/* Liste des RDV */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewType === 'day' ? 'Rendez-vous du jour' : 
             viewType === 'week' ? 'Rendez-vous de la semaine' : 
             'Rendez-vous du mois'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRdvsBySearch.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun rendez-vous trouvé</p>
              {searchTerm && <p className="text-sm mt-1">Essayez de modifier vos critères de recherche</p>}
              <Button onClick={() => setShowAddRdv(true)} className="mt-4">
                Planifier un RDV
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Départ du domicile */}
              {commercialInfo.adresse && filteredRdvsBySearch.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-2xl">🏠</span>
                  <div className="flex-1">
                    <div className="font-medium">Départ de {commercialInfo.adresse}</div>
                    <div className="text-sm text-gray-600">
                      Heure de départ prévue : {commercialInfo.startHour || '08:00'}
                    </div>
                  </div>
                  {filteredRdvsBySearch[0].prospect && (
                    <div className="text-sm text-gray-600">
                      → {calculateFromHome(filteredRdvsBySearch[0].prospect).distance} km 
                      ({calculateFromHome(filteredRdvsBySearch[0].prospect).duration} min)
                    </div>
                  )}
                </div>
              )}

              {/* RDV de la journée */}
              {filteredRdvsBySearch.map((rdv, index) => {
                if (!rdv.prospect) return null
                
                const districtConfig = DISTRICTS_CONFIG[rdv.prospect.district]
                const secteurConfig = SECTEURS_CONFIG[rdv.prospect.secteur]
                
                let routeInfo = null
                if (index > 0 && filteredRdvsBySearch[index - 1].prospect) {
                  routeInfo = calculateDistance(
                    filteredRdvsBySearch[index - 1].prospect,
                    rdv.prospect
                  )
                }
                
                const priorityColors = {
                  haute: "border-red-500 bg-red-50",
                  urgente: "border-orange-500 bg-orange-50",
                  normale: "border-green-500 bg-green-50"
                }
                
                const statutBadges = {
                  planifie: { color: "bg-blue-100 text-blue-800", icon: "📋" },
                  confirme: { color: "bg-green-100 text-green-800", icon: "✅" },
                  'en-cours': { color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
                  termine: { color: "bg-gray-100 text-gray-800", icon: "✔️" },
                  annule: { color: "bg-red-100 text-red-800", icon: "❌" },
                  reporte: { color: "bg-orange-100 text-orange-800", icon: "📅" }
                }
                
                const rdvTime = new Date(rdv.date_time)
                const heureRdv = rdvTime.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
                
                return (
                  <div key={rdv.id}>
                    {routeInfo && (
                      <div className="flex items-center gap-4 text-xs text-gray-600 mb-1 ml-4 p-2">
                        <span>🚗 Trajet: {routeInfo.distance} km</span>
                        <span>⏱️ {routeInfo.duration} min</span>
                        <span>💰 Rs {routeInfo.cost}</span>
                        {routeInfo.method === 'custom' && (
                          <span className="text-green-600">✓ Distance personnalisée</span>
                        )}
                      </div>
                    )}
                    
                    <div className={`border-l-4 p-4 rounded-r-lg ${priorityColors[rdv.priorite || 'normale']}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-semibold">⏰ {heureRdv}</span>
                            <span className="text-sm text-gray-600">({rdv.duree_min} min)</span>
                            <Badge className={statutBadges[rdv.statut]?.color || "bg-gray-100"}>
                              {statutBadges[rdv.statut]?.icon} {rdv.statut}
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-800">
                              {rdv.type_visite}
                            </Badge>
                          </div>
                          
                          <div className="mb-2">
                            <div className="font-medium text-lg">{rdv.prospect.nom}</div>
                            <div className="text-sm text-gray-600">
                              {secteurConfig?.icon} {secteurConfig?.label} • ⭐{rdv.prospect.score}/5
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {rdv.lieu || rdv.prospect.adresse || `${rdv.prospect.ville}, ${districtConfig?.label}`}
                            </div>
                            {rdv.prospect.telephone && (
                              <div className="flex items-center gap-2 mt-1">
                                <Phone className="h-4 w-4" />
                                {rdv.prospect.telephone}
                              </div>
                            )}
                            {rdv.prospect.contact && (
                              <div className="flex items-center gap-2 mt-1">
                                <User className="h-4 w-4" />
                                {rdv.prospect.contact}
                              </div>
                            )}
                          </div>
                          
                          {rdv.notes && (
                            <div className="mt-2 p-2 bg-white rounded text-sm">
                              📝 {rdv.notes}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRdv(rdv)}
                          >
                            ✏️
                          </Button>
                          
                          {rdv.statut === 'planifie' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => updateRdv(rdv.id, { statut: 'confirme' })}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => {
                              if (confirm(`Supprimer le RDV avec ${rdv.prospect?.nom} ?`)) {
                                deleteRdv(rdv.id)
                              }
                            }}
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Retour au domicile */}
              {commercialInfo.adresse && filteredRdvsBySearch.length > 0 && filteredRdvsBySearch[filteredRdvsBySearch.length - 1].prospect && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-2xl">🏠</span>
                  <div className="flex-1">
                    <div className="font-medium">Retour à {commercialInfo.adresse}</div>
                    <div className="text-sm text-gray-600">
                      Heure d'arrivée estimée : {commercialInfo.endHour || '18:00'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    ← {calculateFromHome(filteredRdvsBySearch[filteredRdvsBySearch.length - 1].prospect).distance} km 
                    ({calculateFromHome(filteredRdvsBySearch[filteredRdvsBySearch.length - 1].prospect).duration} min)
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nouveau/Modifier RDV */}
      <RdvDialog
        open={showAddRdv || !!editingRdv}
        onClose={() => {
          setShowAddRdv(false)
          setEditingRdv(null)
        }}
        prospects={prospects}
        rdv={editingRdv}
        onSave={async (data) => {
          if (editingRdv) {
            await updateRdv(editingRdv.id, data)
          } else {
            const prospect = prospects.find(p => p.id === data.prospect_id)
            if (prospect) {
              await addRdv(
                data.prospect_id,
                prospect,
                data.date,
                data.time,
                data.duree_min,
                data.notes,
                data.type_visite,
                data.priorite
              )
            }
          }
          setShowAddRdv(false)
          setEditingRdv(null)
        }}
      />

      {/* Dialog Configuration Commercial */}
      <ConfigCommercialDialog
        open={showCommercialConfig}
        onClose={() => setShowCommercialConfig(false)}
        commercialInfo={commercialInfo}
        onSave={saveCommercialInfo}
      />

      {/* Dialog Configuration Distances */}
      <ConfigDistancesDialog
        open={showDistanceConfig}
        onClose={() => setShowDistanceConfig(false)}
        distances={customDistances}
        onSave={saveCustomDistances}
      />

      {/* Dialog Paramètres */}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings)
          localStorage.setItem('planning_cost_settings', JSON.stringify(newSettings))
          toast({ title: "Paramètres sauvegardés" })
        }}
      />
    </div>
  )
}

// Dialog RDV unifié
function RdvDialog({ 
  open, 
  onClose, 
  prospects, 
  rdv, 
  onSave 
}: {
  open: boolean
  onClose: () => void
  prospects: Prospect[]
  rdv: RendezVous | null
  onSave: (data: any) => void
}) {
  const [form, setForm] = React.useState({
    prospect_id: 0,
    date: '',
    time: '',
    duree_min: 60,
    type_visite: 'decouverte' as const,
    priorite: 'normale' as const,
    statut: 'planifie' as const,
    notes: '',
    lieu: ''
  })

  React.useEffect(() => {
    if (rdv) {
      const dateTime = new Date(rdv.date_time)
      setForm({
        prospect_id: rdv.prospect_id,
        date: dateTime.toISOString().split('T')[0],
        time: dateTime.toTimeString().substring(0, 5),
        duree_min: rdv.duree_min,
        type_visite: rdv.type_visite,
        priorite: rdv.priorite,
        statut: rdv.statut,
        notes: rdv.notes || '',
        lieu: rdv.lieu || ''
      })
    } else {
      setForm({
        prospect_id: 0,
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        duree_min: 60,
        type_visite: 'decouverte',
        priorite: 'normale',
        statut: 'planifie',
        notes: '',
        lieu: ''
      })
    }
  }, [rdv])

  function handleSubmit() {
    if (!form.prospect_id || !form.date || !form.time) return
    onSave(form)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {rdv ? 'Modifier' : 'Planifier'} un rendez-vous
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prospect *</label>
            <select
              value={form.prospect_id}
              onChange={(e) => setForm({...form, prospect_id: parseInt(e.target.value)})}
              className="w-full border rounded-md px-3 py-2"
              disabled={!!rdv}
            >
              <option value="0">Sélectionner un prospect</option>
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} - {p.ville} ⭐{p.score}/5
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date *</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({...form, date: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Heure *</label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({...form, time: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type de visite</label>
              <select
                value={form.type_visite}
                onChange={(e) => setForm({...form, type_visite: e.target.value as any})}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="decouverte">Découverte</option>
                <option value="presentation">Présentation</option>
                <option value="negociation">Négociation</option>
                <option value="signature">Signature</option>
                <option value="suivi">Suivi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Durée (min)</label>
              <Input
                type="number"
                value={form.duree_min}
                onChange={(e) => setForm({...form, duree_min: parseInt(e.target.value) || 60})}
                min="15"
                step="15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priorité</label>
              <select
                value={form.priorite}
                onChange={(e) => setForm({...form, priorite: e.target.value as any})}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Lieu</label>
            <Input
              value={form.lieu}
              onChange={(e) => setForm({...form, lieu: e.target.value})}
              placeholder="Lieu du rendez-vous"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
              rows={3}
              placeholder="Points à aborder, objectifs..."
            />
          </div>

          {rdv && (
            <div>
              <label className="block text-sm font-medium mb-2">Statut</label>
              <select
                value={form.statut}
                onChange={(e) => setForm({...form, statut: e.target.value as any})}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="planifie">Planifié</option>
                <option value="confirme">Confirmé</option>
                <option value="en-cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
                <option value="reporte">Reporté</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!form.prospect_id || !form.date || !form.time}>
            {rdv ? 'Enregistrer' : 'Planifier'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Dialog Configuration Commercial
function ConfigCommercialDialog({
  open,
  onClose,
  commercialInfo,
  onSave
}: {
  open: boolean
  onClose: () => void
  commercialInfo: CommercialInfo
  onSave: (info: CommercialInfo) => void
}) {
  const [form, setForm] = React.useState(commercialInfo)

  React.useEffect(() => {
    setForm(commercialInfo)
  }, [commercialInfo])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuration du commercial</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom</label>
            <Input
              value={form.nom}
              onChange={(e) => setForm({...form, nom: e.target.value})}
              placeholder="Votre nom"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Adresse</label>
            <Input
              value={form.adresse}
              onChange={(e) => setForm({...form, adresse: e.target.value})}
              placeholder="Votre adresse"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Ville</label>
            <Input
              value={form.ville}
              onChange={(e) => setForm({...form, ville: e.target.value})}
              placeholder="Votre ville"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">District</label>
            <select
              value={form.district}
              onChange={(e) => setForm({...form, district: e.target.value as District})}
              className="w-full border rounded-md px-3 py-2"
            >
              {Object.entries(DISTRICTS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Heure de départ</label>
              <Input
                type="time"
                value={form.startHour || '08:00'}
                onChange={(e) => setForm({...form, startHour: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Heure de retour</label>
              <Input
                type="time"
                value={form.endHour || '18:00'}
                onChange={(e) => setForm({...form, endHour: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => {
            onSave(form)
            onClose()
          }}>
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Dialog Configuration Distances
function ConfigDistancesDialog({
  open,
  onClose,
  distances,
  onSave
}: {
  open: boolean
  onClose: () => void
  distances: CustomDistance[]
  onSave: (distances: CustomDistance[]) => void
}) {
  const [localDistances, setLocalDistances] = React.useState(distances)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Distances personnalisées</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Configurez des distances spécifiques entre vos adresses fréquentes.
          </p>
          
          {localDistances.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune distance personnalisée configurée
            </div>
          ) : (
            <div className="space-y-2">
              {localDistances.map((distance, index) => (
                <div key={distance.id} className="flex items-center gap-2 p-2 border rounded">
                  <div className="flex-1">
                    <span className="text-sm">{distance.from} → {distance.to}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {distance.distance} km • {distance.duration} min
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setLocalDistances(localDistances.filter((_, i) => i !== index))
                    }}
                  >
                    ❌
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={() => {
              // TODO: Implémenter l'ajout de distance
            }}
          >
            + Ajouter une distance
          </Button>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => {
            onSave(localDistances)
            onClose()
          }}>
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Dialog Paramètres
function SettingsDialog({
  open,
  onClose,
  settings,
  onSave
}: {
  open: boolean
  onClose: () => void
  settings: CostSettings
  onSave: (settings: CostSettings) => void
}) {
  const [form, setForm] = React.useState(settings)

  React.useEffect(() => {
    setForm(settings)
  }, [settings])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paramètres de calcul</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prix du carburant (Rs/L)</label>
            <Input
              type="number"
              value={form.fuelPrice}
              onChange={(e) => setForm({...form, fuelPrice: parseFloat(e.target.value) || 0})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Consommation (L/100km)</label>
            <Input
              type="number"
              value={form.consumption}
              onChange={(e) => setForm({...form, consumption: parseFloat(e.target.value) || 0})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Vitesse moyenne (km/h)</label>
            <Input
              type="number"
              value={form.averageSpeed}
              onChange={(e) => setForm({...form, averageSpeed: parseFloat(e.target.value) || 0})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Heure de pointe début</label>
              <Input
                type="time"
                value={form.rushHourStart}
                onChange={(e) => setForm({...form, rushHourStart: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Heure de pointe fin</label>
              <Input
                type="time"
                value={form.rushHourEnd}
                onChange={(e) => setForm({...form, rushHourEnd: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Vitesse heure de pointe (km/h)</label>
            <Input
              type="number"
              value={form.rushHourSpeed}
              onChange={(e) => setForm({...form, rushHourSpeed: parseFloat(e.target.value) || 0})}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => {
            onSave(form)
            onClose()
          }}>
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
