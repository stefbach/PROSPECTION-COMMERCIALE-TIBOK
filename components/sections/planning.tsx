"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

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
  score: 1 | 2 | 3 | 4 | 5
  budget?: string
  notes?: string
  website?: string
  adresse?: string
  priority?: string
  quality_score?: number
}

interface RendezVous {
  id: string
  prospectId: number
  prospect: Prospect
  date: string
  heure: string
  duree: number
  type: 'decouverte' | 'demo' | 'negociation' | 'signature' | 'suivi'
  statut: 'planifie' | 'confirme' | 'reporte' | 'annule' | 'termine'
  notes?: string
  priorite?: 'haute' | 'moyenne' | 'basse'
}

interface CommercialInfo {
  nom: string
  adresse: string
  ville: string
  district: District
  telephone?: string
  email?: string
  vehicule?: string
  startHour?: string // Heure de début par défaut
  endHour?: string // Heure de fin par défaut
}

interface CustomDistance {
  id: string
  from: string
  to: string
  distance: number
  duration: number
  notes?: string
}

interface RouteInfo {
  distance: number
  duration: number
  cost: number
  method: 'custom' | 'matrix' | 'estimation'
  fromHome?: boolean // Si le trajet part du domicile
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

// Matrice de base pour les districts
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

// Clés de stockage
const COMMERCIAL_KEY = 'planning_commercial_info'
const CUSTOM_DISTANCES_KEY = 'planning_custom_distances'
const SETTINGS_KEY = 'planning_cost_settings'

export default function PlanningAdvancedSection() {
  const [loading, setLoading] = React.useState(true)
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
    const savedCommercial = localStorage.getItem(COMMERCIAL_KEY)
    if (savedCommercial) {
      try {
        setCommercialInfo(JSON.parse(savedCommercial))
      } catch (e) {
        console.error('Erreur chargement info commercial:', e)
      }
    }

    // Distances personnalisées
    const savedDistances = localStorage.getItem(CUSTOM_DISTANCES_KEY)
    if (savedDistances) {
      try {
        setCustomDistances(JSON.parse(savedDistances))
      } catch (e) {
        console.error('Erreur chargement distances:', e)
      }
    }

    // Paramètres
    const savedSettings = localStorage.getItem(SETTINGS_KEY)
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error('Erreur chargement paramètres:', e)
      }
    }
  }, [])

  // Charger les prospects
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
    } finally {
      setLoading(false)
    }
  }

  // Charger TOUS les prospects pour la recherche
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

  function loadRdvs() {
    const savedRdvs = localStorage.getItem('planning_rdvs')
    if (savedRdvs) {
      try {
        setRendezVous(JSON.parse(savedRdvs))
      } catch (e) {
        console.error('Erreur chargement RDV:', e)
      }
    }
  }

  function saveRdvs(rdvs: RendezVous[]) {
    localStorage.setItem('planning_rdvs', JSON.stringify(rdvs))
  }

  // Sauvegarder les infos du commercial
  function saveCommercialInfo(info: CommercialInfo) {
    setCommercialInfo(info)
    localStorage.setItem(COMMERCIAL_KEY, JSON.stringify(info))
    toast({
      title: "Informations sauvegardées",
      description: "L'adresse du commercial a été mise à jour"
    })
  }

  // Sauvegarder les distances personnalisées
  function saveCustomDistances(distances: CustomDistance[]) {
    setCustomDistances(distances)
    localStorage.setItem(CUSTOM_DISTANCES_KEY, JSON.stringify(distances))
  }

  // Calculer la distance (avec priorité aux distances personnalisées)
  function calculateDistance(
    from: { adresse?: string; ville?: string; district: District },
    to: { adresse?: string; ville?: string; district: District }
  ): RouteInfo {
    // 1. Chercher dans les distances personnalisées
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
    
    // 2. Utiliser la matrice des districts
    const distance = BASE_DISTANCE_MATRIX[from.district]?.[to.district] || 25
    
    // Vérifier si on est en heure de pointe
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
  function calculateFromHome(to: Prospect): RouteInfo {
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
    return rendezVous.filter(rdv => rdv.date === selectedDate)
      .sort((a, b) => a.heure.localeCompare(b.heure))
  }, [rendezVous, selectedDate])

  // Calculer les statistiques
  const stats = React.useMemo(() => {
    let distanceTotale = 0
    let tempsDeplacement = 0
    let coutTotal = 0
    
    // Distance depuis le domicile au premier RDV
    if (filteredRdvs.length > 0 && commercialInfo.adresse) {
      const fromHome = calculateFromHome(filteredRdvs[0].prospect)
      distanceTotale += fromHome.distance
      tempsDeplacement += fromHome.duration
      coutTotal += fromHome.cost
    }
    
    // Distances entre les RDV
    for (let i = 0; i < filteredRdvs.length - 1; i++) {
      const route = calculateDistance(
        filteredRdvs[i].prospect,
        filteredRdvs[i + 1].prospect
      )
      distanceTotale += route.distance
      tempsDeplacement += route.duration
      coutTotal += route.cost
    }
    
    // Retour au domicile depuis le dernier RDV
    if (filteredRdvs.length > 0 && commercialInfo.adresse) {
      const toHome = calculateFromHome(filteredRdvs[filteredRdvs.length - 1].prospect)
      distanceTotale += toHome.distance
      tempsDeplacement += toHome.duration
      coutTotal += toHome.cost
    }
    
    const tempsTotal = tempsDeplacement + filteredRdvs.reduce((sum, rdv) => sum + rdv.duree, 0)
    
    return {
      totalRdvs: filteredRdvs.length,
      distanceTotale: Math.round(distanceTotale * 10) / 10,
      tempsDeplacement: Math.round(tempsDeplacement),
      tempsTotal: Math.round(tempsTotal),
      coutTotal: Math.round(coutTotal),
      customDistancesUsed: customDistances.length
    }
  }, [filteredRdvs, commercialInfo, customDistances, settings])

  // Fonctions CRUD RDV
  function addRdv(rdv: RendezVous) {
    const newRdvs = [...rendezVous, rdv]
    setRendezVous(newRdvs)
    saveRdvs(newRdvs)
    toast({
      title: "RDV ajouté",
      description: `RDV avec ${rdv.prospect.nom} planifié`
    })
  }

  function updateRdv(updatedRdv: RendezVous) {
    const newRdvs = rendezVous.map(rdv => 
      rdv.id === updatedRdv.id ? updatedRdv : rdv
    )
    setRendezVous(newRdvs)
    saveRdvs(newRdvs)
    toast({ title: "RDV modifié" })
  }

  function deleteRdv(rdvId: string) {
    const newRdvs = rendezVous.filter(rdv => rdv.id !== rdvId)
    setRendezVous(newRdvs)
    saveRdvs(newRdvs)
    toast({ title: "RDV supprimé" })
  }

  if (loading) {
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
              <span className="text-xl">⚠️</span>
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

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">📅</div>
              <p className="text-xs text-gray-600">RDV</p>
              <p className="text-xl font-bold">{stats.totalRdvs}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🗺️</div>
              <p className="text-xs text-gray-600">Distance totale</p>
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
              <div className="text-2xl mb-1">📍</div>
              <p className="text-xs text-gray-600">Distances perso</p>
              <p className="text-xl font-bold">{stats.customDistancesUsed}</p>
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

      {/* Planning de la journée */}
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
                  {filteredRdvs.length > 0 && (
                    <div className="text-sm text-gray-600">
                      → {calculateFromHome(filteredRdvs[0].prospect).distance} km 
                      ({calculateFromHome(filteredRdvs[0].prospect).duration} min)
                    </div>
                  )}
                </div>
              )}

              {/* RDV de la journée */}
              {filteredRdvs.map((rdv, index) => {
                const districtConfig = DISTRICTS_CONFIG[rdv.prospect.district]
                const secteurConfig = SECTEURS_CONFIG[rdv.prospect.secteur]
                
                let routeInfo = null
                if (index > 0) {
                  routeInfo = calculateDistance(
                    filteredRdvs[index - 1].prospect,
                    rdv.prospect
                  )
                }
                
                const priorityColors = {
                  haute: "border-red-500 bg-red-50",
                  moyenne: "border-yellow-500 bg-yellow-50",
                  basse: "border-green-500 bg-green-50"
                }
                
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
                    
                    <div className={`border-l-4 p-4 rounded-r-lg ${priorityColors[rdv.priorite || 'basse']}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-semibold">⏰ {rdv.heure}</span>
                            <span className="text-sm text-gray-600">({rdv.duree} min)</span>
                          </div>
                          
                          <div className="mb-2">
                            <div className="font-medium text-lg">{rdv.prospect.nom}</div>
                            <div className="text-sm text-gray-600">
                              {secteurConfig?.icon} {secteurConfig?.label} • ⭐{rdv.prospect.score}
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <div>📍 {rdv.prospect.adresse || `${rdv.prospect.ville}, ${districtConfig?.label}`}</div>
                            {rdv.prospect.telephone && <div>📞 {rdv.prospect.telephone}</div>}
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
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => {
                              if (confirm(`Supprimer le RDV ?`)) {
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
              {commercialInfo.adresse && filteredRdvs.length > 0 && (
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

      {/* Dialogs */}
      <CommercialConfigDialog
        open={showCommercialConfig}
        onClose={() => setShowCommercialConfig(false)}
        commercialInfo={commercialInfo}
        onSave={saveCommercialInfo}
      />

      <DistanceConfigDialog
        open={showDistanceConfig}
        onClose={() => setShowDistanceConfig(false)}
        distances={customDistances}
        onSave={saveCustomDistances}
        prospects={prospects}
      />

      <SearchProspectsDialog
        open={showSearch}
        onClose={() => setShowSearch(false)}
        prospects={allProspects.length > 0 ? allProspects : prospects}
        onAddToPlanning={(prospect) => {
          // Créer un RDV pour ce prospect
          const rdv: RendezVous = {
            id: `rdv-${Date.now()}`,
            prospectId: prospect.id,
            prospect,
            date: selectedDate,
            heure: '10:00',
            duree: 60,
            type: 'decouverte',
            statut: 'planifie',
            priorite: prospect.score >= 4 ? 'haute' : prospect.score >= 3 ? 'moyenne' : 'basse'
          }
          addRdv(rdv)
          setShowSearch(false)
        }}
      />

      <RdvDialog
        open={showAddRdv || !!editingRdv}
        onClose={() => {
          setShowAddRdv(false)
          setEditingRdv(null)
        }}
        prospects={prospects}
        rdv={editingRdv}
        onSave={(rdv) => {
          if (editingRdv) {
            updateRdv(rdv)
          } else {
            addRdv(rdv)
          }
          setShowAddRdv(false)
          setEditingRdv(null)
        }}
      />

      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings)
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
          toast({ title: "Paramètres sauvegardés" })
        }}
      />
    </div>
  )
}

// Dialog Configuration Commercial
function CommercialConfigDialog({
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>👤 Configuration du Commercial</DialogTitle>
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
            <label className="block text-sm font-medium mb-2">Adresse de départ (domicile/bureau)</label>
            <Input
              value={form.adresse}
              onChange={(e) => setForm({...form, adresse: e.target.value})}
              placeholder="Ex: 10 Royal Road"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ville</label>
              <Input
                value={form.ville}
                onChange={(e) => setForm({...form, ville: e.target.value})}
                placeholder="Ex: Port Louis"
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Heure de départ habituelle</label>
              <Input
                type="time"
                value={form.startHour || '08:00'}
                onChange={(e) => setForm({...form, startHour: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Heure de retour souhaitée</label>
              <Input
                type="time"
                value={form.endHour || '18:00'}
                onChange={(e) => setForm({...form, endHour: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Téléphone</label>
            <Input
              value={form.telephone || ''}
              onChange={(e) => setForm({...form, telephone: e.target.value})}
              placeholder="+230 5XXX XXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Véhicule</label>
            <Input
              value={form.vehicule || ''}
              onChange={(e) => setForm({...form, vehicule: e.target.value})}
              placeholder="Marque, modèle (optionnel)"
            />
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Ces informations permettent de calculer les distances depuis votre point de départ
              et d'optimiser vos tournées en fonction de vos horaires.
            </p>
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
function DistanceConfigDialog({
  open,
  onClose,
  distances,
  onSave,
  prospects
}: {
  open: boolean
  onClose: () => void
  distances: CustomDistance[]
  onSave: (distances: CustomDistance[]) => void
  prospects: Prospect[]
}) {
  const [list, setList] = React.useState(distances)
  const [newDistance, setNewDistance] = React.useState({
    from: '',
    to: '',
    distance: 0,
    duration: 0,
    notes: ''
  })

  React.useEffect(() => {
    setList(distances)
  }, [distances])

  function addDistance() {
    if (newDistance.from && newDistance.to && newDistance.distance > 0) {
      setList([...list, {
        id: `dist-${Date.now()}`,
        ...newDistance
      }])
      setNewDistance({
        from: '',
        to: '',
        distance: 0,
        duration: 0,
        notes: ''
      })
    }
  }

  function removeDistance(id: string) {
    setList(list.filter(d => d.id !== id))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📏 Configuration des Distances Personnalisées</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Définissez des distances précises entre des adresses spécifiques.
              Ces distances seront prioritaires sur les estimations par district.
            </p>
          </div>

          {/* Formulaire d'ajout */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ajouter une distance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">De</label>
                  <Input
                    value={newDistance.from}
                    onChange={(e) => setNewDistance({...newDistance, from: e.target.value})}
                    placeholder="Adresse de départ"
                    list="addresses"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">À</label>
                  <Input
                    value={newDistance.to}
                    onChange={(e) => setNewDistance({...newDistance, to: e.target.value})}
                    placeholder="Adresse d'arrivée"
                    list="addresses"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Distance (km)</label>
                  <Input
                    type="number"
                    value={newDistance.distance}
                    onChange={(e) => setNewDistance({...newDistance, distance: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Durée (min)</label>
                  <Input
                    type="number"
                    value={newDistance.duration}
                    onChange={(e) => setNewDistance({...newDistance, duration: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <Input
                    value={newDistance.notes}
                    onChange={(e) => setNewDistance({...newDistance, notes: e.target.value})}
                    placeholder="Optionnel"
                  />
                </div>
              </div>

              <Button 
                onClick={addDistance}
                disabled={!newDistance.from || !newDistance.to || newDistance.distance <= 0}
                className="w-full"
              >
                ➕ Ajouter cette distance
              </Button>
            </CardContent>
          </Card>

          {/* Liste des distances */}
          <div className="space-y-2">
            <h3 className="font-medium">Distances configurées ({list.length})</h3>
            {list.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Aucune distance personnalisée configurée
              </p>
            ) : (
              <div className="space-y-2">
                {list.map(dist => (
                  <div key={dist.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-medium">{dist.from}</span>
                        <span className="mx-2">→</span>
                        <span className="font-medium">{dist.to}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {dist.distance} km • {dist.duration} min
                        {dist.notes && ` • ${dist.notes}`}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => removeDistance(dist.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggestions d'adresses */}
          <datalist id="addresses">
            {prospects.map(p => (
              <option key={p.id} value={p.adresse || `${p.ville}, ${p.district}`} />
            ))}
          </datalist>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => {
            onSave(list)
            onClose()
          }}>
            Enregistrer ({list.length} distances)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Dialog Recherche Prospects
function SearchProspectsDialog({
  open,
  onClose,
  prospects,
  onAddToPlanning
}: {
  open: boolean
  onClose: () => void
  prospects: Prospect[]
  onAddToPlanning: (prospect: Prospect) => void
}) {
  const [search, setSearch] = React.useState('')
  const [filters, setFilters] = React.useState({
    district: '',
    secteur: '',
    statut: '',
    score: 0
  })

  const filtered = React.useMemo(() => {
    return prospects.filter(p => {
      const matchSearch = !search || 
        p.nom.toLowerCase().includes(search.toLowerCase()) ||
        p.ville?.toLowerCase().includes(search.toLowerCase()) ||
        p.adresse?.toLowerCase().includes(search.toLowerCase()) ||
        p.contact?.toLowerCase().includes(search.toLowerCase())
      
      const matchDistrict = !filters.district || p.district === filters.district
      const matchSecteur = !filters.secteur || p.secteur === filters.secteur
      const matchStatut = !filters.statut || p.statut === filters.statut
      const matchScore = !filters.score || p.score >= filters.score
      
      return matchSearch && matchDistrict && matchSecteur && matchStatut && matchScore
    })
  }, [prospects, search, filters])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🔍 Recherche dans la base ({prospects.length} prospects)</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Barre de recherche */}
          <div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, ville, adresse, contact..."
              className="w-full"
            />
          </div>

          {/* Filtres */}
          <div className="grid grid-cols-4 gap-3">
            <select
              value={filters.district}
              onChange={(e) => setFilters({...filters, district: e.target.value})}
              className="border rounded-md px-3 py-2"
            >
              <option value="">Tous les districts</option>
              {Object.entries(DISTRICTS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <select
              value={filters.secteur}
              onChange={(e) => setFilters({...filters, secteur: e.target.value})}
              className="border rounded-md px-3 py-2"
            >
              <option value="">Tous les secteurs</option>
              {Object.entries(SECTEURS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>

            <select
              value={filters.statut}
              onChange={(e) => setFilters({...filters, statut: e.target.value})}
              className="border rounded-md px-3 py-2"
            >
              <option value="">Tous les statuts</option>
              <option value="nouveau">Nouveau</option>
              <option value="contacte">Contacté</option>
              <option value="qualifie">Qualifié</option>
              <option value="proposition">Proposition</option>
              <option value="negociation">Négociation</option>
              <option value="signe">Signé</option>
              <option value="perdu">Perdu</option>
            </select>

            <select
              value={filters.score}
              onChange={(e) => setFilters({...filters, score: parseInt(e.target.value)})}
              className="border rounded-md px-3 py-2"
            >
              <option value="0">Tous les scores</option>
              <option value="3">⭐⭐⭐ et plus</option>
              <option value="4">⭐⭐⭐⭐ et plus</option>
              <option value="5">⭐⭐⭐⭐⭐</option>
            </select>
          </div>

          {/* Résultats */}
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">Nom</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Secteur</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Ville</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">District</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Score</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Contact</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map(p => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium">{p.nom}</td>
                    <td className="px-4 py-2 text-sm">
                      {SECTEURS_CONFIG[p.secteur]?.icon} {SECTEURS_CONFIG[p.secteur]?.label}
                    </td>
                    <td className="px-4 py-2 text-sm">{p.ville}</td>
                    <td className="px-4 py-2 text-sm">{DISTRICTS_CONFIG[p.district]?.label}</td>
                    <td className="px-4 py-2 text-sm">{'⭐'.repeat(p.score)}</td>
                    <td className="px-4 py-2 text-sm">{p.contact || '-'}</td>
                    <td className="px-4 py-2">
                      <Button
                        size="sm"
                        onClick={() => onAddToPlanning(p)}
                      >
                        ➕ Planifier
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucun prospect ne correspond aux critères
              </div>
            )}
            
            {filtered.length > 100 && (
              <div className="text-center py-2 text-sm text-gray-500 bg-gray-50">
                Affichage limité aux 100 premiers résultats. Affinez votre recherche.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-600">
            {filtered.length} prospect(s) trouvé(s)
          </span>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Dialog RDV (simplifié)
function RdvDialog({ open, onClose, prospects, rdv, onSave }: any) {
  const [form, setForm] = React.useState({
    prospectId: rdv?.prospectId?.toString() || '',
    date: rdv?.date || new Date().toISOString().split('T')[0],
    heure: rdv?.heure || '10:00',
    duree: rdv?.duree || 60,
    type: rdv?.type || 'decouverte',
    statut: rdv?.statut || 'planifie',
    notes: rdv?.notes || ''
  })

  React.useEffect(() => {
    if (rdv) {
      setForm({
        prospectId: rdv.prospectId.toString(),
        date: rdv.date,
        heure: rdv.heure,
        duree: rdv.duree,
        type: rdv.type,
        statut: rdv.statut,
        notes: rdv.notes || ''
      })
    }
  }, [rdv])

  function handleSubmit() {
    const prospect = prospects.find((p: any) => p.id === parseInt(form.prospectId))
    if (!prospect) return

    const newRdv = {
      id: rdv?.id || `rdv-${Date.now()}`,
      prospectId: prospect.id,
      prospect,
      date: form.date,
      heure: form.heure,
      duree: form.duree,
      type: form.type,
      statut: form.statut,
      notes: form.notes,
      priorite: prospect.score >= 4 ? 'haute' : prospect.score >= 3 ? 'moyenne' : 'basse'
    }

    onSave(newRdv)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{rdv ? 'Modifier' : 'Planifier'} un RDV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prospect</label>
            <select
              value={form.prospectId}
              onChange={(e) => setForm({...form, prospectId: e.target.value})}
              className="w-full border rounded-md px-3 py-2"
              disabled={!!rdv}
            >
              <option value="">Sélectionner</option>
              {prospects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.nom} - {p.ville} ⭐{p.score}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({...form, date: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Heure</label>
              <Input
                type="time"
                value={form.heure}
                onChange={(e) => setForm({...form, heure: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Durée (min)</label>
              <Input
                type="number"
                value={form.duree}
                onChange={(e) => setForm({...form, duree: parseInt(e.target.value) || 60})}
                min="15"
                step="15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({...form, type: e.target.value})}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="decouverte">Découverte</option>
                <option value="demo">Démonstration</option>
                <option value="negociation">Négociation</option>
                <option value="signature">Signature</option>
                <option value="suivi">Suivi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            {rdv ? 'Enregistrer' : 'Planifier'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Dialog Paramètres (simplifié)
function SettingsDialog({ open, onClose, settings, onSave }: any) {
  const [form, setForm] = React.useState(settings)

  React.useEffect(() => {
    setForm(settings)
  }, [settings])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>⚙️ Paramètres de calcul</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.useIndemnity}
                onChange={(e) => setForm({...form, useIndemnity: e.target.checked})}
                className="w-4 h-4"
              />
              <div>
                <div className="font-medium">Indemnités kilométriques</div>
                <div className="text-sm text-gray-600">
                  Sinon, calcul par consommation
                </div>
              </div>
            </label>
          </div>

          {form.useIndemnity ? (
            <div>
              <label className="block text-sm font-medium mb-2">
                Indemnité par km (Rs)
              </label>
              <Input
                type="number"
                value={form.indemnityPerKm}
                onChange={(e) => setForm({...form, indemnityPerKm: parseFloat(e.target.value) || 0})}
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Prix essence (Rs/L)
                </label>
                <Input
                  type="number"
                  value={form.fuelPrice}
                  onChange={(e) => setForm({...form, fuelPrice: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Consommation (L/100km)
                </label>
                <Input
                  type="number"
                  value={form.consumption}
                  onChange={(e) => setForm({...form, consumption: parseFloat(e.target.value) || 0})}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Vitesse moyenne normale (km/h)
            </label>
            <Input
              type="number"
              value={form.averageSpeed}
              onChange={(e) => setForm({...form, averageSpeed: parseFloat(e.target.value) || 40})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Début heures de pointe
              </label>
              <Input
                type="time"
                value={form.rushHourStart}
                onChange={(e) => setForm({...form, rushHourStart: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Fin heures de pointe
              </label>
              <Input
                type="time"
                value={form.rushHourEnd}
                onChange={(e) => setForm({...form, rushHourEnd: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Vitesse en heures de pointe (km/h)
            </label>
            <Input
              type="number"
              value={form.rushHourSpeed}
              onChange={(e) => setForm({...form, rushHourSpeed: parseFloat(e.target.value) || 25})}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => { onSave(form); onClose() }}>
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
