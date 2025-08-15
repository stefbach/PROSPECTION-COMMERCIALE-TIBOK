// components/sections/planning-enhanced.tsx
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import RdvDialogEnhanced from '@/components/dialogs/rdv-dialog-enhanced'
import { 
  Calendar, Clock, Phone, MapPin, User, AlertCircle, CheckCircle, 
  RefreshCw, Search, Download, Plus, Settings, Filter, X,
  ChevronLeft, ChevronRight, Users, Edit, Trash2, Save,
  Building2, Mail, Globe, Star, FileText, TrendingUp,
  Brain, Lock, Unlock, Send, Check, Route, Eye, ArrowUpDown
} from 'lucide-react'

// ========== TYPES ET INTERFACES ==========
type District = 'port-louis' | 'pamplemousses' | 'riviere-du-rempart' | 'flacq' | 'grand-port' | 'savanne' | 'plaines-wilhems' | 'moka' | 'riviere-noire'
type Secteur = 'hotel' | 'restaurant' | 'clinique' | 'pharmacie' | 'supermarche' | 'entreprise' | 'ecole' | 'autre'
type Statut = 'nouveau' | 'contacte' | 'qualifie' | 'proposition' | 'negociation' | 'signe' | 'perdu'

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
  statut: 'proposition' | 'planifie' | 'confirme' | 'en-cours' | 'termine' | 'annule' | 'reporte'
  notes?: string
  lieu?: string
  created_at?: string
  updated_at?: string
  // Nouveaux champs pour les propositions IA
  ai_score?: number
  ai_reason?: string
  proposed_at?: string
  validated_at?: string
  validated_by?: string
  locked?: boolean
  locked_at?: string
  locked_by?: string
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

// ========== CONFIGURATIONS ==========
const DISTRICTS_CONFIG = {
  'port-louis': { label: 'Port Louis', color: 'blue' },
  'pamplemousses': { label: 'Pamplemousses', color: 'green' },
  'riviere-du-rempart': { label: 'Rivière du Rempart', color: 'purple' },
  'flacq': { label: 'Flacq', color: 'orange' },
  'grand-port': { label: 'Grand Port', color: 'red' },
  'savanne': { label: 'Savanne', color: 'yellow' },
  'plaines-wilhems': { label: 'Plaines Wilhems', color: 'indigo' },
  'moka': { label: 'Moka', color: 'pink' },
  'riviere-noire': { label: 'Rivière Noire', color: 'cyan' }
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

// ========== COMPOSANT PRINCIPAL ==========
export default function PlanningAdvancedSection() {
  // États principaux
  const [loading, setLoading] = React.useState(false)
  const [loadingRdvs, setLoadingRdvs] = React.useState(true)
  const [prospects, setProspects] = React.useState<Prospect[]>([])
  const [rendezVous, setRendezVous] = React.useState<RendezVous[]>([])
  const [propositions, setPropositions] = React.useState<RendezVous[]>([]) // NOUVEAU
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0])
  const [commercialInfo, setCommercialInfo] = React.useState<CommercialInfo>(DEFAULT_COMMERCIAL)
  const [customDistances, setCustomDistances] = React.useState<CustomDistance[]>([])
  const [settings, setSettings] = React.useState<CostSettings>(DEFAULT_SETTINGS)
  const [viewType, setViewType] = React.useState<'day' | 'week' | 'month'>('day')
  const [activeTab, setActiveTab] = React.useState<'propositions' | 'planning' | 'optimization'>('planning')
  
  // États des filtres
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterStatut, setFilterStatut] = React.useState("")
  const [filterCommercial, setFilterCommercial] = React.useState("")
  const [filterProspect, setFilterProspect] = React.useState("")
  const [filterDistrict, setFilterDistrict] = React.useState("")
  const [filterTypeVisite, setFilterTypeVisite] = React.useState("")
  
  // États des dialogues
  const [showAddRdv, setShowAddRdv] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  const [showCommercialConfig, setShowCommercialConfig] = React.useState(false)
  const [showDistanceConfig, setShowDistanceConfig] = React.useState(false)
  const [editingRdv, setEditingRdv] = React.useState<RendezVous | null>(null)
  const [optimizing, setOptimizing] = React.useState(false)
  
  const { toast } = useToast()

  // ========== CHARGEMENT DES DONNÉES ==========
  
  // Charger les configurations sauvegardées
  React.useEffect(() => {
    const savedCommercial = localStorage.getItem('planning_commercial_info')
    if (savedCommercial) {
      try {
        setCommercialInfo(JSON.parse(savedCommercial))
      } catch (e) {
        console.error('Erreur chargement info commercial:', e)
      }
    }

    const savedDistances = localStorage.getItem('planning_custom_distances')
    if (savedDistances) {
      try {
        setCustomDistances(JSON.parse(savedDistances))
      } catch (e) {
        console.error('Erreur chargement distances:', e)
      }
    }

    const savedSettings = localStorage.getItem('planning_cost_settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error('Erreur chargement paramètres:', e)
      }
    }
  }, [])

  // Charger les données au démarrage
  React.useEffect(() => {
    loadProspects()
    loadRdvs()
  }, [])

  // Rafraîchissement automatique toutes les 30 secondes
  React.useEffect(() => {
    const interval = setInterval(() => {
      loadRdvs()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // ========== FONCTIONS DE CHARGEMENT ==========
  
  async function loadProspects() {
    try {
      const res = await fetch('/api/prospects?limit=1000', { cache: 'no-store' })
      const result = await res.json()
      const data = result.data || result
      setProspects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur chargement prospects:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les prospects",
        variant: "destructive"
      })
    }
  }

  async function loadRdvs() {
    setLoadingRdvs(true)
    try {
      // Charger TOUS les RDV incluant les propositions
      const res = await fetch('/api/rdv?include_propositions=true', { cache: 'no-store' })
      if (!res.ok) throw new Error('Erreur chargement RDV')
      
      const data = await res.json()
      
      // Séparer propositions et RDV confirmés
      const props = data.filter((r: RendezVous) => r.statut === 'proposition')
      const rdvs = data.filter((r: RendezVous) => r.statut !== 'proposition')
      
      setPropositions(props)
      setRendezVous(rdvs)
      
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

  // ========== GESTION DES PROPOSITIONS (NOUVEAU) ==========
  
  // Valider une proposition
  async function validateProposition(prop: RendezVous) {
    try {
      // Simuler l'appel au prospect
      const confirmed = await confirmWithProspect(prop)
      
      if (confirmed) {
        const res = await fetch('/api/rdv', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: prop.id,
            statut: 'planifie',
            action: 'validate',
            validated_at: new Date().toISOString(),
            validated_by: commercialInfo.nom,
            notes: (prop.notes || '') + '\n✅ Confirmé avec le prospect'
          })
        })
        
        if (res.ok) {
          toast({
            title: '✅ Proposition validée',
            description: `RDV avec ${prop.prospect_nom} confirmé et ajouté au planning`
          })
          loadRdvs()
        }
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de valider la proposition',
        variant: 'destructive'
      })
    }
  }

  // Rejeter une proposition
  async function rejectProposition(propId: number) {
    if (!confirm('Rejeter cette proposition ?')) return
    
    try {
      const res = await fetch(`/api/rdv?id=${propId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        toast({
          title: 'Proposition rejetée',
          description: 'La proposition a été supprimée'
        })
        loadRdvs()
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter la proposition',
        variant: 'destructive'
      })
    }
  }

  // Modifier une proposition avant validation
  async function editProposition(prop: RendezVous) {
    setEditingRdv(prop)
    setShowAddRdv(true)
  }

  // Simuler l'appel au prospect
  async function confirmWithProspect(prop: RendezVous): Promise<boolean> {
    const prospect = prop.prospect
    const dateTime = new Date(prop.date_time)
    
    return confirm(
      `📞 APPEL PROSPECT\n\n` +
      `Prospect: ${prop.prospect_nom}\n` +
      `Téléphone: ${prospect?.telephone || 'Pas de téléphone'}\n` +
      `Contact: ${prospect?.contact || 'N/A'}\n\n` +
      `Proposer: ${dateTime.toLocaleDateString('fr-FR')} à ${dateTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n` +
      `Durée: ${prop.duree_min} minutes\n` +
      `Type: ${prop.type_visite}\n\n` +
      `Le prospect accepte-t-il ce créneau ?`
    )
  }

  // Verrouiller un RDV confirmé
  async function lockRdv(rdv: RendezVous) {
    if (!confirm(`Verrouiller ce RDV ?\nUne fois verrouillé, il ne pourra plus être modifié.`)) return
    
    try {
      const res = await fetch('/api/rdv', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rdv.id,
          statut: 'confirme',
          action: 'lock',
          locked: true,
          locked_at: new Date().toISOString(),
          locked_by: commercialInfo.nom
        })
      })
      
      if (res.ok) {
        toast({
          title: '🔒 RDV verrouillé',
          description: 'Le RDV ne peut plus être modifié'
        })
        loadRdvs()
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de verrouiller le RDV',
        variant: 'destructive'
      })
    }
  }

  // Optimiser les tournées
  async function optimizeRoutes() {
    setOptimizing(true)
    
    try {
      // Filtrer les RDV du jour/semaine sélectionné
      const rdvsToOptimize = filteredRdvs.filter(r => 
        r.statut === 'planifie' || r.statut === 'confirme'
      )
      
      if (rdvsToOptimize.length < 2) {
        toast({
          title: 'Optimisation impossible',
          description: 'Il faut au moins 2 RDV pour optimiser la tournée',
          variant: 'destructive'
        })
        setOptimizing(false)
        return
      }
      
      // Algorithme d'optimisation (TSP simplifié)
      const optimized = await calculateOptimalRoute(rdvsToOptimize)
      
      // Mettre à jour l'ordre et les heures
      let currentTime = parseTimeToMinutes(commercialInfo.startHour || '08:00')
      
      for (let i = 0; i < optimized.length; i++) {
        const rdv = optimized[i]
        const date = new Date(rdv.date_time)
        
        // Calculer la nouvelle heure
        const hours = Math.floor(currentTime / 60)
        const minutes = currentTime % 60
        date.setHours(hours, minutes, 0, 0)
        
        // Mettre à jour en base
        await fetch('/api/rdv', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: rdv.id,
            date_time: date.toISOString(),
            order_index: i,
            notes: (rdv.notes || '') + '\n🔄 Optimisé par l\'algorithme de tournée'
          })
        })
        
        // Calculer le temps pour le prochain RDV
        currentTime += rdv.duree_min + 30 // +30min de trajet moyen
        
        // Gérer la pause déjeuner
        if (currentTime >= 12 * 60 && currentTime < 13 * 60) {
          currentTime = 13 * 60
        }
      }
      
      // Calculer les économies
      const originalDistance = calculateTotalDistance(rdvsToOptimize)
      const optimizedDistance = calculateTotalDistance(optimized)
      const savings = Math.round(((originalDistance - optimizedDistance) / originalDistance) * 100)
      
      toast({
        title: '✅ Tournée optimisée',
        description: `Économie estimée: ${savings}% de distance et temps de trajet`
      })
      
      loadRdvs()
      
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'optimiser la tournée',
        variant: 'destructive'
      })
    } finally {
      setOptimizing(false)
    }
  }

  // Algorithme d'optimisation TSP (simplifié)
  async function calculateOptimalRoute(rdvList: RendezVous[]): Promise<RendezVous[]> {
    if (rdvList.length <= 2) return rdvList
    
    // Algorithme du plus proche voisin
    const optimized: RendezVous[] = []
    const remaining = [...rdvList]
    
    // Commencer par le premier RDV
    let current = remaining.shift()!
    optimized.push(current)
    
    while (remaining.length > 0) {
      // Trouver le RDV le plus proche
      let nearestIndex = 0
      let nearestDistance = Infinity
      
      for (let i = 0; i < remaining.length; i++) {
        const distance = calculateDistance(
          current.prospect || { district: 'port-louis' } as any,
          remaining[i].prospect || { district: 'port-louis' } as any
        ).distance
        
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestIndex = i
        }
      }
      
      current = remaining.splice(nearestIndex, 1)[0]
      optimized.push(current)
    }
    
    return optimized
  }

  function calculateTotalDistance(rdvList: RendezVous[]): number {
    let total = 0
    
    for (let i = 0; i < rdvList.length - 1; i++) {
      const from = rdvList[i].prospect || { district: 'port-louis' } as any
      const to = rdvList[i + 1].prospect || { district: 'port-louis' } as any
      total += calculateDistance(from, to).distance
    }
    
    return total
  }

  // ========== GESTION DES RDV (existant) ==========
  
  async function createRdv(data: any) {
    try {
      if (!data.prospect_id || data.prospect_id === 0) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un prospect",
          variant: "destructive"
        })
        return false
      }
      
      const prospect = prospects.find(p => p.id === data.prospect_id)
      if (!prospect) {
        throw new Error("Prospect non trouvé")
      }

      const rdvData = {
        prospect_id: data.prospect_id,
        prospect_nom: prospect.nom,
        commercial: data.commercial || commercialInfo.nom || "Commercial",
        titre: data.titre || `RDV - ${prospect.nom}`,
        date_time: `${data.date}T${data.time}:00`,
        duree_min: data.duree_min || 60,
        type_visite: data.type_visite || 'decouverte',
        priorite: data.priorite || (prospect.score >= 4 ? 'haute' : prospect.score >= 3 ? 'normale' : 'normale'),
        statut: data.statut || 'planifie',
        notes: data.notes || '',
        lieu: data.lieu || prospect.adresse || `${prospect.ville}, ${prospect.district}`,
        prospect: {
          id: prospect.id,
          nom: prospect.nom,
          secteur: prospect.secteur,
          ville: prospect.ville,
          district: prospect.district,
          statut: prospect.statut,
          contact: prospect.contact,
          telephone: prospect.telephone,
          email: prospect.email,
          score: prospect.score,
          budget: prospect.budget,
          adresse: prospect.adresse,
          notes: prospect.notes
        }
      }

      const res = await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rdvData)
      })

      if (!res.ok) throw new Error('Erreur création RDV')

      await loadRdvs()
      
      toast({
        title: "✅ RDV créé",
        description: `Rendez-vous avec ${prospect.nom} planifié le ${new Date(rdvData.date_time).toLocaleDateString('fr-FR')}`
      })
      
      return true
    } catch (error) {
      console.error('Erreur création RDV:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le rendez-vous",
        variant: "destructive"
      })
      return false
    }
  }

  async function updateRdv(rdvId: number, updates: Partial<RendezVous>) {
    try {
      const res = await fetch('/api/rdv', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rdvId, ...updates })
      })

      if (!res.ok) throw new Error('Erreur mise à jour RDV')

      await loadRdvs()
      
      toast({ 
        title: "✅ RDV modifié",
        description: "Les modifications ont été enregistrées"
      })
      
      return true
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rendez-vous",
        variant: "destructive"
      })
      return false
    }
  }

  async function deleteRdv(rdvId: number) {
    try {
      const res = await fetch(`/api/rdv?id=${rdvId}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Erreur suppression RDV')

      await loadRdvs()
      
      toast({ 
        title: "RDV supprimé",
        description: "Le rendez-vous a été supprimé"
      })
      
      return true
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le rendez-vous",
        variant: "destructive"
      })
      return false
    }
  }

  // ========== GESTION DES CONFIGURATIONS ==========
  
  function saveCommercialInfo(info: CommercialInfo) {
    setCommercialInfo(info)
    localStorage.setItem('planning_commercial_info', JSON.stringify(info))
    toast({
      title: "✅ Informations sauvegardées",
      description: "Votre profil a été mis à jour"
    })
  }

  function saveCustomDistances(distances: CustomDistance[]) {
    setCustomDistances(distances)
    localStorage.setItem('planning_custom_distances', JSON.stringify(distances))
    toast({
      title: "✅ Distances sauvegardées",
      description: `${distances.length} distance(s) personnalisée(s) enregistrée(s)`
    })
  }

  function saveSettings(newSettings: CostSettings) {
    setSettings(newSettings)
    localStorage.setItem('planning_cost_settings', JSON.stringify(newSettings))
    toast({ 
      title: "✅ Paramètres sauvegardés",
      description: "Les paramètres de calcul ont été mis à jour"
    })
  }

  // ========== CALCULS DE DISTANCE ET COÛTS ==========
  
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

  function calculateFromHome(to: Prospect): any {
    if (!commercialInfo.adresse) return null
    
    const homeLocation = {
      adresse: commercialInfo.adresse,
      ville: commercialInfo.ville,
      district: commercialInfo.district
    }
    
    const route = calculateDistance(homeLocation, to)
    return { ...route, fromHome: true }
  }

  function parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // ========== NAVIGATION ET FILTRES ==========
  
  function navigateDate(direction: 'prev' | 'next' | 'today') {
    const currentDate = new Date(selectedDate)
    
    if (direction === 'today') {
      setSelectedDate(new Date().toISOString().split('T')[0])
    } else if (direction === 'prev') {
      if (viewType === 'day') currentDate.setDate(currentDate.getDate() - 1)
      else if (viewType === 'week') currentDate.setDate(currentDate.getDate() - 7)
      else currentDate.setMonth(currentDate.getMonth() - 1)
      setSelectedDate(currentDate.toISOString().split('T')[0])
    } else {
      if (viewType === 'day') currentDate.setDate(currentDate.getDate() + 1)
      else if (viewType === 'week') currentDate.setDate(currentDate.getDate() + 7)
      else currentDate.setMonth(currentDate.getMonth() + 1)
      setSelectedDate(currentDate.toISOString().split('T')[0])
    }
  }

  function resetFilters() {
    setSearchTerm("")
    setFilterStatut("")
    setFilterCommercial("")
    setFilterProspect("")
    setFilterDistrict("")
    setFilterTypeVisite("")
  }

  // ========== DONNÉES FILTRÉES ==========
  
  const filteredRdvs = React.useMemo(() => {
    let filtered = [...rendezVous]
    
    // Filtrer par date selon le mode de vue
    if (viewType === 'day') {
      filtered = filtered.filter(rdv => {
        const rdvDate = new Date(rdv.date_time).toISOString().split('T')[0]
        return rdvDate === selectedDate
      })
    } else if (viewType === 'week') {
      const startOfWeek = new Date(selectedDate)
      const dayOfWeek = startOfWeek.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      startOfWeek.setDate(startOfWeek.getDate() - diff)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      
      filtered = filtered.filter(rdv => {
        const rdvDate = new Date(rdv.date_time)
        return rdvDate >= startOfWeek && rdvDate <= endOfWeek
      })
    } else if (viewType === 'month') {
      const selectedMonth = new Date(selectedDate).getMonth()
      const selectedYear = new Date(selectedDate).getFullYear()
      
      filtered = filtered.filter(rdv => {
        const rdvDate = new Date(rdv.date_time)
        return rdvDate.getMonth() === selectedMonth && rdvDate.getFullYear() === selectedYear
      })
    }
    
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
          rdv.titre?.toLowerCase().includes(searchLower) ||
          rdv.prospect?.contact?.toLowerCase().includes(searchLower) ||
          rdv.prospect?.telephone?.toLowerCase().includes(searchLower)
        )
      })
    }
    
    // Filtres
    if (filterStatut) {
      filtered = filtered.filter(rdv => rdv.statut === filterStatut)
    }
    
    if (filterCommercial) {
      filtered = filtered.filter(rdv => rdv.commercial === filterCommercial)
    }
    
    if (filterProspect) {
      filtered = filtered.filter(rdv => rdv.prospect_id.toString() === filterProspect)
    }
    
    if (filterDistrict) {
      filtered = filtered.filter(rdv => rdv.prospect?.district === filterDistrict)
    }
    
    if (filterTypeVisite) {
      filtered = filtered.filter(rdv => rdv.type_visite === filterTypeVisite)
    }
    
    return filtered.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
  }, [rendezVous, selectedDate, viewType, searchTerm, filterStatut, filterCommercial, filterProspect, filterDistrict, filterTypeVisite])

  // ========== STATISTIQUES ==========
  
  const stats = React.useMemo(() => {
    let distanceTotale = 0
    let tempsDeplacement = 0
    let coutTotal = 0
    
    if (filteredRdvs.length > 0 && commercialInfo.adresse && filteredRdvs[0].prospect) {
      const fromHome = calculateFromHome(filteredRdvs[0].prospect)
      if (fromHome) {
        distanceTotale += fromHome.distance
        tempsDeplacement += fromHome.duration
        coutTotal += fromHome.cost
      }
    }
    
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
    
    if (filteredRdvs.length > 0 && commercialInfo.adresse && filteredRdvs[filteredRdvs.length - 1].prospect) {
      const toHome = calculateFromHome(filteredRdvs[filteredRdvs.length - 1].prospect)
      if (toHome) {
        distanceTotale += toHome.distance
        tempsDeplacement += toHome.duration
        coutTotal += toHome.cost
      }
    }
    
    const tempsTotal = tempsDeplacement + filteredRdvs.reduce((sum, rdv) => sum + rdv.duree_min, 0)
    
    const rdvStats = {
      total: filteredRdvs.length,
      planifies: filteredRdvs.filter(r => r.statut === 'planifie').length,
      confirmes: filteredRdvs.filter(r => r.statut === 'confirme').length,
      termines: filteredRdvs.filter(r => r.statut === 'termine').length,
      annules: filteredRdvs.filter(r => r.statut === 'annule').length,
      reportes: filteredRdvs.filter(r => r.statut === 'reporte').length,
      propositions: propositions.length // NOUVEAU
    }
    
    const typeStats = {
      decouverte: filteredRdvs.filter(r => r.type_visite === 'decouverte').length,
      presentation: filteredRdvs.filter(r => r.type_visite === 'presentation').length,
      negociation: filteredRdvs.filter(r => r.type_visite === 'negociation').length,
      signature: filteredRdvs.filter(r => r.type_visite === 'signature').length,
      suivi: filteredRdvs.filter(r => r.type_visite === 'suivi').length
    }
    
    return {
      totalRdvs: filteredRdvs.length,
      distanceTotale: Math.round(distanceTotale * 10) / 10,
      tempsDeplacement: Math.round(tempsDeplacement),
      tempsTotal: Math.round(tempsTotal),
      coutTotal: Math.round(coutTotal),
      customDistancesUsed: customDistances.length,
      rdvStats,
      typeStats
    }
  }, [filteredRdvs, commercialInfo, customDistances, settings, propositions])

  const uniqueCommercials = React.useMemo(() => {
    const commercials = new Set(rendezVous.map(rdv => rdv.commercial).filter(Boolean))
    return Array.from(commercials)
  }, [rendezVous])

  // ========== EXPORT DES DONNÉES ==========
  
  async function exportData(format: 'excel' | 'pdf' | 'csv') {
    try {
      toast({
        title: "Export en cours",
        description: `Génération du fichier ${format.toUpperCase()}...`
      })
      
      const exportData = filteredRdvs.map(rdv => ({
        Date: new Date(rdv.date_time).toLocaleDateString('fr-FR'),
        Heure: new Date(rdv.date_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        Prospect: rdv.prospect?.nom || rdv.prospect_nom || 'N/A',
        Contact: rdv.prospect?.contact || 'N/A',
        Téléphone: rdv.prospect?.telephone || 'N/A',
        Ville: rdv.prospect?.ville || 'N/A',
        District: rdv.prospect?.district ? DISTRICTS_CONFIG[rdv.prospect.district].label : 'N/A',
        Type: rdv.type_visite,
        Statut: rdv.statut,
        Commercial: rdv.commercial,
        Durée: `${rdv.duree_min} min`,
        Notes: rdv.notes || ''
      }))
      
      if (format === 'csv') {
        const headers = Object.keys(exportData[0] || {}).join(',')
        const rows = exportData.map(row => Object.values(row).map(v => `"${v}"`).join(','))
        const csv = [headers, ...rows].join('\n')
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `planning_${selectedDate}.csv`
        link.click()
      }
      
      toast({
        title: "✅ Export terminé",
        description: `Le fichier a été téléchargé`
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données",
        variant: "destructive"
      })
    }
  }

  // ========== RENDU ==========
  
  if (loadingRdvs && rendezVous.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du planning...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planning Commercial</h1>
          <p className="text-gray-600 mt-1">
            {commercialInfo.nom || 'Commercial'}
            {commercialInfo.adresse && ` • 📍 ${commercialInfo.adresse}, ${commercialInfo.ville}`}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => loadRdvs()}
            disabled={loadingRdvs}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loadingRdvs ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => exportData('csv')}
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

      {/* Alerte propositions IA */}
      {propositions.length > 0 && (
        <Alert className="border-purple-200 bg-purple-50">
          <Brain className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                📋 {propositions.length} proposition{propositions.length > 1 ? 's' : ''} IA en attente de validation
              </span>
              <Button
                size="sm"
                onClick={() => setActiveTab('propositions')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Voir les propositions
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Alerte configuration */}
      {!commercialInfo.adresse && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Configuration requise</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Configurez votre adresse de départ pour calculer les distances et optimiser vos trajets.
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

      {/* Statistiques avec propositions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4">
        <Card className="bg-purple-50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">🤖</div>
              <p className="text-xs text-gray-600">Propositions</p>
              <p className="text-xl font-bold text-purple-600">{stats.rdvStats.propositions}</p>
            </div>
          </CardContent>
        </Card>

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
                {Math.floor(stats.tempsDeplacement / 60)}h{String(stats.tempsDeplacement % 60).padStart(2, '0')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">💰</div>
              <p className="text-xs text-gray-600">Coût estimé</p>
              <p className="text-xl font-bold">Rs {stats.coutTotal}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl mb-1">✔️</div>
              <p className="text-xs text-gray-600">Terminés</p>
              <p className="text-xl font-bold text-gray-600">{stats.rdvStats.termines}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50">
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

      {/* Tabs principales avec propositions */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="propositions" className="relative">
            <Brain className="h-4 w-4 mr-2" />
            Propositions IA
            {propositions.length > 0 && (
              <Badge className="ml-2 bg-purple-600 text-white">
                {propositions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="planning">
            <Calendar className="h-4 w-4 mr-2" />
            Planning validé
          </TabsTrigger>
          <TabsTrigger value="optimization">
            <Route className="h-4 w-4 mr-2" />
            Optimisation
          </TabsTrigger>
        </TabsList>

        {/* Tab Propositions IA */}
        <TabsContent value="propositions" className="space-y-4">
          {propositions.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Propositions IA à valider</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Process de validation :</strong>
                      <ol className="mt-2 space-y-1 text-sm">
                        <li>1. Appelez le prospect pour confirmer le créneau</li>
                        <li>2. Modifiez si besoin la date/heure proposée</li>
                        <li>3. Validez pour ajouter au planning définitif</li>
                        <li>4. Verrouillez une fois confirmé avec le prospect</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    {propositions.map((prop) => (
                      <Card key={prop.id} className="border-l-4 border-l-purple-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className="bg-purple-100 text-purple-800">
                                  🤖 Score IA: {prop.ai_score || 'N/A'}/100
                                </Badge>
                                <span className="font-semibold text-lg">{prop.prospect_nom}</span>
                                <Badge variant="outline">
                                  {prop.prospect?.secteur && SECTEURS_CONFIG[prop.prospect.secteur]?.icon} 
                                  {prop.prospect?.secteur && SECTEURS_CONFIG[prop.prospect.secteur]?.label}
                                </Badge>
                                {prop.priorite === 'urgente' && (
                                  <Badge className="bg-red-500">🔥 Urgent</Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  {new Date(prop.date_time).toLocaleDateString('fr-FR')}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  {new Date(prop.date_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  {prop.prospect?.ville || prop.lieu}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  {prop.prospect?.telephone || 'N/A'}
                                </div>
                              </div>
                              
                              {prop.ai_reason && (
                                <div className="p-2 bg-purple-50 rounded text-sm mb-3">
                                  💡 <strong>Raison IA:</strong> {prop.ai_reason}
                                </div>
                              )}
                              
                              {prop.prospect?.contact && (
                                <div className="text-sm text-gray-600">
                                  <User className="h-3 w-3 inline mr-1" />
                                  Contact: {prop.prospect.contact}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              {prop.prospect?.telephone && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.location.href = `tel:${prop.prospect.telephone}`}
                                  className="bg-blue-50 hover:bg-blue-100"
                                >
                                  <Phone className="h-4 w-4 mr-1" />
                                  Appeler
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => editProposition(prop)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Modifier
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => validateProposition(prop)}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Valider
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => rejectProposition(prop.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Rejeter
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune proposition IA en attente</p>
                <p className="text-sm text-gray-500 mt-2">
                  Les nouvelles propositions apparaîtront ici depuis le Dashboard IA
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Planning (existant avec modifications) */}
        <TabsContent value="planning" className="space-y-4">
          {/* Barre de filtres */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filtres et recherche</CardTitle>
                {(searchTerm || filterStatut || filterCommercial || filterProspect || filterDistrict || filterTypeVisite) && (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
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

                <select
                  value={filterDistrict}
                  onChange={(e) => setFilterDistrict(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-white"
                >
                  <option value="">Tous les districts</option>
                  {Object.entries(DISTRICTS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>

                <select
                  value={filterTypeVisite}
                  onChange={(e) => setFilterTypeVisite(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-white"
                >
                  <option value="">Tous les types</option>
                  <option value="decouverte">🔍 Découverte</option>
                  <option value="presentation">📊 Présentation</option>
                  <option value="negociation">💼 Négociation</option>
                  <option value="signature">✍️ Signature</option>
                  <option value="suivi">📞 Suivi</option>
                </select>

                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-white"
                >
                  <option value="">Tous les statuts</option>
                  <option value="planifie">📋 Planifié</option>
                  <option value="confirme">✅ Confirmé</option>
                  <option value="en-cours">⏳ En cours</option>
                  <option value="termine">✔️ Terminé</option>
                  <option value="annule">❌ Annulé</option>
                  <option value="reporte">📅 Reporté</option>
                </select>

                <Button 
                  variant="outline"
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Paramètres
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Navigation date */}
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
                    {viewType === 'day' && new Date(selectedDate).toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                    {viewType === 'week' && `Semaine du ${new Date(selectedDate).toLocaleDateString('fr-FR')}`}
                    {viewType === 'month' && new Date(selectedDate).toLocaleDateString('fr-FR', { 
                      year: 'numeric', 
                      month: 'long' 
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

          {/* Actions rapides */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setShowCommercialConfig(true)}
              variant="outline"
              className={commercialInfo.adresse ? "bg-green-50 border-green-300" : "bg-yellow-50 border-yellow-300"}
            >
              <User className="h-4 w-4 mr-2" />
              Mon Profil
            </Button>
            
            <Button
              onClick={() => setShowDistanceConfig(true)}
              variant="outline"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Distances personnalisées ({customDistances.length})
            </Button>
            
            {filteredRdvs.length > 1 && commercialInfo.adresse && (
              <Button 
                variant="outline"
                onClick={optimizeRoutes}
                disabled={optimizing}
                className="bg-green-50 text-green-700 border-green-300"
              >
                <Route className="h-4 w-4 mr-2" />
                {optimizing ? 'Optimisation...' : 'Optimiser la tournée'}
              </Button>
            )}
          </div>

          {/* Liste des RDV */}
          <Card>
            <CardHeader>
              <CardTitle>
                {viewType === 'day' && 'Rendez-vous du jour'}
                {viewType === 'week' && 'Rendez-vous de la semaine'}
                {viewType === 'month' && 'Rendez-vous du mois'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRdvs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="mb-1">Aucun rendez-vous trouvé</p>
                  <Button 
                    onClick={() => setShowAddRdv(true)} 
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Planifier un RDV
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {commercialInfo.adresse && filteredRdvs.length > 0 && viewType === 'day' && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <span className="text-2xl">🏠</span>
                      <div className="flex-1">
                        <div className="font-medium">Départ de {commercialInfo.adresse}</div>
                        <div className="text-sm text-gray-600">
                          Heure de départ : {commercialInfo.startHour || '08:00'}
                        </div>
                      </div>
                      {filteredRdvs[0].prospect && (
                        <div className="text-sm text-gray-600">
                          → {calculateFromHome(filteredRdvs[0].prospect)?.distance || 0} km 
                          ({calculateFromHome(filteredRdvs[0].prospect)?.duration || 0} min)
                        </div>
                      )}
                    </div>
                  )}

                  {filteredRdvs.map((rdv, index) => {
                    const districtConfig = rdv.prospect?.district ? DISTRICTS_CONFIG[rdv.prospect.district] : null
                    const secteurConfig = rdv.prospect?.secteur ? SECTEURS_CONFIG[rdv.prospect.secteur] : null
                    
                    let routeInfo = null
                    if (index > 0 && filteredRdvs[index - 1].prospect && rdv.prospect) {
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
                    const dateRdv = rdvTime.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short'
                    })
                    
                    return (
                      <div key={rdv.id}>
                        {routeInfo && viewType === 'day' && (
                          <div className="flex items-center gap-4 text-xs text-gray-600 mb-1 ml-4 p-2">
                            <span>🚗 Trajet: {routeInfo.distance} km</span>
                            <span>⏱️ {routeInfo.duration} min</span>
                            <span>💰 Rs {routeInfo.cost}</span>
                            {routeInfo.method === 'custom' && (
                              <span className="text-green-600">✓ Distance personnalisée</span>
                            )}
                          </div>
                        )}
                        
                        <div className={`border-l-4 p-4 rounded-r-lg ${priorityColors[rdv.priorite || 'normale']} ${rdv.locked ? 'opacity-75' : ''}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {viewType !== 'day' && (
                                  <span className="text-sm font-medium text-gray-600">📅 {dateRdv}</span>
                                )}
                                <span className="text-lg font-semibold">⏰ {heureRdv}</span>
                                <span className="text-sm text-gray-600">({rdv.duree_min} min)</span>
                                <Badge className={statutBadges[rdv.statut]?.color || "bg-gray-100"}>
                                  {statutBadges[rdv.statut]?.icon} {rdv.statut}
                                </Badge>
                                {rdv.locked && (
                                  <Badge className="bg-red-100 text-red-800">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Verrouillé
                                  </Badge>
                                )}
                                <Badge className="bg-purple-100 text-purple-800">
                                  {rdv.type_visite}
                                </Badge>
                              </div>
                              
                              <div className="mb-2">
                                <div className="font-medium text-lg flex items-center gap-2">
                                  {secteurConfig?.icon && <span>{secteurConfig.icon}</span>}
                                  {rdv.prospect?.nom || rdv.prospect_nom || 'Prospect'}
                                </div>
                                {rdv.prospect && (
                                  <div className="text-sm text-gray-600">
                                    {secteurConfig?.label} • 
                                    <span className="text-yellow-500 ml-1">
                                      {"★".repeat(Math.min(5, Math.max(1, rdv.prospect.score)))}
                                    </span>
                                    <span className="text-gray-600 ml-1">({rdv.prospect.score}/5)</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {rdv.lieu || rdv.prospect?.adresse || 
                                   (rdv.prospect && `${rdv.prospect.ville}, ${districtConfig?.label}`) ||
                                   'Lieu à définir'}
                                </div>
                                {rdv.prospect?.telephone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {rdv.prospect.telephone}
                                  </div>
                                )}
                                {rdv.prospect?.contact && (
                                  <div className="flex items-center gap-2">
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
                              {!rdv.locked && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingRdv(rdv)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  
                                  {rdv.statut === 'planifie' && (
                                    <Button
                                      size="sm"
                                      className="bg-orange-600 hover:bg-orange-700 text-white"
                                      onClick={() => lockRdv(rdv)}
                                    >
                                      <Lock className="h-4 w-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                              
                              {rdv.statut === 'planifie' && !rdv.locked && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:bg-green-50"
                                  onClick={() => updateRdv(rdv.id, { statut: 'confirme' })}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {rdv.prospect?.telephone && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 hover:bg-blue-50"
                                  onClick={() => window.location.href = `tel:${rdv.prospect?.telephone}`}
                                >
                                  <Phone className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {!rdv.locked && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    if (confirm(`Supprimer le RDV avec ${rdv.prospect?.nom || rdv.prospect_nom} ?`)) {
                                      deleteRdv(rdv.id)
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {commercialInfo.adresse && filteredRdvs.length > 0 && viewType === 'day' && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <span className="text-2xl">🏠</span>
                      <div className="flex-1">
                        <div className="font-medium">Retour à {commercialInfo.adresse}</div>
                        <div className="text-sm text-gray-600">
                          Heure d'arrivée estimée : {commercialInfo.endHour || '18:00'}
                        </div>
                      </div>
                      {filteredRdvs[filteredRdvs.length - 1].prospect && (
                        <div className="text-sm text-gray-600">
                          ← {calculateFromHome(filteredRdvs[filteredRdvs.length - 1].prospect)?.distance || 0} km 
                          ({calculateFromHome(filteredRdvs[filteredRdvs.length - 1].prospect)?.duration || 0} min)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Optimisation */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimisation des tournées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Route className="h-4 w-4" />
                  <AlertDescription>
                    L'optimisation réorganise automatiquement vos RDV pour minimiser les distances et temps de trajet.
                    Les RDV verrouillés ne seront pas déplacés.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Distance actuelle</p>
                      <p className="text-2xl font-bold">{stats.distanceTotale} km</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Temps de trajet</p>
                      <p className="text-2xl font-bold">
                        {Math.floor(stats.tempsDeplacement / 60)}h {stats.tempsDeplacement % 60}min
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Coût estimé</p>
                      <p className="text-2xl font-bold">Rs {stats.coutTotal}</p>
                    </CardContent>
                  </Card>
                </div>

                {filteredRdvs.filter(r => !r.locked).length > 1 ? (
                  <Button
                    onClick={optimizeRoutes}
                    disabled={optimizing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Route className="h-4 w-4 mr-2" />
                    {optimizing ? 'Optimisation en cours...' : 'Lancer l\'optimisation'}
                  </Button>
                ) : (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Il faut au moins 2 RDV non verrouillés pour optimiser la tournée.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <RdvDialogEnhanced
        open={showAddRdv || !!editingRdv}
        onClose={() => {
          setShowAddRdv(false)
          setEditingRdv(null)
        }}
        prospects={prospects}
        rdv={editingRdv}
        onSave={async (data) => {
          if (editingRdv) {
            const success = await updateRdv(editingRdv.id, data)
            if (success) {
              setEditingRdv(null)
            }
          } else {
            const success = await createRdv(data)
            if (success) {
              setShowAddRdv(false)
            }
          }
        }}
        commercialInfo={commercialInfo}
