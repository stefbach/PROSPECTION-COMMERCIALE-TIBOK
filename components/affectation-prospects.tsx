'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  MapPin,
  Building2,
  Target,
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Filter,
  ArrowRight,
  Shuffle,
  Calculator,
  BarChart3,
  Info,
  Star,
  Clock,
  Route,
  Zap
} from 'lucide-react'
import { Commercial, calculateDistance, optimizeCircuit } from '@/lib/commercial-system'
import { MAURITIUS_CONFIG, Prospect, District, Secteur } from '@/lib/mauritius-config'
import { useToast } from '@/hooks/use-toast'

interface AffectationSuggestion {
  prospectId: number
  commercialId: string
  score: number
  reasons: string[]
  distance: number
  workload: number
  expertise: number
}

interface CommercialWorkload {
  commercialId: string
  totalProspects: number
  activeProspects: number
  weeklyRdv: number
  conversionRate: number
  capacity: number // Capacité restante en %
}

export function AffectationProspects({ 
  commerciaux,
  onAffectation
}: {
  commerciaux: Commercial[]
  onAffectation?: (affectations: { prospectId: number, commercialId: string }[]) => void
}) {
  const [prospects, setProspects] = React.useState<Prospect[]>([])
  const [selectedProspects, setSelectedProspects] = React.useState<number[]>([])
  const [selectedCommercial, setSelectedCommercial] = React.useState<string>('')
  const [affectationMode, setAffectationMode] = React.useState<'manual' | 'auto' | 'ia'>('manual')
  const [loading, setLoading] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<AffectationSuggestion[]>([])
  const [workloads, setWorkloads] = React.useState<CommercialWorkload[]>([])
  const { toast } = useToast()

  // Filtres
  const [filters, setFilters] = React.useState({
    statut: '',
    secteur: '',
    district: '',
    score: 0,
    nonAffecte: true
  })

  // Charger les prospects non affectés
  React.useEffect(() => {
    loadProspects()
    calculateWorkloads()
  }, [])

  const loadProspects = async () => {
    setLoading(true)
    try {
      // Simuler le chargement des prospects non affectés
      const mockProspects: Prospect[] = [
        {
          id: 101,
          nom: "Hotel Paradise Beach",
          secteur: "hotel",
          ville: "Grand Baie",
          district: "riviere-du-rempart",
          statut: "nouveau",
          contact: "M. Johnson",
          telephone: "+230 5555 1234",
          email: "contact@paradise.mu",
          score: 4,
          budget: "Rs 300k",
          notes: "Urgent - cherche solution pour la saison"
        },
        {
          id: 102,
          nom: "Pharmacie du Centre",
          secteur: "pharmacie",
          ville: "Curepipe",
          district: "plaines-wilhems",
          statut: "qualifie",
          contact: "Dr. Kumar",
          telephone: "+230 5555 2345",
          email: "pharmacie@centre.mu",
          score: 5,
          budget: "Rs 150k",
          notes: "Très intéressé, demande démo"
        },
        {
          id: 103,
          nom: "Assurance Tropicale",
          secteur: "assurance",
          ville: "Port Louis",
          district: "port-louis",
          statut: "nouveau",
          contact: "Mme Chen",
          telephone: "+230 5555 3456",
          email: "info@tropicale.mu",
          score: 3,
          budget: "Rs 500k",
          notes: "Grand compte potentiel"
        },
        {
          id: 104,
          nom: "Restaurant Le Gourmet",
          secteur: "restaurant",
          ville: "Flic en Flac",
          district: "black-river",
          statut: "qualifie",
          contact: "Chef Pierre",
          telephone: "+230 5555 4567",
          email: "legourmet@resto.mu",
          score: 4,
          budget: "Rs 80k",
          notes: "Chaîne de 3 restaurants"
        },
        {
          id: 105,
          nom: "Winners Supermarket Central",
          secteur: "retail",
          ville: "Phoenix",
          district: "plaines-wilhems",
          statut: "nouveau",
          contact: "M. Patel",
          telephone: "+230 5555 5678",
          email: "central@winners.mu",
          score: 3,
          budget: "Rs 200k",
          notes: "Nouvelle succursale"
        }
      ]
      
      setProspects(mockProspects)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les prospects',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateWorkloads = () => {
    // Calculer la charge de travail de chaque commercial
    const loads: CommercialWorkload[] = commerciaux.map(com => ({
      commercialId: com.id,
      totalProspects: com.stats?.nombreProspects || 0,
      activeProspects: Math.round((com.stats?.nombreProspects || 0) * 0.6),
      weeklyRdv: Math.round((com.stats?.rdvPlanifies || 0) / 4),
      conversionRate: com.stats?.tauxConversion || 0,
      capacity: Math.max(0, 100 - ((com.stats?.nombreProspects || 0) / 60 * 100))
    }))
    
    setWorkloads(loads)
  }

  // Calculer les suggestions IA
  const calculateIASuggestions = () => {
    const suggestions: AffectationSuggestion[] = []
    
    prospects.forEach(prospect => {
      commerciaux.forEach(commercial => {
        let score = 0
        const reasons: string[] = []
        
        // 1. Vérifier la compatibilité zone/secteur
        if (!commercial.zones.includes(prospect.district)) {
          return // Skip si pas dans la zone
        }
        if (!commercial.secteurs.includes(prospect.secteur)) {
          return // Skip si pas le bon secteur
        }
        
        // 2. Score basé sur la distance
        const distance = calculateDistance(commercial.adresse.district, prospect.district)
        if (distance === 0) {
          score += 30
          reasons.push('Même district')
        } else if (distance < 30) {
          score += 20
          reasons.push('Proximité géographique')
        } else if (distance < 50) {
          score += 10
        }
        
        // 3. Score basé sur la charge de travail
        const workload = workloads.find(w => w.commercialId === commercial.id)
        if (workload) {
          if (workload.capacity > 50) {
            score += 25
            reasons.push('Capacité disponible')
          } else if (workload.capacity > 25) {
            score += 15
          } else if (workload.capacity > 10) {
            score += 5
          } else {
            score -= 10
            reasons.push('Charge élevée')
          }
        }
        
        // 4. Score basé sur la performance
        if (commercial.stats) {
          if (commercial.stats.tauxConversion > 20) {
            score += 20
            reasons.push('Excellent taux de conversion')
          } else if (commercial.stats.tauxConversion > 15) {
            score += 10
          }
          
          // Bonus pour le ranking
          if (commercial.stats.ranking === 1) {
            score += 15
            reasons.push('Top performer')
          } else if (commercial.stats.ranking === 2) {
            score += 10
          }
        }
        
        // 5. Score basé sur l'urgence du prospect
        if (prospect.statut === 'en-negociation') {
          score += 15
          reasons.push('Négociation en cours')
        } else if (prospect.statut === 'qualifie') {
          score += 10
        }
        
        // 6. Score basé sur le potentiel
        score += prospect.score * 5
        if (prospect.score >= 4) {
          reasons.push('Prospect à fort potentiel')
        }
        
        suggestions.push({
          prospectId: prospect.id,
          commercialId: commercial.id,
          score,
          reasons,
          distance,
          workload: workload?.capacity || 0,
          expertise: commercial.secteurs.includes(prospect.secteur) ? 100 : 0
        })
      })
    })
    
    // Trier par score décroissant
    suggestions.sort((a, b) => b.score - a.score)
    setSuggestions(suggestions)
  }

  // Affectation automatique optimisée
  const autoAffect = () => {
    const affectations: { prospectId: number, commercialId: string }[] = []
    const commercialCounts: Record<string, number> = {}
    
    // Initialiser les compteurs
    commerciaux.forEach(c => {
      commercialCounts[c.id] = 0
    })
    
    // Pour chaque prospect, trouver le meilleur commercial
    prospects.forEach(prospect => {
      const eligibleCommercials = commerciaux.filter(c => 
        c.zones.includes(prospect.district) &&
        c.secteurs.includes(prospect.secteur)
      )
      
      if (eligibleCommercials.length === 0) return
      
      // Trouver le commercial avec le moins de nouvelles affectations
      const bestCommercial = eligibleCommercials.reduce((best, current) => {
        const bestCount = commercialCounts[best.id]
        const currentCount = commercialCounts[current.id]
        const bestWorkload = workloads.find(w => w.commercialId === best.id)
        const currentWorkload = workloads.find(w => w.commercialId === current.id)
        
        // Prioriser la capacité disponible
        if (currentWorkload && bestWorkload) {
          if (currentWorkload.capacity > bestWorkload.capacity + 20) {
            return current
          }
        }
        
        // Sinon, équilibrer les nouvelles affectations
        return currentCount < bestCount ? current : best
      })
      
      affectations.push({
        prospectId: prospect.id,
        commercialId: bestCommercial.id
      })
      
      commercialCounts[bestCommercial.id]++
    })
    
    return affectations
  }

  const handleAffectation = () => {
    if (affectationMode === 'manual') {
      if (selectedProspects.length === 0 || !selectedCommercial) {
        toast({
          title: 'Erreur',
          description: 'Sélectionnez des prospects et un commercial',
          variant: 'destructive'
        })
        return
      }
      
      const affectations = selectedProspects.map(id => ({
        prospectId: id,
        commercialId: selectedCommercial
      }))
      
      onAffectation?.(affectations)
      
      toast({
        title: 'Affectation réussie',
        description: `${selectedProspects.length} prospects affectés`
      })
      
      // Reset
      setSelectedProspects([])
      setSelectedCommercial('')
      loadProspects()
      
    } else if (affectationMode === 'auto') {
      const affectations = autoAffect()
      onAffectation?.(affectations)
      
      toast({
        title: 'Affectation automatique',
        description: `${affectations.length} prospects affectés de manière optimale`
      })
      
      loadProspects()
      
    } else if (affectationMode === 'ia') {
      // Utiliser les suggestions IA
      const bestSuggestions = suggestions
        .filter(s => s.score >= 50)
        .reduce((acc, curr) => {
          // Garder la meilleure suggestion par prospect
          const existing = acc.find(a => a.prospectId === curr.prospectId)
          if (!existing || curr.score > existing.score) {
            return [...acc.filter(a => a.prospectId !== curr.prospectId), curr]
          }
          return acc
        }, [] as AffectationSuggestion[])
      
      const affectations = bestSuggestions.map(s => ({
        prospectId: s.prospectId,
        commercialId: s.commercialId
      }))
      
      onAffectation?.(affectations)
      
      toast({
        title: 'Affectation IA',
        description: `${affectations.length} prospects affectés selon les recommandations IA`
      })
      
      loadProspects()
    }
  }

  const toggleProspect = (id: number) => {
    setSelectedProspects(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    )
  }

  const filteredProspects = React.useMemo(() => {
    return prospects.filter(p => {
      if (filters.statut && p.statut !== filters.statut) return false
      if (filters.secteur && p.secteur !== filters.secteur) return false
      if (filters.district && p.district !== filters.district) return false
      if (filters.score && p.score < filters.score) return false
      return true
    })
  }, [prospects, filters])

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{prospects.length}</div>
            <p className="text-xs text-muted-foreground">Prospects non affectés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{commerciaux.length}</div>
            <p className="text-xs text-muted-foreground">Commerciaux actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Math.round(workloads.reduce((sum, w) => sum + w.capacity, 0) / workloads.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Capacité moyenne</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {suggestions.filter(s => s.score >= 70).length}
            </div>
            <p className="text-xs text-muted-foreground">Matches parfaits</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs pour les modes d'affectation */}
      <Tabs value={affectationMode} onValueChange={(v) => setAffectationMode(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">
            <Users className="mr-2 h-4 w-4" />
            Manuel
          </TabsTrigger>
          <TabsTrigger value="auto">
            <Shuffle className="mr-2 h-4 w-4" />
            Automatique
          </TabsTrigger>
          <TabsTrigger value="ia">
            <Brain className="mr-2 h-4 w-4" />
            IA Optimisée
          </TabsTrigger>
        </TabsList>

        {/* Mode Manuel */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sélection manuelle</CardTitle>
              <CardDescription>
                Choisissez les prospects et le commercial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sélection du commercial */}
              <div>
                <label className="text-sm font-medium mb-2 block">Commercial</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={selectedCommercial}
                  onChange={(e) => setSelectedCommercial(e.target.value)}
                >
                  <option value="">Sélectionner un commercial</option>
                  {commerciaux.map(com => {
                    const workload = workloads.find(w => w.commercialId === com.id)
                    return (
                      <option key={com.id} value={com.id}>
                        {com.prenom} {com.nom} - 
                        Capacité: {workload?.capacity}% - 
                        {com.zones.map(z => MAURITIUS_CONFIG.districts[z].label).join(', ')}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Filtres */}
              <div className="grid grid-cols-4 gap-2">
                <select
                  className="border rounded-md px-3 py-2 text-sm"
                  value={filters.statut}
                  onChange={(e) => setFilters({...filters, statut: e.target.value})}
                >
                  <option value="">Tous statuts</option>
                  {Object.entries(MAURITIUS_CONFIG.statuts).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                
                <select
                  className="border rounded-md px-3 py-2 text-sm"
                  value={filters.secteur}
                  onChange={(e) => setFilters({...filters, secteur: e.target.value})}
                >
                  <option value="">Tous secteurs</option>
                  {Object.entries(MAURITIUS_CONFIG.secteurs).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                
                <select
                  className="border rounded-md px-3 py-2 text-sm"
                  value={filters.district}
                  onChange={(e) => setFilters({...filters, district: e.target.value})}
                >
                  <option value="">Tous districts</option>
                  {Object.entries(MAURITIUS_CONFIG.districts).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                
                <select
                  className="border rounded-md px-3 py-2 text-sm"
                  value={filters.score}
                  onChange={(e) => setFilters({...filters, score: Number(e.target.value)})}
                >
                  <option value="0">Tous scores</option>
                  <option value="3">★★★ et +</option>
                  <option value="4">★★★★ et +</option>
                  <option value="5">★★★★★</option>
                </select>
              </div>

              {/* Liste des prospects */}
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {filteredProspects.map(prospect => (
                  <div
                    key={prospect.id}
                    className={`flex items-center gap-3 p-3 border-b hover:bg-gray-50 cursor-pointer
                      ${selectedProspects.includes(prospect.id) ? 'bg-blue-50' : ''}`}
                    onClick={() => toggleProspect(prospect.id)}
                  >
                    <Checkbox 
                      checked={selectedProspects.includes(prospect.id)}
                      onCheckedChange={() => toggleProspect(prospect.id)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{prospect.nom}</span>
                        <Badge variant="outline" className="text-xs">
                          {MAURITIUS_CONFIG.secteurs[prospect.secteur].icon}
                          {MAURITIUS_CONFIG.secteurs[prospect.secteur].label}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {MAURITIUS_CONFIG.statuts[prospect.statut].label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {prospect.ville}, {MAURITIUS_CONFIG.districts[prospect.district].label} • 
                        {prospect.contact} • Budget: {prospect.budget}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < prospect.score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {selectedProspects.length} prospect(s) sélectionné(s)
                </span>
                <Button 
                  onClick={handleAffectation}
                  disabled={selectedProspects.length === 0 || !selectedCommercial}
                >
                  Affecter
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mode Automatique */}
        <TabsContent value="auto" className="space-y-4">
          <Alert>
            <Shuffle className="h-4 w-4" />
            <AlertDescription>
              L'affectation automatique distribue équitablement les prospects 
              selon les zones et secteurs de chaque commercial, en tenant compte 
              de leur charge de travail actuelle.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aperçu de la distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commerciaux.map(com => {
                  const workload = workloads.find(w => w.commercialId === com.id)
                  const eligibleProspects = prospects.filter(p => 
                    com.zones.includes(p.district) && com.secteurs.includes(p.secteur)
                  )
                  
                  return (
                    <div key={com.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{com.prenom} {com.nom}</p>
                        <p className="text-sm text-muted-foreground">
                          {com.zones.map(z => MAURITIUS_CONFIG.districts[z].label).join(', ')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-lg font-bold">{eligibleProspects.length}</p>
                          <p className="text-xs text-muted-foreground">Prospects éligibles</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-lg font-bold">{workload?.capacity}%</p>
                          <p className="text-xs text-muted-foreground">Capacité</p>
                        </div>
                        
                        <Progress value={100 - (workload?.capacity || 0)} className="w-24" />
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <Button 
                className="w-full mt-4" 
                onClick={handleAffectation}
              >
                <Shuffle className="mr-2 h-4 w-4" />
                Lancer l'affectation automatique
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mode IA */}
        <TabsContent value="ia" className="space-y-4">
          <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <Brain className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              L'IA analyse la distance, la charge de travail, les performances et 
              l'expertise de chaque commercial pour optimiser les affectations.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end">
            <Button 
              variant="outline"
              onClick={calculateIASuggestions}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Calculer les suggestions
            </Button>
          </div>

          {suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommandations IA</CardTitle>
                <CardDescription>
                  Meilleures correspondances prospect-commercial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {suggestions
                    .filter(s => s.score >= 50)
                    .slice(0, 10)
                    .map(suggestion => {
                      const prospect = prospects.find(p => p.id === suggestion.prospectId)
                      const commercial = commerciaux.find(c => c.id === suggestion.commercialId)
                      
                      if (!prospect || !commercial) return null
                      
                      return (
                        <div key={`${suggestion.prospectId}-${suggestion.commercialId}`} 
                             className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{prospect.nom}</span>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-blue-600">
                                {commercial.prenom} {commercial.nom}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {suggestion.reasons.join(' • ')}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">
                                {suggestion.score}
                              </div>
                              <div className="text-xs text-muted-foreground">Score</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-sm font-medium">
                                {suggestion.distance} km
                              </div>
                              <div className="text-xs text-muted-foreground">Distance</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  onClick={handleAffectation}
                  disabled={suggestions.filter(s => s.score >= 50).length === 0}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Appliquer les suggestions IA
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
