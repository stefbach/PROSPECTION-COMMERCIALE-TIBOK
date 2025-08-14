// components/dialogs/ai-rules-config.tsx
'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Brain, Settings, Clock, Calendar, Target, MapPin, 
  TrendingUp, Users, AlertCircle, Save, RefreshCw,
  Plus, Trash2, Edit, Check, X, Sparkles, Info,
  Download, Upload
} from 'lucide-react'

// Types pour les règles IA
interface AIRules {
  // Règles de priorisation
  prioritization: {
    hotelWeight: number           // Poids des hôtels (0-100)
    pharmacyWeight: number        // Poids des pharmacies (0-100)
    clinicWeight: number          // Poids des cliniques (0-100)
    scoreThreshold: number        // Score minimum pour considérer un prospect
    newProspectBonus: number      // Bonus pour les nouveaux prospects
    hotLeadMultiplier: number     // Multiplicateur pour prospects chauds
  }
  
  // Règles de planification
  scheduling: {
    startHour: string             // Heure de début de journée
    endHour: string               // Heure de fin de journée
    lunchBreakStart: string       // Début pause déjeuner
    lunchBreakEnd: string         // Fin pause déjeuner
    appointmentDuration: {        // Durée des RDV par type
      decouverte: number
      presentation: number
      negociation: number
      signature: number
      suivi: number
    }
    travelTime: number            // Temps de trajet entre RDV (minutes)
    bufferTime: number            // Temps tampon entre RDV
    maxAppointmentsPerDay: number // Max RDV par jour
  }
  
  // Règles par zone géographique
  zoneRules: {
    [zone: string]: {
      enabled: boolean
      priority: number            // 1-5
      preferredDays: string[]     // Jours préférés
      maxVisitsPerWeek: number
      focusSectors: string[]      // Secteurs prioritaires
      avoidTimes?: string[]       // Créneaux à éviter
    }
  }
  
  // Règles de qualification
  qualification: {
    autoQualifyScore: number     // Score pour qualification auto
    minInteractionBeforeProposal: number // Interactions min avant proposition
    followUpDelayDays: number    // Délai de relance en jours
    maxAttemptsBeforeArchive: number // Tentatives max avant archivage
    hotLeadIndicators: string[]  // Indicateurs de prospect chaud
  }
  
  // Règles commerciales
  commercial: {
    monthlyTarget: number         // Objectif mensuel (Rs)
    conversionTarget: number      // Taux de conversion cible (%)
    averageDealSize: number       // Taille moyenne d'un deal
    focusProducts: string[]       // Produits prioritaires
    upsellThreshold: number       // Seuil pour proposer upsell
    crossSellProducts: string[]   // Produits en cross-sell
  }
  
  // Règles d'optimisation
  optimization: {
    enableAutoRescheduling: boolean // Replanification auto
    preferSameZone: boolean         // Préférer même zone
    groupBySector: boolean          // Grouper par secteur
    optimizeRoute: boolean          // Optimiser les trajets
    weatherConsideration: boolean   // Considérer la météo
    trafficConsideration: boolean   // Considérer le trafic
  }
  
  // Messages et scripts personnalisés
  templates: {
    introductionScript: string     // Script d'introduction
    valueProposition: string        // Proposition de valeur
    objectionHandling: {           // Gestion des objections
      tooExpensive: string
      noNeed: string
      notNow: string
      needToThink: string
    }
    closingScript: string          // Script de closing
    followUpMessage: string        // Message de suivi
  }
}

// Règles par défaut
const DEFAULT_RULES: AIRules = {
  prioritization: {
    hotelWeight: 80,
    pharmacyWeight: 70,
    clinicWeight: 60,
    scoreThreshold: 3,
    newProspectBonus: 10,
    hotLeadMultiplier: 1.5
  },
  scheduling: {
    startHour: '09:00',
    endHour: '17:00',
    lunchBreakStart: '12:00',
    lunchBreakEnd: '13:00',
    appointmentDuration: {
      decouverte: 45,
      presentation: 60,
      negociation: 90,
      signature: 30,
      suivi: 30
    },
    travelTime: 30,
    bufferTime: 15,
    maxAppointmentsPerDay: 8
  },
  zoneRules: {
    'Nord': {
      enabled: true,
      priority: 5,
      preferredDays: ['Mardi', 'Jeudi'],
      maxVisitsPerWeek: 10,
      focusSectors: ['hotel', 'restaurant'],
      avoidTimes: ['08:00-09:00', '17:00-18:00']
    },
    'Centre': {
      enabled: true,
      priority: 4,
      preferredDays: ['Lundi', 'Mercredi', 'Vendredi'],
      maxVisitsPerWeek: 15,
      focusSectors: ['pharmacie', 'clinique', 'entreprise']
    },
    'Ouest': {
      enabled: true,
      priority: 3,
      preferredDays: ['Mercredi', 'Vendredi'],
      maxVisitsPerWeek: 8,
      focusSectors: ['hotel', 'supermarche']
    },
    'Sud': {
      enabled: true,
      priority: 2,
      preferredDays: ['Jeudi'],
      maxVisitsPerWeek: 5,
      focusSectors: ['hotel', 'entreprise']
    },
    'Est': {
      enabled: true,
      priority: 3,
      preferredDays: ['Mardi'],
      maxVisitsPerWeek: 6,
      focusSectors: ['hotel', 'restaurant']
    }
  },
  qualification: {
    autoQualifyScore: 4,
    minInteractionBeforeProposal: 2,
    followUpDelayDays: 3,
    maxAttemptsBeforeArchive: 5,
    hotLeadIndicators: [
      'demande de devis',
      'question sur les prix',
      'intéressé',
      'rappeler',
      'urgent'
    ]
  },
  commercial: {
    monthlyTarget: 500000,
    conversionTarget: 35,
    averageDealSize: 35000,
    focusProducts: ['QR Code Téléconsultation', 'Borne Interactive'],
    upsellThreshold: 50000,
    crossSellProducts: ['Formation Personnel', 'Support Premium']
  },
  optimization: {
    enableAutoRescheduling: true,
    preferSameZone: true,
    groupBySector: true,
    optimizeRoute: true,
    weatherConsideration: false,
    trafficConsideration: true
  },
  templates: {
    introductionScript: "Bonjour, je suis [NOM] de ProspectMed. Nous proposons une solution de téléconsultation médicale innovante via QR Code pour vos clients/patients.",
    valueProposition: "Notre service permet à vos clients d'accéder à un médecin 24/7 en moins de 3 minutes, directement depuis votre établissement.",
    objectionHandling: {
      tooExpensive: "Je comprends votre préoccupation. Considérez ceci comme un investissement qui génère des revenus supplémentaires tout en améliorant votre service client.",
      noNeed: "Beaucoup de nos partenaires pensaient la même chose avant de voir l'impact positif sur leur clientèle. Puis-je vous montrer quelques cas concrets ?",
      notNow: "Je comprends parfaitement. Quand serait le meilleur moment pour rediscuter de cette opportunité ?",
      needToThink: "C'est tout à fait normal. Je vous laisse notre documentation. Puis-je vous recontacter la semaine prochaine pour répondre à vos questions ?"
    },
    closingScript: "Que diriez-vous de commencer avec un essai gratuit d'un mois pour voir les résultats concrets ?",
    followUpMessage: "Suite à notre rencontre, je voulais m'assurer que vous avez toutes les informations nécessaires. Avez-vous des questions ?"
  }
}

interface AIRulesConfigProps {
  open: boolean
  onClose: () => void
  onSave: (rules: AIRules) => void
  currentRules?: AIRules
}

export default function AIRulesConfig({ 
  open, 
  onClose, 
  onSave,
  currentRules = DEFAULT_RULES 
}: AIRulesConfigProps) {
  const [rules, setRules] = React.useState<AIRules>(currentRules)
  const [activeTab, setActiveTab] = React.useState('prioritization')
  const [hasChanges, setHasChanges] = React.useState(false)
  const { toast } = useToast()

  // Sauvegarder dans localStorage
  const saveRules = () => {
    localStorage.setItem('ai_rdv_rules', JSON.stringify(rules))
    onSave(rules)
    setHasChanges(false)
    toast({
      title: '✅ Règles sauvegardées',
      description: 'Les règles IA ont été mises à jour avec succès'
    })
  }

  // Réinitialiser aux valeurs par défaut
  const resetToDefaults = () => {
    if (confirm('Voulez-vous vraiment réinitialiser toutes les règles aux valeurs par défaut ?')) {
      setRules(DEFAULT_RULES)
      setHasChanges(true)
    }
  }

  // Exporter les règles
  const exportRules = () => {
    const dataStr = JSON.stringify(rules, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `ai_rules_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // Importer les règles
  const importRules = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string)
          setRules(imported)
          setHasChanges(true)
          toast({
            title: '✅ Règles importées',
            description: 'Les règles ont été importées avec succès'
          })
        } catch (error) {
          toast({
            title: 'Erreur',
            description: 'Format de fichier invalide',
            variant: 'destructive'
          })
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Configuration des Règles IA pour les RDV
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportRules}
              >
                <Download className="h-4 w-4 mr-1" />
                Exporter
              </Button>
              <label>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-1" />
                    Importer
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={importRules}
                />
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Défaut
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="prioritization">Priorités</TabsTrigger>
            <TabsTrigger value="scheduling">Planning</TabsTrigger>
            <TabsTrigger value="zones">Zones</TabsTrigger>
            <TabsTrigger value="qualification">Qualification</TabsTrigger>
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
            <TabsTrigger value="templates">Scripts</TabsTrigger>
          </TabsList>

          {/* Tab Priorités */}
          <TabsContent value="prioritization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Poids des secteurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Hôtels</Label>
                    <span className="text-sm font-medium">{rules.prioritization.hotelWeight}%</span>
                  </div>
                  <Slider
                    value={[rules.prioritization.hotelWeight]}
                    onValueChange={([value]) => {
                      setRules({...rules, prioritization: {...rules.prioritization, hotelWeight: value}})
                      setHasChanges(true)
                    }}
                    max={100}
                    step={5}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Pharmacies</Label>
                    <span className="text-sm font-medium">{rules.prioritization.pharmacyWeight}%</span>
                  </div>
                  <Slider
                    value={[rules.prioritization.pharmacyWeight]}
                    onValueChange={([value]) => {
                      setRules({...rules, prioritization: {...rules.prioritization, pharmacyWeight: value}})
                      setHasChanges(true)
                    }}
                    max={100}
                    step={5}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Cliniques</Label>
                    <span className="text-sm font-medium">{rules.prioritization.clinicWeight}%</span>
                  </div>
                  <Slider
                    value={[rules.prioritization.clinicWeight]}
                    onValueChange={([value]) => {
                      setRules({...rules, prioritization: {...rules.prioritization, clinicWeight: value}})
                      setHasChanges(true)
                    }}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Score minimum</Label>
                    <Input
                      type="number"
                      value={rules.prioritization.scoreThreshold}
                      onChange={(e) => {
                        setRules({...rules, prioritization: {...rules.prioritization, scoreThreshold: Number(e.target.value)}})
                        setHasChanges(true)
                      }}
                      min={1}
                      max={5}
                    />
                  </div>

                  <div>
                    <Label>Bonus nouveau prospect</Label>
                    <Input
                      type="number"
                      value={rules.prioritization.newProspectBonus}
                      onChange={(e) => {
                        setRules({...rules, prioritization: {...rules.prioritization, newProspectBonus: Number(e.target.value)}})
                        setHasChanges(true)
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Planning */}
          <TabsContent value="scheduling" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Horaires de travail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Début de journée</Label>
                    <Input
                      type="time"
                      value={rules.scheduling.startHour}
                      onChange={(e) => {
                        setRules({...rules, scheduling: {...rules.scheduling, startHour: e.target.value}})
                        setHasChanges(true)
                      }}
                    />
                  </div>

                  <div>
                    <Label>Fin de journée</Label>
                    <Input
                      type="time"
                      value={rules.scheduling.endHour}
                      onChange={(e) => {
                        setRules({...rules, scheduling: {...rules.scheduling, endHour: e.target.value}})
                        setHasChanges(true)
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Début pause déjeuner</Label>
                    <Input
                      type="time"
                      value={rules.scheduling.lunchBreakStart}
                      onChange={(e) => {
                        setRules({...rules, scheduling: {...rules.scheduling, lunchBreakStart: e.target.value}})
                        setHasChanges(true)
                      }}
                    />
                  </div>

                  <div>
                    <Label>Fin pause déjeuner</Label>
                    <Input
                      type="time"
                      value={rules.scheduling.lunchBreakEnd}
                      onChange={(e) => {
                        setRules({...rules, scheduling: {...rules.scheduling, lunchBreakEnd: e.target.value}})
                        setHasChanges(true)
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label>Durée des RDV (minutes)</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {Object.entries(rules.scheduling.appointmentDuration).map(([type, duration]) => (
                      <div key={type} className="flex items-center gap-2">
                        <span className="text-xs capitalize">{type}:</span>
                        <Input
                          type="number"
                          value={duration}
                          onChange={(e) => {
                            setRules({
                              ...rules, 
                              scheduling: {
                                ...rules.scheduling, 
                                appointmentDuration: {
                                  ...rules.scheduling.appointmentDuration,
                                  [type]: Number(e.target.value)
                                }
                              }
                            })
                            setHasChanges(true)
                          }}
                          className="h-8"
                          min={15}
                          max={180}
                          step={15}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Temps de trajet (min)</Label>
                    <Input
                      type="number"
                      value={rules.scheduling.travelTime}
                      onChange={(e) => {
                        setRules({...rules, scheduling: {...rules.scheduling, travelTime: Number(e.target.value)}})
                        setHasChanges(true)
                      }}
                    />
                  </div>

                  <div>
                    <Label>Temps tampon (min)</Label>
                    <Input
                      type="number"
                      value={rules.scheduling.bufferTime}
                      onChange={(e) => {
                        setRules({...rules, scheduling: {...rules.scheduling, bufferTime: Number(e.target.value)}})
                        setHasChanges(true)
                      }}
                    />
                  </div>

                  <div>
                    <Label>Max RDV/jour</Label>
                    <Input
                      type="number"
                      value={rules.scheduling.maxAppointmentsPerDay}
                      onChange={(e) => {
                        setRules({...rules, scheduling: {...rules.scheduling, maxAppointmentsPerDay: Number(e.target.value)}})
                        setHasChanges(true)
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Zones */}
          <TabsContent value="zones" className="space-y-4">
            {Object.entries(rules.zoneRules).map(([zone, zoneRule]) => (
              <Card key={zone}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{zone}</CardTitle>
                    <Switch
                      checked={zoneRule.enabled}
                      onCheckedChange={(checked) => {
                        setRules({
                          ...rules,
                          zoneRules: {
                            ...rules.zoneRules,
                            [zone]: {...zoneRule, enabled: checked}
                          }
                        })
                        setHasChanges(true)
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Priorité (1-5)</Label>
                      <Input
                        type="number"
                        value={zoneRule.priority}
                        onChange={(e) => {
                          setRules({
                            ...rules,
                            zoneRules: {
                              ...rules.zoneRules,
                              [zone]: {...zoneRule, priority: Number(e.target.value)}
                            }
                          })
                          setHasChanges(true)
                        }}
                        min={1}
                        max={5}
                      />
                    </div>

                    <div>
                      <Label>Max visites/semaine</Label>
                      <Input
                        type="number"
                        value={zoneRule.maxVisitsPerWeek}
                        onChange={(e) => {
                          setRules({
                            ...rules,
                            zoneRules: {
                              ...rules.zoneRules,
                              [zone]: {...zoneRule, maxVisitsPerWeek: Number(e.target.value)}
                            }
                          })
                          setHasChanges(true)
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Jours préférés</Label>
                    <div className="flex gap-2 mt-2">
                      {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map(day => (
                        <Badge
                          key={day}
                          variant={zoneRule.preferredDays.includes(day) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            const newDays = zoneRule.preferredDays.includes(day)
                              ? zoneRule.preferredDays.filter(d => d !== day)
                              : [...zoneRule.preferredDays, day]
                            setRules({
                              ...rules,
                              zoneRules: {
                                ...rules.zoneRules,
                                [zone]: {...zoneRule, preferredDays: newDays}
                              }
                            })
                            setHasChanges(true)
                          }}
                        >
                          {day.slice(0, 3)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Tab Qualification */}
          <TabsContent value="qualification" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Règles de qualification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Score auto-qualification</Label>
                    <Input
                      type="number"
                      value={rules.qualification.autoQualifyScore}
                      onChange={(e) => {
                        setRules({...rules, qualification: {...rules.qualification, autoQualifyScore: Number(e.target.value)}})
                        setHasChanges(true)
                      }}
                      min={1}
                      max={5}
                    />
                  </div>

                  <div>
                    <Label>Interactions avant proposition</Label>
                    <Input
                      type="number"
                      value={rules.qualification.minInteractionBeforeProposal}
                      onChange={(e) => {
                        setRules({...rules, qualification: {...rules.qualification, minInteractionBeforeProposal: Number(e.target.value)}})
                        setHasChanges(true)
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Délai de relance (jours)</Label>
                    <Input
                      type="number"
                      value={rules.qualification.followUpDelayDays}
                      onChange={(e) => {
                        setRules({...rules, qualification: {...rules.qualification, followUpDelayDays: Number(e.target.value)}})
                        setHasChanges(true)
                      }}
                    />
                  </div>

                  <div>
                    <Label>Tentatives max avant archivage</Label>
                    <Input
                      type="number"
                      value={rules.qualification.maxAttemptsBeforeArchive}
                      onChange={(e) => {
                        setRules({...rules, qualification: {...rules.qualification, maxAttemptsBeforeArchive: Number(e.target.value)}})
                        setHasChanges(true)
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label>Indicateurs de prospect chaud</Label>
                  <Textarea
                    value={rules.qualification.hotLeadIndicators.join('\n')}
                    onChange={(e) => {
                      setRules({
                        ...rules, 
                        qualification: {
                          ...rules.qualification, 
                          hotLeadIndicators: e.target.value.split('\n').filter(i => i.trim())
                        }
                      })
                      setHasChanges(true)
                    }}
                    rows={5}
                    placeholder="Un indicateur par ligne"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Commercial */}
          <TabsContent value="commercial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Objectifs commerciaux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Objectif mensuel (Rs)</Label>
                    <Input
                      type="number"
                      value={rules.commercial.monthlyTarget}
                      onChange={(e) => {
                        setRules({...rules, commercial: {...rules.commercial, monthlyTarget: Number(e.target.value)}})
                        setHasChanges(true)
                      }}
                    />
                  </div>

                  <div>
                    <Label>Taux de conversion cible (%)</Label>
                    <Input
                      type="number"
                      value={rules.commercial.conversionTarget}
                      onChange={(e) => {
                        setRules({...rules, commercial: {...rules.commercial, conversionTarget: Number(e.target.value)}})
                        setHasChanges(true)
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Taille moyenne deal (Rs)</Label>
                    <Input
                      type="number"
                      value={rules.commercial.averageDealSize}
                      onChange={(e) => {
                        setRules({...rules, commercial: {...rules.commercial, averageDealSize: Number(e.target.value)}})
                        setHasChanges(true)
                      }}
                    />
                  </div>

                  <div>
                    <Label>Seuil upsell (Rs)</Label>
                    <Input
                      type="number"
                      value={rules.commercial.upsellThreshold}
                      onChange={(e) => {
                        setRules({...rules, commercial: {...rules.commercial, upsellThreshold: Number(e.target.value)}})
                        setHasChanges(true)
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Options d'optimisation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(rules.optimization).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="font-normal">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Label>
                    <Switch
                      checked={value as boolean}
                      onCheckedChange={(checked) => {
                        setRules({
                          ...rules,
                          optimization: {...rules.optimization, [key]: checked}
                        })
                        setHasChanges(true)
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Scripts */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Scripts de vente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Script d'introduction</Label>
                  <Textarea
                    value={rules.templates.introductionScript}
                    onChange={(e) => {
                      setRules({...rules, templates: {...rules.templates, introductionScript: e.target.value}})
                      setHasChanges(true)
                    }}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Proposition de valeur</Label>
                  <Textarea
                    value={rules.templates.valueProposition}
                    onChange={(e) => {
                      setRules({...rules, templates: {...rules.templates, valueProposition: e.target.value}})
                      setHasChanges(true)
                    }}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Gestion des objections</Label>
                  {Object.entries(rules.templates.objectionHandling).map(([objection, response]) => (
                    <div key={objection} className="mt-2">
                      <Label className="text-xs capitalize">{objection.replace(/([A-Z])/g, ' $1')}</Label>
                      <Textarea
                        value={response}
                        onChange={(e) => {
                          setRules({
                            ...rules,
                            templates: {
                              ...rules.templates,
                              objectionHandling: {
                                ...rules.templates.objectionHandling,
                                [objection]: e.target.value
                              }
                            }
                          })
                          setHasChanges(true)
                        }}
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <Label>Script de closing</Label>
                  <Textarea
                    value={rules.templates.closingScript}
                    onChange={(e) => {
                      setRules({...rules, templates: {...rules.templates, closingScript: e.target.value}})
                      setHasChanges(true)
                    }}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Message de suivi</Label>
                  <Textarea
                    value={rules.templates.followUpMessage}
                    onChange={(e) => {
                      setRules({...rules, templates: {...rules.templates, followUpMessage: e.target.value}})
                      setHasChanges(true)
                    }}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer avec actions */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Modifications non sauvegardées
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={saveRules}
              disabled={!hasChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder les règles
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook pour utiliser les règles dans l'application
export function useAIRules() {
  const [rules, setRules] = React.useState<AIRules>(DEFAULT_RULES)

  React.useEffect(() => {
    const savedRules = localStorage.getItem('ai_rdv_rules')
    if (savedRules) {
      try {
        setRules(JSON.parse(savedRules))
      } catch (e) {
        console.error('Erreur chargement règles IA:', e)
      }
    }
  }, [])

  return rules
}
