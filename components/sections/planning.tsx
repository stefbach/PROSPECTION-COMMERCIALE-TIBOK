"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Phone, MapPin, User, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

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

  // Filtrer les RDV de la journée
  const filteredRdvs = React.useMemo(() => {
    return rendezVous.filter(rdv => {
      const rdvDate = new Date(rdv.date_time).toISOString().split('T')[0]
      return rdvDate === selectedDate
    }).sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
  }, [rendezVous, selectedDate])

  // Calculer les statistiques
  const stats = React.useMemo(() => {
    let distanceTotale = 0
    let tempsDeplacement = 0
    let coutTotal = 0
    
    // Distance depuis le domicile au premier RDV
    if (filteredRdvs.length > 0 && commercialInfo.adresse && filteredRdvs[0].prospect) {
      const fromHome = calculateFromHome(filteredRdvs[0].prospect)
      distanceTotale += fromHome.distance
      tempsDeplacement += fromHome.duration
      coutTotal += fromHome.cost
    }
    
    // Distances entre les RDV
    for (let i = 0; i < filteredRdvs.length - 1; i++) {
      if (filteredRdvs[i].prospect && filteredRdvs[i + 1].prospect) {
        const route = calculateDistance(
          filteredRdvs[i].prospect!,
          filteredRdvs[i + 1].prospect!
        )
        distanceTotale += route.distance
        tempsDeplacement += route.duration
        coutTotal += route.cost
      }
    }
    
    // Retour au domicile depuis le dernier RDV
    if (filteredRdvs.length > 0 && commercialInfo.adresse && filteredRdvs[filteredRdvs.length - 1].prospect) {
      const toHome = calculateFromHome(filteredRdvs[filteredRdvs.length - 1].prospect)
      distanceTotale += toHome.distance
      tempsDeplacement += toHome.duration
      coutTotal += toHome.cost
    }
    
    const tempsTotal = tempsDeplacement + filteredRdvs.reduce((sum, rdv) => sum + rdv.duree_min, 0)
    
    // Compter les RDV par statut
    const rdvStats = {
      total: filteredRdvs.length,
      planifies: filteredRdvs.filter(r => r.statut === 'planifie').length,
      confirmes: filteredRdvs.filter(r => r.statut === 'confirme').length,
      termines: filteredRdvs.filter(r => r.statut === 'termine').length,
      annules: filteredRdvs.filter(r => r.statut === 'annule').length
    }
    
    return {
      totalRdvs: filteredRdvs.length,
      distanceTotale: Math.round(distanceTotale * 10) / 10,
      tempsDeplacement: Math.round(tempsDeplacement),
      tempsTotal: Math.round(tempsTotal),
      coutTotal: Math.round(coutTotal),
      customDistancesUsed: customDistances.length,
      rdvStats
    }
  }, [filteredRdvs, commercialInfo, customDistances, settings])

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
      {/* Header avec infos commercial */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Planning de {commercialInfo.nom || 'Commercial'}
          </h2>
          <p className="text-gray-600">
            {commercialInfo.adresse ? 
              `📍 ${commercialInfo.adresse}, ${commercialInfo.ville}` : 
              '⚠️ Adresse non configurée'
            }
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCommercialConfig(true)}
            variant="outline"
            className={commercialInfo.adresse ? "bg-green-50" : "bg-yellow-50 text-yellow-700"}
          >
            👤 Mon Profil
          </Button>
          
          <Button
            onClick={() => setShowDistanceConfig(true)}
            variant="outline"
          >
            📏 Distances ({customDistances.length})
          </Button>
          
          <Button
            onClick={() => setShowSettings(true)}
            variant="outline"
          >
            ⚙️ Paramètres
          </Button>
        </div>
      </div>

      {/* Alerte si pas d'adresse */}
      {!commercialInfo.adresse && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900">Configuration requise</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Configurez votre adresse pour calculer les distances depuis votre domicile/bureau.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques améliorées */}
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

      {/* Contrôles */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-48"
              />
            </div>

            <div className="flex items-end gap-2 flex-1">
              <Button onClick={() => setShowAddRdv(true)}>
                ➕ Nouveau RDV
              </Button>
              
              <Button 
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-300"
                onClick={loadAllProspects}
                disabled={loading}
              >
                🔍 Rechercher dans la base
              </Button>
              
              <Button
                variant="outline"
                onClick={loadRdvs}
                className="bg-blue-50 text-blue-700"
                disabled={loadingRdvs}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingRdvs ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              
              {filteredRdvs.length > 1 && (
                <Button 
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-300"
                >
                  🗺️ Optimiser tournée
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planning de la journée avec badges de statut */}
      <Card>
        <CardHeader>
          <CardTitle>
            Tournée du {new Date(selectedDate).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRdvs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <p>Aucun rendez-vous planifié</p>
              <Button onClick={() => setShowAddRdv(true)} className="mt-4">
                Planifier un RDV
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Départ du domicile */}
              {commercialInfo.adresse && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-2xl">🏠</span>
                  <div className="flex-1">
                    <div className="font-medium">Départ de {commercialInfo.adresse}</div>
                    <div className="text-sm text-gray-600">
                      Heure de départ prévue : {commercialInfo.startHour || '08:00'}
                    </div>
                  </div>
                  {filteredRdvs.length > 0 && filteredRdvs[0].prospect && (
                    <div className="text-sm text-gray-600">
                      → {calculateFromHome(filteredRdvs[0].prospect).distance} km 
                      ({calculateFromHome(filteredRdvs[0].prospect).duration} min)
                    </div>
                  )}
                </div>
              )}

              {/* RDV de la journée avec statuts améliorés */}
              {filteredRdvs.map((rdv, index) => {
                if (!rdv.prospect) return null
                
                const districtConfig = DISTRICTS_CONFIG[rdv.prospect.district]
                const secteurConfig = SECTEURS_CONFIG[rdv.prospect.secteur]
                
                let routeInfo = null
                if (index > 0 && filteredRdvs[index - 1].prospect) {
                  routeInfo = calculateDistance(
                    filteredRdvs[index - 1].prospect,
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
              {commercialInfo.adresse && filteredRdvs.length > 0 && filteredRdvs[filteredRdvs.length - 1].prospect && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="text-2xl">🏠</span>
                  <div className="flex-1">
                    <div className="font-medium">Retour à {commercialInfo.adresse}</div>
                    <div className="text-sm text-gray-600">
                      Heure d'arrivée estimée : {commercialInfo.endHour || '18:00'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    ← {calculateFromHome(filteredRdvs[filteredRdvs.length - 1].prospect).distance} km 
                    ({calculateFromHome(filteredRdvs[filteredRdvs.length - 1].prospect).duration} min)
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
