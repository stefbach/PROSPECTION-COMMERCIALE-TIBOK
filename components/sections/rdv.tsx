"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import GoogleMapsService from '@/lib/google-maps-service'

// Configuration - À importer depuis votre fichier config
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

// Types
type District = 'port-louis' | 'pamplemousses' | 'riviere-du-rempart' | 'flacq' | 'grand-port' | 'savanne' | 'plaines-wilhems' | 'moka' | 'riviere-noire'
type Secteur = 'hotel' | 'restaurant' | 'clinique' | 'pharmacie' | 'supermarche' | 'entreprise' | 'ecole' | 'autre'
type Statut = 'nouveau' | 'contacte' | 'qualifie' | 'proposition' | 'negociation' | 'signe' | 'perdu'

// Configuration des districts et secteurs
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
  useGoogleMaps: true
}

const SETTINGS_KEY = 'planning_cost_settings'

export default function PlanningGoogleMapsSection() {
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
  const [apiKeyValid, setApiKeyValid] = React.useState(false)
  const { toast } = useToast()

  // Instance du service Google Maps
  const googleMapsRef = React.useRef<GoogleMapsService | null>(null)

  // Initialiser le service Google Maps
  React.useEffect(() => {
    if (GOOGLE_MAPS_API_KEY) {
      try {
        googleMapsRef.current = new GoogleMapsService(GOOGLE_MAPS_API_KEY)
        setApiKeyValid(true)
        console.log('✅ Service Google Maps initialisé')
      } catch (error) {
        console.error('❌ Erreur initialisation Google Maps:', error)
        setApiKeyValid(false)
        toast({
          title: "Configuration Google Maps",
          description: "Clé API manquante. Les distances seront estimées.",
          variant: "destructive"
        })
      }
    } else {
      setApiKeyValid(false)
      console.warn('⚠️ Clé API Google Maps non configurée')
    }
  }, [])

  // Charger les paramètres
  React.useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY)
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      } catch (e) {
        console.error('Erreur chargement paramètres:', e)
      }
    }
  }, [])

  // Sauvegarder les paramètres
  function saveSettings(newSettings: CostSettings) {
    setSettings(newSettings)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
    toast({
      title: "Paramètres sauvegardés",
      description: newSettings.useGoogleMaps && apiKeyValid ? 
        "Calcul via Google Maps activé" : 
        "Calcul par estimation activé"
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

  // Calculer la distance avec Google Maps ou fallback
  async function calculateDistance(
    origin: Prospect,
    destination: Prospect
  ): Promise<RouteInfo> {
    // Si Google Maps est activé et disponible
    if (settings.useGoogleMaps && googleMapsRef.current && apiKeyValid) {
      try {
        const originAddress = origin.adresse || 
          `${origin.ville}, ${DISTRICTS_CONFIG[origin.district].label}, Mauritius`
        const destAddress = destination.adresse || 
          `${destination.ville}, ${DISTRICTS_CONFIG[destination.district].label}, Mauritius`

        const result = await googleMapsRef.current.calculateDistance(
          originAddress,
          destAddress,
          { useTraffic: true }
        )

        const cost = settings.useIndemnity ?
          Math.round(result.distance * settings.indemnityPerKm) :
          Math.round((result.distance * settings.consumption * settings.fuelPrice) / 100)

        return {
          distance: result.distance,
          duration: result.duration,
          distanceText: result.distanceText,
          durationText: result.durationText,
          cost
        }
      } catch (error) {
        console.error('Erreur calcul Google Maps:', error)
      }
    }

    // Fallback : estimation basique
    const estimatedDistance = 25 // km moyens à Maurice
    const estimatedDuration = Math.round(estimatedDistance / settings.averageSpeed * 60)
    const cost = settings.useIndemnity ?
      Math.round(estimatedDistance * settings.indemnityPerKm) :
      Math.round((estimatedDistance * settings.consumption * settings.fuelPrice) / 100)

    return {
      distance: estimatedDistance,
      duration: estimatedDuration,
      distanceText: `~${estimatedDistance} km`,
      durationText: `~${estimatedDuration} min`,
      cost
    }
  }

  // Calculer toutes les distances pour une journée
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
      
      // Calculer le total
      let totalDistance = 0
      let totalDuration = 0
      let totalCost = 0
      
      newRoutes.forEach(route => {
        totalDistance += route.distance
        totalDuration += route.duration
        totalCost += route.cost
      })

      toast({
        title: "Distances calculées",
        description: `${Math.round(totalDistance)} km - ${Math.round(totalDuration)} min - Rs ${totalCost}`
      })
    } catch (error) {
      console.error('Erreur calcul distances:', error)
      toast({
        title: "Erreur",
        description: "Impossible de calculer les distances",
        variant: "destructive"
      })
    } finally {
      setCalculating(false)
    }
  }

  // Optimiser la tournée avec Google Maps
  async function optimizeTournee() {
    if (!googleMapsRef.current || !apiKeyValid) {
      toast({
        title: "Google Maps non disponible",
        description: "Configuration de l'API requise pour l'optimisation",
        variant: "destructive"
      })
      return
    }

    setCalculating(true)
    
    try {
      const addresses = filteredRdvs.map(rdv => 
        rdv.prospect.adresse || 
        `${rdv.prospect.ville}, ${DISTRICTS_CONFIG[rdv.prospect.district].label}, Mauritius`
      )

      const result = await googleMapsRef.current.optimizeRoute(addresses)
      
      // Réorganiser les RDV selon l'ordre optimisé
      const optimizedRdvs = result.optimizedOrder.map(index => filteredRdvs[index])
      
      // Recalculer les heures
      let currentTime = optimizedRdvs[0]?.heure || '09:00'
      const updatedRdvs = rendezVous.map(rdv => {
        if (rdv.date === selectedDate) {
          const index = optimizedRdvs.findIndex(o => o.id === rdv.id)
          if (index !== -1) {
            if (index === 0) {
              return rdv
            } else {
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
        }
        return rdv
      })
      
      setRendezVous(updatedRdvs)
      saveRdvs(updatedRdvs)
      
      toast({
        title: "Tournée optimisée",
        description: `Économie de ${result.savings} km grâce à Google Maps`
      })
      
      // Recalculer les distances avec le nouvel ordre
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

  // Filtrer les RDV par date
  const filteredRdvs = React.useMemo(() => {
    return rendezVous.filter(rdv => rdv.date === selectedDate)
      .sort((a, b) => a.heure.localeCompare(b.heure))
  }, [rendezVous, selectedDate])

  // Calculer automatiquement les distances quand les RDV changent
  React.useEffect(() => {
    if (filteredRdvs.length >= 2 && settings.useGoogleMaps && apiKeyValid) {
      calculateDayDistances(filteredRdvs)
    }
  }, [filteredRdvs, settings.useGoogleMaps])

  // Calculer les statistiques
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

  // Fonctions CRUD
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
    toast({
      title: "RDV modifié",
      description: "Les modifications ont été enregistrées"
    })
  }

  function deleteRdv(rdvId: string) {
    const newRdvs = rendezVous.filter(rdv => rdv.id !== rdvId)
    setRendezVous(newRdvs)
    saveRdvs(newRdvs)
    toast({
      title: "RDV supprimé",
      description: "Le rendez-vous a été supprimé"
    })
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Planning avec Google Maps {apiKeyValid ? '✅' : '⚠️'}
          </h2>
          <p className="text-gray-600">
            {apiKeyValid ? 
              'Calcul précis des distances avec Google Maps' : 
              'Mode estimation - Configurez Google Maps pour plus de précision'
            }
          </p>
        </div>
        
        <div className="flex gap-2">
          {!apiKeyValid && (
            <Button
              onClick={() => window.open('/api-setup', '_blank')}
              variant="outline"
              className="bg-yellow-50 text-yellow-700 border-yellow-300"
            >
              📚 Guide Config API
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

      {/* Alerte si pas d'API */}
      {!apiKeyValid && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-amber-900">Configuration Google Maps requise</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Pour des calculs précis de distance et d'optimisation, configurez votre clé API Google Maps.
                </p>
                <div className="mt-2 text-sm">
                  <code className="bg-white px-2 py-1 rounded">
                    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=votre_cle_ici
                  </code>
                </div>
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
              <div className="text-2xl mb-1">⏰</div>
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-xl font-bold">
                {Math.floor(stats.tempsTotal / 60)}h{stats.tempsTotal % 60}
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
                {apiKeyValid ? '🌍' : '📍'}
              </div>
              <p className="text-xs text-gray-600">Mode</p>
              <p className="text-sm font-bold">
                {apiKeyValid ? 'Google' : 'Estimation'}
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
                    {calculating ? '⏳' : '📏'} Calculer distances
                  </Button>
                  
                  {apiKeyValid && (
                    <Button 
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-300"
                      onClick={optimizeTournee}
                      disabled={calculating}
                    >
                      {calculating ? '⏳' : '🗺️'} Optimiser (Google)
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Planning de la journée */}
      <Card>
        <CardHeader>
          <CardTitle>
            Planning du {new Date(selectedDate).toLocaleDateString('fr-FR', { 
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
                        <span>🚗 Trajet:</span>
                        <span className="font-medium">{routeInfo.distanceText}</span>
                        <span>⏱️ {routeInfo.durationText}</span>
                        <span>💰 Rs {routeInfo.cost}</span>
                        {apiKeyValid && <span className="text-green-600">✓ Google Maps</span>}
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
                              {secteurConfig?.icon} {secteurConfig?.label} • 
                              Score: {"⭐".repeat(rdv.prospect.score)}
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <div>📍 {rdv.prospect.adresse || `${rdv.prospect.ville}, ${districtConfig?.label}`}</div>
                            {rdv.prospect.contact && <div>👤 {rdv.prospect.contact}</div>}
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
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Supprimer le RDV avec ${rdv.prospect.nom} ?`)) {
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

      {/* Stats Google Maps */}
      {apiKeyValid && googleMapsRef.current && (
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌍</span>
                <div>
                  <p className="font-semibold">Google Maps API Active</p>
                  <p className="text-sm text-gray-600">
                    Stats: {googleMapsRef.current.getStats().requestsToday} requêtes aujourd'hui • 
                    Cache: {googleMapsRef.current.getStats().cacheSize} entrées
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  googleMapsRef.current?.clearCache()
                  toast({ title: "Cache vidé" })
                }}
              >
                Vider cache
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
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
        apiKeyValid={apiKeyValid}
      />
    </div>
  )
}

// Composants Dialog (identiques à la version précédente)
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
  onSave: (rdv: RendezVous) => void
}) {
  const [form, setForm] = React.useState({
    prospectId: rdv?.prospectId?.toString() || '',
    date: rdv?.date || new Date().toISOString().split('T')[0],
    heure: rdv?.heure || '10:00',
    duree: rdv?.duree || 60,
    type: rdv?.type || 'decouverte' as RendezVous['type'],
    statut: rdv?.statut || 'planifie' as RendezVous['statut'],
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
    const prospect = prospects.find(p => p.id === parseInt(form.prospectId))
    if (!prospect) return

    const newRdv: RendezVous = {
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
          <DialogTitle>
            {rdv ? 'Modifier le rendez-vous' : 'Planifier un rendez-vous'}
          </DialogTitle>
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
              <option value="">Sélectionner un prospect</option>
              {prospects.map(p => (
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
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({...form, type: e.target.value as RendezVous['type']})}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="decouverte">Découverte</option>
                <option value="demo">Démonstration</option>
                <option value="negociation">Négociation</option>
                <option value="signature">Signature</option>
                <option value="suivi">Suivi</option>
              </select>
            </div>
            
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
              placeholder="Objectifs, préparation..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!form.prospectId}>
            {rdv ? 'Enregistrer' : 'Planifier'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SettingsDialog({
  open,
  onClose,
  settings,
  onSave,
  apiKeyValid
}: {
  open: boolean
  onClose: () => void
  settings: CostSettings
  onSave: (settings: CostSettings) => void
  apiKeyValid: boolean
}) {
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
          {/* Option Google Maps */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.useGoogleMaps}
                onChange={(e) => setForm({...form, useGoogleMaps: e.target.checked})}
                className="w-4 h-4"
                disabled={!apiKeyValid}
              />
              <div>
                <div className="font-medium">
                  Utiliser Google Maps {apiKeyValid ? '✅' : '❌'}
                </div>
                <div className="text-sm text-gray-600">
                  {apiKeyValid ? 
                    'Calculs précis avec Google Maps API' : 
                    'API non configurée - Mode estimation'
                  }
                </div>
              </div>
            </label>
          </div>

          {/* Type de calcul de coût */}
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
                  Sinon, calcul basé sur la consommation
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
                min="0"
                step="0.5"
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
                  min="0"
                  step="1"
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
                  min="0"
                  step="0.5"
                />
              </div>
            </>
          )}
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
