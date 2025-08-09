// components/ai-dashboard.tsx
'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  Brain,
  Calendar,
  MapPin,
  TrendingUp,
  Target,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Phone,
  Mail,
  User,
  BarChart3,
  Navigation,
  Zap,
  Send
} from 'lucide-react'

interface NextAction {
  prospect: string
  action: string
  raison: string
  urgence: 'immediate' | 'aujourd\'hui' | 'cette_semaine' | 'ce_mois'
  scriptSuggere?: string
  resultatAttendu?: string
}

interface ProspectAnalysis {
  score: number
  potentielRevenu: number
  probabiliteConversion: number
  meilleureApproche: string
  argumentsVente: string[]
  objectionsProbables: string[]
  prochainnesActions: Array<{
    action: string
    deadline: string
    priorite: string
  }>
  insights: string[]
}

export function AIDashboard({ commercial }: { commercial: string }) {
  const [loading, setLoading] = React.useState(false)
  const [nextActions, setNextActions] = React.useState<NextAction[]>([])
  const [selectedProspect, setSelectedProspect] = React.useState<any>(null)
  const [prospectAnalysis, setProspectAnalysis] = React.useState<ProspectAnalysis | null>(null)
  const [chatMessage, setChatMessage] = React.useState('')
  const [chatHistory, setChatHistory] = React.useState<Array<{ role: string; content: string }>>([])
  const [optimizationResult, setOptimizationResult] = React.useState<any>(null)
  const { toast } = useToast()

  // Charger les prochaines actions suggérées
  const loadNextActions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/next-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commercial })
      })
      
      if (res.ok) {
        const actions = await res.json()
        setNextActions(actions)
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les suggestions IA',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Analyser un prospect
  const analyzeProspect = async (prospectId: number) => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/analyze-prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId })
      })
      
      if (res.ok) {
        const analysis = await res.json()
        setProspectAnalysis(analysis)
        toast({
          title: 'Analyse complète',
          description: `Score IA: ${analysis.score}/100`
        })
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'analyse',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Optimiser le planning
  const optimizePlanning = async () => {
    setLoading(true)
    try {
      // Récupérer les RDV du jour
      const today = new Date().toISOString().split('T')[0]
      const appointmentsRes = await fetch(`/api/appointments?date=${today}&commercial=${commercial}`)
      const appointments = await appointmentsRes.json()
      
      const res = await fetch('/api/ai/optimize-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commercial,
          date: today,
          appointments,
          constraints: {
            startTime: '08:30',
            endTime: '17:30',
            lunchBreak: true
          }
        })
      })
      
      if (res.ok) {
        const optimization = await res.json()
        setOptimizationResult(optimization)
        toast({
          title: 'Planning optimisé',
          description: `Économie: ${optimization.savings.kmSaved}km, ${optimization.savings.timeSaved}min`
        })
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'optimisation',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Chat avec l'assistant IA
  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return
    
    const userMessage = chatMessage
    setChatMessage('')
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }])
    
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          userId: commercial,
          context: {
            currentProspectId: selectedProspect?.id
          }
        })
      })
      
      if (res.ok) {
        const { response } = await res.json()
        setChatHistory(prev => [...prev, { role: 'assistant', content: response }])
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de communication avec l\'IA',
        variant: 'destructive'
      })
    }
  }

  React.useEffect(() => {
    loadNextActions()
  }, [commercial])

  const urgencyColors = {
    immediate: 'bg-red-500',
    'aujourd\'hui': 'bg-orange-500',
    'cette_semaine': 'bg-yellow-500',
    'ce_mois': 'bg-blue-500'
  }

  const urgencyIcons = {
    immediate: <Zap className="h-4 w-4" />,
    'aujourd\'hui': <Clock className="h-4 w-4" />,
    'cette_semaine': <Calendar className="h-4 w-4" />,
    'ce_mois': <Target className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* En-tête IA */}
      <Card className="border-gradient bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Assistant IA ProspectMed</CardTitle>
                <CardDescription>
                  Intelligence artificielle pour optimiser vos ventes
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              GPT-4 Turbo
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="actions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="actions">Actions Suggérées</TabsTrigger>
          <TabsTrigger value="planning">Optimisation Planning</TabsTrigger>
          <TabsTrigger value="analysis">Analyse Prospects</TabsTrigger>
          <TabsTrigger value="assistant">Assistant Chat</TabsTrigger>
        </TabsList>

        {/* Tab 1: Actions Suggérées */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Prochaines Actions Recommandées
                </CardTitle>
                <Button onClick={loadNextActions} disabled={loading} size="sm">
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextActions.length === 0 && !loading && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucune action suggérée. Cliquez sur Actualiser pour générer des recommandations.
                  </AlertDescription>
                </Alert>
              )}
              
              {nextActions.map((action, index) => (
                <Card key={index} className="border-l-4" style={{ borderLeftColor: urgencyColors[action.urgence] }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={urgencyColors[action.urgence]}>
                            {urgencyIcons[action.urgence]}
                            {action.urgence.replace('_', ' ')}
                          </Badge>
                          <span className="font-semibold">{action.prospect}</span>
                        </div>
                        
                        <p className="text-sm font-medium">{action.action}</p>
                        <p className="text-xs text-muted-foreground">{action.raison}</p>
                        
                        {action.scriptSuggere && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-blue-600 hover:underline">
                              Voir le script suggéré
                            </summary>
                            <div className="mt-2 p-3 bg-muted rounded text-xs">
                              {action.scriptSuggere}
                            </div>
                          </details>
                        )}
                        
                        {action.resultatAttendu && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Résultat attendu: {action.resultatAttendu}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Optimisation Planning */}
        <TabsContent value="planning" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Optimisation de Tournée
                </CardTitle>
                <Button onClick={optimizePlanning} disabled={loading}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Optimiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {optimizationResult ? (
                <div className="space-y-4">
                  {/* Métriques d'économies */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Distance économisée</p>
                            <p className="text-2xl font-bold text-green-600">
                              -{optimizationResult.savings.kmSaved} km
                            </p>
                          </div>
                          <MapPin className="h-8 w-8 text-green-600 opacity-20" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Temps gagné</p>
                            <p className="text-2xl font-bold text-blue-600">
                              -{optimizationResult.savings.timeSaved} min
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-blue-600 opacity-20" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Carburant économisé</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {optimizationResult.savings.fuelCostSaved} MUR
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-purple-600 opacity-20" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Itinéraire optimisé */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Itinéraire Optimisé</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {optimizationResult.optimizedRoute.map((stop: any, index: number) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{stop.heure} - {stop.nom}</p>
                              <p className="text-xs text-muted-foreground">
                                {stop.distanceKm}km • {stop.tempsTrajet}min • Durée: {stop.duree}min
                              </p>
                            </div>
                            <Badge variant={stop.priorite === 'urgente' ? 'destructive' : 'secondary'}>
                              {stop.priorite}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Suggestions IA */}
                  {optimizationResult.suggestions && optimizationResult.suggestions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Suggestions d'Optimisation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {optimizationResult.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Cliquez sur "Optimiser" pour générer un itinéraire optimisé avec l'IA.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Analyse Prospects */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analyse IA des Prospects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sélecteur de prospect */}
              <div className="flex gap-2">
                <Input
                  placeholder="ID du prospect à analyser"
                  type="number"
                  onChange={(e) => setSelectedProspect({ id: parseInt(e.target.value) })}
                />
                <Button
                  onClick={() => selectedProspect && analyzeProspect(selectedProspect.id)}
                  disabled={!selectedProspect || loading}
                >
                  Analyser
                </Button>
              </div>

              {/* Résultats de l'analyse */}
              {prospectAnalysis && (
                <div className="space-y-4">
                  {/* Score et métriques */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Score IA</p>
                        <div className="flex items-end gap-2">
                          <p className="text-3xl font-bold">{prospectAnalysis.score}</p>
                          <span className="text-sm text-muted-foreground">/100</span>
                        </div>
                        <Progress value={prospectAnalysis.score} className="mt-2" />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Probabilité conversion</p>
                        <div className="flex items-end gap-2">
                          <p className="text-3xl font-bold">{prospectAnalysis.probabiliteConversion}%</p>
                        </div>
                        <Progress value={prospectAnalysis.probabiliteConversion} className="mt-2" />
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Potentiel revenu/an</p>
                        <p className="text-2xl font-bold">
                          {prospectAnalysis.potentielRevenu.toLocaleString()} MUR
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Approche recommandée */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Meilleure Approche</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{prospectAnalysis.meilleureApproche}</p>
                    </CardContent>
                  </Card>

                  {/* Arguments de vente */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm text-green-600">Arguments de Vente</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {prospectAnalysis.argumentsVente.map((arg, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                              <span>{arg}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm text-orange-600">Objections Probables</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {prospectAnalysis.objectionsProbables.map((obj, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Prochaines actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Plan d'Action Recommandé</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {prospectAnalysis.prochainnesActions.map((action, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex items-center gap-2">
                              <Badge variant={action.priorite === 'haute' ? 'destructive' : 'secondary'}>
                                {action.priorite}
                              </Badge>
                              <span className="text-sm">{action.action}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{action.deadline}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Assistant Chat */}
        <TabsContent value="assistant" className="space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Assistant IA Conversationnel
              </CardTitle>
              <CardDescription>
                Posez vos questions sur les prospects, stratégies de vente, ou demandez des conseils
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-4 bg-muted/50 rounded">
                {chatHistory.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Commencez une conversation avec l'assistant IA</p>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs">Exemples de questions:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => setChatMessage("Comment approcher un hôtel 5 étoiles?")}
                        >
                          Comment approcher un hôtel 5 étoiles?
                        </Badge>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => setChatMessage("Quels sont les meilleurs arguments pour la télémédecine?")}
                        >
                          Arguments télémédecine
                        </Badge>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => setChatMessage("Comment gérer l'objection sur le prix?")}
                        >
                          Gérer objection prix
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {msg.role === 'assistant' && (
                          <Brain className="h-4 w-4 mt-0.5" />
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Posez votre question..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendChatMessage()
                    }
                  }}
                  className="flex-1 min-h-[60px] max-h-[120px]"
                />
                <Button onClick={sendChatMessage} disabled={!chatMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
