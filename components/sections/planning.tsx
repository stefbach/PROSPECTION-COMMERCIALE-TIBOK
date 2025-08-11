// components/sections/planning.tsx
// Version unifiée qui détecte automatiquement Google Maps

"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

// Import conditionnel du service Google Maps
let GoogleMapsService: any = null
try {
  GoogleMapsService = require('@/lib/google-maps-service').default
} catch (error) {
  console.log('Service Google Maps non disponible, utilisation du mode estimation')
}

// Configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const HAS_GOOGLE_MAPS = !!(GOOGLE_MAPS_API_KEY && GoogleMapsService)

// Types (identiques pour les deux modes)
type District = 'port-louis' | 'pamplemousses' | 'riviere-du-rempart' | 'flacq' | 'grand-port' | 'savanne' | 'plaines-wilhems' | 'moka' | 'riviere-noire'
type Secteur = 'hotel' | 'restaurant' | 'clinique' | 'pharmacie' | 'supermarche' | 'entreprise' | 'ecole' | 'autre'
type Statut = 'nouveau' | 'contacte' | 'qualifie' | 'proposition' | 'negociation' | 'signe' | 'perdu'

// Matrice de distances pour le fallback
const DISTANCE_MATRIX: Record<District, Record<District, number>> = {
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

interface RouteInfo {
  distance: number
  duration: number
  distanceText: string
  durationText: string
  cost: number
  method: 'google' | 'estimation'
}

interface CostSettings {
  fuelPrice: number
  consumption: number
  indemnityPerKm: number
  averageSpeed: number
  useIndemnity: boolean
  useGoogleMaps: boolean
}

const DEFAULT_SETTINGS: CostSettings = {
  fuelPrice: 65,
  consumption: 8,
  indemnityPerKm: 15,
  averageSpeed: 40,
  useIndemnity: false,
  useGoogleMaps: HAS_GOOGLE_MAPS // Auto-détection
}

const SETTINGS_KEY = 'planning_cost_settings'

/**
 * Composant Planning unifié
 * Utilise Google Maps si disponible, sinon mode estimation
 */
export default function PlanningSection() {
  const [loading, setLoading] = React.useState(true)
  const [calculating, setCalculating] = React.useState(false)
  const [prospects, setProspects] = React.useState<Prospect[]>([])
  const [rendezVous, setRendezVous] = React.useState<RendezVous[]>([])
  const [routes, setRoutes] = React.useState<Map<string, RouteInfo>>(new Map())
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0])
  const [showAddRdv, setShowAddRdv] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  const [editingRdv, setEditingRdv] = React.useState<RendezVous | null>(null)
  const [settings, setSettings] = React.useState<CostSettings>(DEFAULT_SETTINGS)
  const { toast } = useToast()

  // Instance du service Google Maps (si disponible)
  const googleMapsRef = React.useRef<any>(null)

  // Initialisation
  React.useEffect(() => {
    if (HAS_GOOGLE_MAPS && GoogleMapsService) {
      try {
        googleMapsRef.current = new GoogleMapsService(GOOGLE_MAPS_API_KEY)
        console.log('✅ Google Maps activé')
        toast({
          title: "Google Maps activé",
          description: "Calculs de distance précis disponibles"
        })
      } catch (error) {
        console.error('Erreur Google Maps:', error)
      }
    } else {
      console.log('📍 Mode estimation (pas de Google Maps)')
    }
  }, [])

  // Charger les paramètres
  React.useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY)
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ 
          ...DEFAULT_SETTINGS, 
          ...parsed,
          useGoogleMaps: HAS_GOOGLE_MAPS && parsed.useGoogleMaps // Forcer false si pas d'API
        })
      } catch (e) {
        console.error('Erreur chargement paramètres:', e)
      }
    }
  }, [])

  function saveSettings(newSettings: CostSettings) {
    // Forcer useGoogleMaps à false si l'API n'est pas disponible
    const finalSettings = {
      ...newSettings,
      useGoogleMaps: HAS_GOOGLE_MAPS && newSettings.useGoogleMaps
    }
    setSettings(finalSettings)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(finalSettings))
    toast({
      title: "Paramètres sauvegardés",
      description: finalSettings.useGoogleMaps ? 
        "Google Maps activé" : 
        "Mode estimation activé"
    })
  }

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

  function loadRdvs() {
    const savedRdvs = localStorage.getItem('planning_rdvs')
    if (savedRdvs) {
      try {
        const parsed = JSON.parse(savedRdvs)
        setRendezVous(parsed)
      } catch (e) {
        console.error('Erreur chargement RDV:', e)
      }
    }
  }

  function saveRdvs(rdvs: RendezVous[]) {
    localStorage.setItem('planning_rdvs', JSON.stringify(rdvs))
  }

  // Calcul de distance unifié
  async function calculateDistance(
    origin: Prospect,
    destination: Prospect
  ): Promise<RouteInfo> {
    // Essayer Google Maps si disponible et activé
    if (settings.useGoogleMaps && googleMapsRef.current) {
      try {
        const originAddress = origin.adresse || 
          `${origin.ville}, ${DISTRICTS_CONFIG[origin.district].label}, Mauritius`
        const destAddress = destination.adresse || 
          `${destination.ville}, ${DISTRICTS_CONFIG[destination.district].label}, Mauritius`

        const result = await googleMapsRef.current.calculateDistance(
          originAddress,
          destAddress
        )

        const cost = settings.useIndemnity ?
          Math.round(result.distance * settings.indemnityPerKm) :
          Math.round((result.distance * settings.consumption * settings.fuelPrice) / 100)

        return {
          distance: result.distance,
          duration: result.duration,
          distanceText: result.distanceText,
          durationText: result.durationText,
          cost,
          method: 'google'
        }
      } catch (error) {
        console.error('Erreur Google Maps, fallback sur estimation:', error)
      }
    }

    // Fallback : calcul par matrice de districts
    const distance = DISTANCE_MATRIX[origin.district]?.[destination.district] || 25
    const duration = Math.round(distance / settings.averageSpeed * 60)
    const cost = settings.useIndemnity ?
      Math.round(distance * settings.indemnityPerKm) :
      Math.round((distance * settings.consumption * settings.fuelPrice) / 100)

    return {
      distance,
      duration,
      distanceText: `~${distance} km`,
      durationText: `~${duration} min`,
      cost,
      method: 'estimation'
    }
  }

  // Calculer toutes les distances
  async function calculateDayDistances(rdvs: RendezVous[]) {
    if (rdvs.length < 2) return

    setCalculating(true)
    const newRoutes = new Map<string, RouteInfo>()

    try {
      for (let i = 0; i < rdvs.length - 1; i++) {
        const key = `${rdvs[i].id}-${rdvs[i + 1].id}`
        const route = await calculateDistance(
          rdvs[i].prospect,
          rdvs[i + 1].prospect
        )
        newRoutes.set(key, route)
      }

      setRoutes(newRoutes)
      
      let totalDistance = 0
      let totalCost = 0
      
      newRoutes.forEach(route => {
        totalDistance += route.distance
        totalCost += route.cost
      })

      toast({
        title: "Distances calculées",
        description: `${Math.round(totalDistance)} km - Rs ${totalCost} (${
          settings.useGoogleMaps ? 'Google Maps' : 'Estimation'
        })`
      })
    } catch (error) {
      console.error('Erreur calcul distances:', error)
    } finally {
      setCalculating(false)
    }
  }

  // Optimiser la tournée
  async function optimizeTournee() {
    setCalculating(true)
    
    try {
      let optimizedOrder: number[] = []
      
      // Si Google Maps disponible, utiliser son optimisation
      if (settings.useGoogleMaps && googleMapsRef.current) {
        const addresses = filteredRdvs.map(rdv => 
          rdv.prospect.adresse || 
          `${rdv.prospect.ville}, ${DISTRICTS_CONFIG[rdv.prospect.district].label}, Mauritius`
        )

        const result = await googleMapsRef.current.optimizeRoute(addresses)
        optimizedOrder = result.optimizedOrder
        
        toast({
          title: "Tournée optimisée (Google)",
          description: `Économie de ${result.savings} km`
        })
      } else {
        // Algorithme simple du plus proche voisin
        const visited = new Set<number>()
        optimizedOrder = [0]
        visited.add(0)
        
        let current = 0
        
        while (visited.size < filteredRdvs.length) {
          let nearest = -1
          let minDistance = Infinity
          
          for (let i = 0; i < filteredRdvs.length; i++) {
            if (!visited.has(i)) {
              const dist = DISTANCE_MATRIX[
                filteredRdvs[current].prospect.district
              ]?.[filteredRdvs[i].prospect.district] || 999
              
              if (dist < minDistance) {
                minDistance = dist
                nearest = i
              }
            }
          }
          
          if (nearest !== -1) {
            optimizedOrder.push(nearest)
            visited.add(nearest)
            current = nearest
          }
        }
        
        toast({
          title: "Tournée optimisée",
          description: "Ordre réorganisé pour minimiser les distances"
        })
      }
      
      // Réorganiser les RDV
      const optimizedRdvs = optimizedOrder.map(index => filteredRdvs[index])
      
      // Recalculer les heures
      const updatedRdvs = rendezVous.map(rdv => {
        if (rdv.date === selectedDate) {
          const index = optimizedRdvs.findIndex(o => o.id === rdv.id)
          if (index !== -1 && index > 0) {
            const prevRdv = optimizedRdvs[index - 1]
            const routeKey = `${prevRdv.id}-${rdv.id}`
            const route = routes.get(routeKey)
            const travelTime = route?.duration || 30
            
            const [prevHour, prevMin] = prevRdv.heure.split(':').map(Number)
            const totalMinutes = prevHour * 60 + prevMin + prevRdv.duree + travelTime
            const newHour = Math.floor(totalMinutes / 60)
            const newMin = totalMinutes % 60
            
            return {
              ...rdv,
              heure: `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`
            }
          }
        }
        return rdv
      })
      
      setRendezVous(updatedRdvs)
      saveRdvs(updatedRdvs)
      
      // Recalculer les distances
      await calculateDayDistances(optimizedRdvs)
    } catch (error) {
      console.error('Erreur optimisation:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'optimiser la tournée",
        variant: "destructive"
      })
    } finally {
      setCalculating(false)
    }
  }

  const filteredRdvs = React.useMemo(() => {
    return rendezVous.filter(rdv => rdv.date === selectedDate)
      .sort((a, b) => a.heure.localeCompare(b.heure))
  }, [rendezVous, selectedDate])

  React.useEffect(() => {
    if (filteredRdvs.length >= 2) {
      calculateDayDistances(filteredRdvs)
    }
  }, [filteredRdvs])

  const stats = React.useMemo(() => {
    let distanceTotale = 0
    let tempsDeplacement = 0
    let coutTotal = 0
    
    routes.forEach(route => {
      distanceTotale += route.distance
      tempsDeplacement += route.duration
      coutTotal += route.cost
    })
    
    const tempsTotal = tempsDeplacement + filteredRdvs.reduce((sum, rdv) => sum + rdv.duree, 0)
    
    return {
      totalRdvs: filteredRdvs.length,
      distanceTotale: Math.round(distanceTotale * 10) / 10,
      tempsDeplacement: Math.round(tempsDeplacement),
      tempsTotal: Math.round(tempsTotal),
      coutTotal: Math.round(coutTotal)
    }
  }, [filteredRdvs, routes])

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
      {/* Header avec indicateur de mode */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Planning & Optimisation
          </h2>
          <p className="text-gray-600">
            Mode : {settings.useGoogleMaps && HAS_GOOGLE_MAPS ? 
              '🌍 Google Maps (précis)' : 
              '📍 Estimation par district'
            }
          </p>
        </div>
        
        <div className="flex gap-2">
          {!HAS_GOOGLE_MAPS && (
            <Button
              onClick={() => window.open('https://console.cloud.google.com', '_blank')}
              variant="outline"
              className="bg-yellow-50 text-yellow-700 border-yellow-300"
            >
              📚 Configurer Google Maps
            </Button>
          )}
          
          <Button
            onClick={() => setShowSettings(true)}
            variant="outline"
            className="bg-gray-50"
          >
            ⚙️ Paramètres
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <p className="text-xs text-gray-600">Distance</p>
              <p className="text-xl font-bold">{stats.distanceTotale} km</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">⏱️</div>
              <p className="text-xs text-gray-600">Route</p>
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
              <div className="text-2xl mb-1">
                {settings.useGoogleMaps ? '🌍' : '📍'}
              </div>
              <p className="text-xs text-gray-600">Calcul</p>
              <p className="text-sm font-bold">
                {settings.useGoogleMaps ? 'Précis' : 'Estimé'}
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
              
              {filteredRdvs.length > 1 && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => calculateDayDistances(filteredRdvs)}
                    disabled={calculating}
                  >
                    {calculating ? '⏳' : '📏'} Calculer
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-300"
                    onClick={optimizeTournee}
                    disabled={calculating}
                  >
                    {calculating ? '⏳' : '🗺️'} Optimiser
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planning de la journée */}
      <Card>
        <CardHeader>
          <CardTitle>Planning du {selectedDate}</CardTitle>
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
              {filteredRdvs.map((rdv, index) => {
                const districtConfig = DISTRICTS_CONFIG[rdv.prospect.district]
                const secteurConfig = SECTEURS_CONFIG[rdv.prospect.secteur]
                
                let routeInfo = null
                if (index > 0) {
                  const prevRdv = filteredRdvs[index - 1]
                  const routeKey = `${prevRdv.id}-${rdv.id}`
                  routeInfo = routes.get(routeKey)
                }
                
                const priorityColors = {
                  haute: "border-red-500 bg-red-50",
                  moyenne: "border-yellow-500 bg-yellow-50",
                  basse: "border-green-500 bg-green-50"
                }
                
                return (
                  <div key={rdv.id}>
                    {routeInfo && (
                      <div className="flex items-center gap-4 text-xs text-gray-600 mb-1 ml-4 bg-gray-50 rounded p-2">
                        <span>🚗 {routeInfo.distanceText}</span>
                        <span>⏱️ {routeInfo.durationText}</span>
                        <span>💰 Rs {routeInfo.cost}</span>
                        <span className={routeInfo.method === 'google' ? 'text-green-600' : 'text-gray-500'}>
                          {routeInfo.method === 'google' ? '✓ Google' : '~ Estimé'}
                        </span>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs (simplifiés, code identique aux versions précédentes) */}
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
        onSave={saveSettings}
        hasGoogleMaps={HAS_GOOGLE_MAPS}
      />
    </div>
  )
}

// Composants Dialog (versions simplifiées)
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

function SettingsDialog({ open, onClose, settings, onSave, hasGoogleMaps }: any) {
  const [form, setForm] = React.useState(settings)

  React.useEffect(() => {
    setForm(settings)
  }, [settings])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>⚙️ Paramètres</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {hasGoogleMaps && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.useGoogleMaps}
                  onChange={(e) => setForm({...form, useGoogleMaps: e.target.checked})}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium">Utiliser Google Maps</div>
                  <div className="text-sm text-gray-600">
                    Calculs précis avec l'API Google
                  </div>
                </div>
              </label>
            </div>
          )}

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
