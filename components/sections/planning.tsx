"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

// Types simplifiés (compatibles avec mauritius-config)
type District = 'port-louis' | 'pamplemousses' | 'riviere-du-rempart' | 'flacq' | 'grand-port' | 'savanne' | 'plaines-wilhems' | 'moka' | 'riviere-noire'
type Secteur = 'hotel' | 'restaurant' | 'clinique' | 'pharmacie' | 'supermarche' | 'entreprise' | 'ecole' | 'autre'
type Statut = 'nouveau' | 'contacte' | 'qualifie' | 'proposition' | 'negociation' | 'signe' | 'perdu'

// Configuration simplifiée
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

// Matrice des distances entre districts (en km)
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

// Types
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
  commercial: string
  date: string
  heure: string
  duree: number
  type: 'decouverte' | 'demo' | 'negociation' | 'signature' | 'suivi'
  statut: 'planifie' | 'confirme' | 'reporte' | 'annule' | 'termine'
  notes?: string
  priorite?: 'haute' | 'moyenne' | 'basse'
}

interface Tournee {
  commercial: string
  date: string
  rdvs: RendezVous[]
  distanceTotale: number
  tempsDeplacement: number
  tempsTotal: number
  suggestions?: string[]
}

// Fonctions utilitaires
function calculateDistance(from: District, to: District): number {
  return DISTANCE_MATRIX[from]?.[to] || 0
}

function estimateTravelTime(distance: number): number {
  return Math.round((distance / 40) * 60)
}

function calculateFuelCost(distance: number): number {
  const fuelPrice = 65
  const consumption = 8
  return Math.round((distance * consumption * fuelPrice) / 100)
}

function optimizeTour(rdvs: RendezVous[], startDistrict?: District): RendezVous[] {
  if (rdvs.length <= 2) return rdvs

  const optimized: RendezVous[] = []
  const remaining = [...rdvs]
  
  let current = startDistrict 
    ? remaining.find(r => r.prospect.district === startDistrict) || remaining[0]
    : remaining[0]
  
  optimized.push(current)
  remaining.splice(remaining.indexOf(current), 1)
  
  while (remaining.length > 0) {
    let nearest = remaining[0]
    let minDistance = calculateDistance(current.prospect.district, nearest.prospect.district)
    
    for (const rdv of remaining) {
      const distance = calculateDistance(current.prospect.district, rdv.prospect.district)
      if (distance < minDistance) {
        minDistance = distance
        nearest = rdv
      }
    }
    
    optimized.push(nearest)
    remaining.splice(remaining.indexOf(nearest), 1)
    current = nearest
  }
  
  return optimized
}

function analyzeGeographicCoherence(rdvs: RendezVous[]): {
  isCoherent: boolean
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []
  let isCoherent = true
  
  if (rdvs.length < 2) return { isCoherent: true, issues: [], suggestions: [] }
  
  for (let i = 0; i < rdvs.length - 2; i++) {
    const d1 = rdvs[i].prospect.district
    const d2 = rdvs[i + 1].prospect.district
    const d3 = rdvs[i + 2].prospect.district
    
    if (d1 === d3 && d1 !== d2) {
      issues.push(`Aller-retour détecté: ${DISTRICTS_CONFIG[d1].label} → ${DISTRICTS_CONFIG[d2].label} → ${DISTRICTS_CONFIG[d1].label}`)
      isCoherent = false
    }
  }
  
  let currentDistance = 0
  for (let i = 0; i < rdvs.length - 1; i++) {
    currentDistance += calculateDistance(rdvs[i].prospect.district, rdvs[i + 1].prospect.district)
  }
  
  const optimized = optimizeTour(rdvs)
  let optimizedDistance = 0
  for (let i = 0; i < optimized.length - 1; i++) {
    optimizedDistance += calculateDistance(optimized[i].prospect.district, optimized[i + 1].prospect.district)
  }
  
  const savings = currentDistance - optimizedDistance
  if (savings > 10) {
    suggestions.push(`Réorganiser les RDV pourrait économiser ${savings} km`)
    isCoherent = false
  }
  
  const districtCounts = rdvs.reduce((acc, rdv) => {
    acc[rdv.prospect.district] = (acc[rdv.prospect.district] || 0) + 1
    return acc
  }, {} as Record<District, number>)
  
  const districts = Object.keys(districtCounts)
  if (districts.length > 3) {
    suggestions.push(`Trop de districts différents (${districts.length}). Essayez de regrouper par zones`)
    isCoherent = false
  }
  
  const rushHours = rdvs.filter(r => {
    const hour = parseInt(r.heure.split(':')[0])
    return (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)
  })
  
  if (rushHours.length > 0) {
    issues.push(`${rushHours.length} RDV pendant les heures de pointe (embouteillages)`)
  }
  
  return { isCoherent, issues, suggestions }
}

export default function PlanningSection() {
  const [loading, setLoading] = React.useState(true)
  const [prospects, setProspects] = React.useState<Prospect[]>([])
  const [rendezVous, setRendezVous] = React.useState<RendezVous[]>([])
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0])
  const [selectedCommercial, setSelectedCommercial] = React.useState<string>('all')
  const [showAddRdv, setShowAddRdv] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    loadProspects()
  }, [])

  async function loadProspects() {
    try {
      const res = await fetch('/api/prospects?limit=1000')
      const result = await res.json()
      const data = result.data || result
      setProspects(Array.isArray(data) ? data : [])
      generateSampleRdvs(Array.isArray(data) ? data : [])
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

  function generateSampleRdvs(prospectsData: Prospect[]) {
    if (!prospectsData || prospectsData.length === 0) return

    const commerciaux = ['Jean Dupont', 'Marie Martin', 'Paul Bernard']
    const types: RendezVous['type'][] = ['decouverte', 'demo', 'negociation', 'signature', 'suivi']
    const statuts: RendezVous['statut'][] = ['planifie', 'confirme']
    
    const rdvs: RendezVous[] = []
    const today = new Date()
    
    for (let day = 0; day < 7; day++) {
      const date = new Date(today)
      date.setDate(date.getDate() + day)
      const dateStr = date.toISOString().split('T')[0]
      
      commerciaux.forEach(commercial => {
        const rdvCount = Math.min(Math.floor(Math.random() * 3) + 3, prospectsData.length)
        const dayProspects = [...prospectsData].sort(() => Math.random() - 0.5).slice(0, rdvCount)
        
        dayProspects.forEach((prospect, index) => {
          const hour = 9 + index * 2
          rdvs.push({
            id: `rdv-${day}-${commercial}-${index}`,
            prospectId: prospect.id,
            prospect,
            commercial,
            date: dateStr,
            heure: `${hour}:00`,
            duree: 60,
            type: types[Math.floor(Math.random() * types.length)],
            statut: statuts[Math.floor(Math.random() * statuts.length)],
            priorite: prospect.score >= 4 ? 'haute' : prospect.score >= 3 ? 'moyenne' : 'basse',
            notes: `RDV avec ${prospect.contact || 'le responsable'}`
          })
        })
      })
    }
    
    setRendezVous(rdvs)
  }

  const filteredRdvs = React.useMemo(() => {
    return rendezVous.filter(rdv => {
      const dateMatch = rdv.date === selectedDate
      const commercialMatch = selectedCommercial === 'all' || rdv.commercial === selectedCommercial
      return dateMatch && commercialMatch
    })
  }, [rendezVous, selectedDate, selectedCommercial])

  const tournees = React.useMemo((): Tournee[] => {
    const grouped = filteredRdvs.reduce((acc, rdv) => {
      if (!acc[rdv.commercial]) {
        acc[rdv.commercial] = []
      }
      acc[rdv.commercial].push(rdv)
      return acc
    }, {} as Record<string, RendezVous[]>)

    return Object.entries(grouped).map(([commercial, rdvs]) => {
      rdvs.sort((a, b) => a.heure.localeCompare(b.heure))
      
      let distanceTotale = 0
      let tempsDeplacement = 0
      
      for (let i = 0; i < rdvs.length - 1; i++) {
        const distance = calculateDistance(rdvs[i].prospect.district, rdvs[i + 1].prospect.district)
        distanceTotale += distance
        tempsDeplacement += estimateTravelTime(distance)
      }
      
      const tempsTotal = tempsDeplacement + rdvs.reduce((sum, rdv) => sum + rdv.duree, 0)
      const analysis = analyzeGeographicCoherence(rdvs)
      
      return {
        commercial,
        date: selectedDate,
        rdvs,
        distanceTotale,
        tempsDeplacement,
        tempsTotal,
        suggestions: [...analysis.issues, ...analysis.suggestions]
      }
    })
  }, [filteredRdvs, selectedDate])

  const stats = React.useMemo(() => {
    const totalRdvs = filteredRdvs.length
    const totalDistance = tournees.reduce((sum, t) => sum + t.distanceTotale, 0)
    const totalFuel = calculateFuelCost(totalDistance)
    const avgDistance = totalRdvs > 0 ? Math.round(totalDistance / totalRdvs) : 0
    
    let optimizedDistance = 0
    tournees.forEach(tournee => {
      const optimized = optimizeTour(tournee.rdvs)
      for (let i = 0; i < optimized.length - 1; i++) {
        optimizedDistance += calculateDistance(optimized[i].prospect.district, optimized[i + 1].prospect.district)
      }
    })
    
    const potentialSavings = totalDistance - optimizedDistance
    
    return {
      totalRdvs,
      totalDistance,
      totalFuel,
      avgDistance,
      potentialSavings,
      potentialFuelSavings: calculateFuelCost(potentialSavings)
    }
  }, [filteredRdvs, tournees])

  function optimizeTournee(commercial: string) {
    const tournee = tournees.find(t => t.commercial === commercial)
    if (!tournee) return
    
    const optimized = optimizeTour(tournee.rdvs)
    
    const updatedRdvs = rendezVous.map(rdv => {
      if (rdv.commercial === commercial && rdv.date === selectedDate) {
        const index = optimized.findIndex(o => o.id === rdv.id)
        if (index !== -1) {
          const baseHour = 9
          const newHour = baseHour + index * 2
          return { ...rdv, heure: `${newHour}:00` }
        }
      }
      return rdv
    })
    
    setRendezVous(updatedRdvs)
    
    toast({
      title: "Tournée optimisée",
      description: `La tournée de ${commercial} a été réorganisée pour minimiser les déplacements`
    })
  }

  const commerciaux = React.useMemo(() => {
    return Array.from(new Set(rendezVous.map(rdv => rdv.commercial)))
  }, [rendezVous])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          Planning & Optimisation des Tournées
        </h2>
        <p className="text-gray-600">
          Gestion intelligente des rendez-vous commerciaux à Maurice
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">RDV du jour</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRdvs}</p>
              </div>
              <span className="text-2xl">📅</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Distance totale</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDistance} km</p>
              </div>
              <span className="text-2xl">🗺️</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Coût essence</p>
                <p className="text-2xl font-bold text-gray-900">Rs {stats.totalFuel}</p>
              </div>
              <span className="text-2xl">⛽</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Moy. par RDV</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgDistance} km</p>
              </div>
              <span className="text-2xl">📊</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Économies possibles</p>
                <p className="text-2xl font-bold text-green-600">Rs {stats.potentialFuelSavings}</p>
              </div>
              <span className="text-2xl">💰</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres & Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-48"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Commercial</label>
              <select
                value={selectedCommercial}
                onChange={(e) => setSelectedCommercial(e.target.value)}
                className="border rounded-md px-3 py-2 w-48"
              >
                <option value="all">Tous les commerciaux</option>
                {commerciaux.map(com => (
                  <option key={com} value={com}>{com}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={() => setShowAddRdv(true)}>
                ➕ Nouveau RDV
              </Button>
              
              <Button 
                variant="outline"
                className="bg-green-50 text-green-700 border-green-300"
                onClick={() => {
                  tournees.forEach(t => optimizeTournee(t.commercial))
                }}
              >
                🗺️ Optimiser Toutes les Tournées
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats.potentialSavings > 20 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-amber-900">Optimisation recommandée</h3>
              <p className="text-sm text-amber-700 mt-1">
                Les tournées actuelles peuvent être optimisées pour économiser environ {stats.potentialSavings} km
                (Rs {stats.potentialFuelSavings} d'essence). Cliquez sur "Optimiser" pour réorganiser automatiquement.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {tournees.map(tournee => (
          <TourneeCard
            key={tournee.commercial}
            tournee={tournee}
            onOptimize={() => optimizeTournee(tournee.commercial)}
          />
        ))}
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-blue-800">
            💡 Analyse & Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                🗺️ Optimisation Géographique
              </h4>
              <p className="text-sm text-gray-600">
                Regroupez les RDV par districts adjacents. Par exemple, combinez
                Port-Louis avec Plaines Wilhems, ou Flacq avec Grand Port.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                ⏰ Gestion du Temps
              </h4>
              <p className="text-sm text-gray-600">
                Évitez les RDV entre 7h-9h et 16h-18h (heures de pointe).
                Préférez les créneaux 10h-12h et 14h-16h.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                🎯 Priorisation
              </h4>
              <p className="text-sm text-gray-600">
                Concentrez-vous sur les prospects avec un score ≥ 4.
                {stats.totalRdvs > 5 && " Vous avez trop de RDV peu qualifiés aujourd'hui."}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                📊 Performance
              </h4>
              <p className="text-sm text-gray-600">
                Visez 4-5 RDV par jour maximum pour maintenir la qualité.
                Laissez 30 min de battement entre les RDV éloignés.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddRdvDialog
        open={showAddRdv}
        onClose={() => setShowAddRdv(false)}
        prospects={prospects}
        commerciaux={commerciaux}
        onAdd={(rdv) => {
          setRendezVous([...rendezVous, rdv])
          toast({
            title: "RDV ajouté",
            description: "Le rendez-vous a été planifié avec succès"
          })
        }}
      />
    </div>
  )
}

function TourneeCard({ 
  tournee, 
  onOptimize 
}: { 
  tournee: Tournee
  onOptimize: () => void 
}) {
  const hasIssues = tournee.suggestions && tournee.suggestions.length > 0
  const fuelCost = calculateFuelCost(tournee.distanceTotale)
  
  return (
    <Card className={hasIssues ? "border-amber-200" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            <div className="flex items-center gap-2">
              <span>👥</span>
              {tournee.commercial}
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasIssues && (
              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">
                À optimiser
              </span>
            )}
            <Button size="sm" variant="outline" onClick={onOptimize}>
              🗺️ Optimiser
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {tournee.rdvs.map((rdv, index) => {
            const districtConfig = DISTRICTS_CONFIG[rdv.prospect.district]
            const secteurConfig = SECTEURS_CONFIG[rdv.prospect.secteur]
            
            let travelInfo = null
            if (index > 0) {
              const prevRdv = tournee.rdvs[index - 1]
              const distance = calculateDistance(prevRdv.prospect.district, rdv.prospect.district)
              const travelTime = estimateTravelTime(distance)
              travelInfo = { distance, travelTime }
            }
            
            const priorityColors = {
              haute: "border-red-500",
              moyenne: "border-yellow-500",
              basse: "border-green-500"
            }
            
            return (
              <div key={rdv.id}>
                {travelInfo && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 ml-4">
                    <span>🚗</span>
                    <span>{travelInfo.distance} km • {travelInfo.travelTime} min</span>
                  </div>
                )}
                
                <div className={`border-l-4 pl-4 py-2 ${priorityColors[rdv.priorite || 'basse']}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>🕐</span>
                        <span className="font-medium">{rdv.heure}</span>
                        <span className="text-sm text-gray-600">({rdv.duree} min)</span>
                      </div>
                      <div className="mt-1">
                        <span className="font-medium">{rdv.prospect.nom}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          {secteurConfig?.icon} {secteurConfig?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <span>📍</span>
                        <span>{rdv.prospect.ville}, {districtConfig?.label}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded ${
                        rdv.type === 'signature' ? 'bg-green-100 text-green-800' :
                        rdv.type === 'negociation' ? 'bg-orange-100 text-orange-800' :
                        rdv.type === 'demo' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rdv.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Distance</p>
              <p className="font-semibold">{tournee.distanceTotale} km</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Temps route</p>
              <p className="font-semibold">{Math.floor(tournee.tempsDeplacement / 60)}h{tournee.tempsDeplacement % 60}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Coût essence</p>
              <p className="font-semibold">Rs {fuelCost}</p>
            </div>
          </div>
        </div>

        {hasIssues && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg">
            <h4 className="text-sm font-semibold text-amber-900 mb-2">
              Suggestions d'optimisation:
            </h4>
            <ul className="text-sm text-amber-700 space-y-1">
              {tournee.suggestions?.map((suggestion, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span>•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AddRdvDialog({
  open,
  onClose,
  prospects,
  commerciaux,
  onAdd
}: {
  open: boolean
  onClose: () => void
  prospects: Prospect[]
  commerciaux: string[]
  onAdd: (rdv: RendezVous) => void
}) {
  const [form, setForm] = React.useState({
    prospectId: '',
    commercial: commerciaux[0] || '',
    date: new Date().toISOString().split('T')[0],
    heure: '10:00',
    duree: 60,
    type: 'decouverte' as RendezVous['type'],
    notes: ''
  })

  function handleSubmit() {
    const prospect = prospects.find(p => p.id === parseInt(form.prospectId))
    if (!prospect) return

    const rdv: RendezVous = {
      id: `rdv-${Date.now()}`,
      prospectId: prospect.id,
      prospect,
      commercial: form.commercial,
      date: form.date,
      heure: form.heure,
      duree: form.duree,
      type: form.type,
      statut: 'planifie',
      notes: form.notes,
      priorite: prospect.score >= 4 ? 'haute' : prospect.score >= 3 ? 'moyenne' : 'basse'
    }

    onAdd(rdv)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Planifier un rendez-vous</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prospect</label>
            <select
              value={form.prospectId}
              onChange={(e) => setForm({...form, prospectId: e.target.value})}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">Sélectionner un prospect</option>
              {prospects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nom} - {p.ville} ({DISTRICTS_CONFIG[p.district].label})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Commercial</label>
            <select
              value={form.commercial}
              onChange={(e) => setForm({...form, commercial: e.target.value})}
              className="w-full border rounded-md px-3 py-2"
            >
              {commerciaux.map(com => (
                <option key={com} value={com}>{com}</option>
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
                onChange={(e) => setForm({...form, duree: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
              placeholder="Objectifs du RDV, points à aborder..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            Planifier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
