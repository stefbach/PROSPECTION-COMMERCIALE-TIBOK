"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { 
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Search,
  Plus,
  Eye,
  Trash2,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  Building,
  User,
  Timer,
  Car,
  DollarSign,
  Activity,
  RefreshCw,
  BellRing,
  Star,
  Edit,
  XCircle,
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react'

// ===========================
// TYPES ET INTERFACES
// ===========================

interface Prospect {
  id: number
  nom: string
  email: string
  telephone: string
  adresse: string
  ville: string
  code_postal?: string
  pays?: string
  secteur: string
  statut: 'nouveau' | 'contacte' | 'qualifie' | 'en-negociation' | 'signe' | 'perdu'
  notes?: string
  created_at?: string
  updated_at?: string
  contact?: string
  budget?: string
  score?: number
  district?: string
}

interface RDV {
  id: number
  prospect_id: number
  prospect_nom?: string
  prospect_contact?: string
  prospect_telephone?: string
  prospect_ville?: string
  prospect_district?: string
  prospect_secteur?: string
  commercial: string
  titre: string
  date_time: string
  duree_min: number
  type_visite: 'decouverte' | 'presentation' | 'negociation' | 'signature' | 'suivi'
  priorite: 'normale' | 'haute' | 'urgente'
  statut: 'planifie' | 'confirme' | 'en-cours' | 'termine' | 'annule' | 'reporte'
  notes?: string
  rappel?: boolean
  rappel_minutes?: number
  lieu?: string
  created_at: string
  updated_at: string
  resultat?: {
    decision: 'positif' | 'negatif' | 'a-revoir' | 'en-attente'
    prochaine_action?: string
    date_suivi?: string
    montant_potentiel?: number
    probabilite?: number
  }
}

// ===========================
// CONFIGURATION MAURICE
// ===========================

const DISTRICTS_MAURICE = {
  'port-louis': 'Port Louis',
  'pamplemousses': 'Pamplemousses',
  'riviere-du-rempart': 'Rivière du Rempart',
  'flacq': 'Flacq',
  'grand-port': 'Grand Port',
  'savanne': 'Savanne',
  'plaines-wilhems': 'Plaines Wilhems',
  'moka': 'Moka',
  'riviere-noire': 'Rivière Noire'
}

const SECTEURS = {
  'hotel': { label: 'Hôtel', icon: '🏨', color: 'bg-blue-100 text-blue-700' },
  'restaurant': { label: 'Restaurant', icon: '🍽️', color: 'bg-orange-100 text-orange-700' },
  'retail': { label: 'Retail', icon: '🏪', color: 'bg-purple-100 text-purple-700' },
  'clinique': { label: 'Clinique', icon: '🏥', color: 'bg-red-100 text-red-700' },
  'pharmacie': { label: 'Pharmacie', icon: '💊', color: 'bg-green-100 text-green-700' },
  'wellness': { label: 'Wellness', icon: '🌿', color: 'bg-emerald-100 text-emerald-700' },
  'spa': { label: 'Spa', icon: '💆', color: 'bg-pink-100 text-pink-700' },
  'tourisme': { label: 'Tourisme', icon: '🏖️', color: 'bg-cyan-100 text-cyan-700' },
  'autre': { label: 'Autre', icon: '🏢', color: 'bg-gray-100 text-gray-700' }
}

const STATUTS = {
  'nouveau': { label: 'Nouveau', color: 'bg-blue-100 text-blue-700' },
  'contacte': { label: 'Contacté', color: 'bg-yellow-100 text-yellow-700' },
  'qualifie': { label: 'Qualifié', color: 'bg-green-100 text-green-700' },
  'en-negociation': { label: 'En négociation', color: 'bg-purple-100 text-purple-700' },
  'signe': { label: 'Signé', color: 'bg-emerald-100 text-emerald-700' },
  'perdu': { label: 'Perdu', color: 'bg-red-100 text-red-700' }
}

const STATUTS_RDV = {
  'planifie': { label: 'Planifié', color: 'bg-blue-100 text-blue-700' },
  'confirme': { label: 'Confirmé', color: 'bg-green-100 text-green-700' },
  'en-cours': { label: 'En cours', color: 'bg-yellow-100 text-yellow-700' },
  'termine': { label: 'Terminé', color: 'bg-gray-100 text-gray-700' },
  'annule': { label: 'Annulé', color: 'bg-red-100 text-red-700' },
  'reporte': { label: 'Reporté', color: 'bg-orange-100 text-orange-700' }
}

// ===========================
// COMPOSANT PRINCIPAL
// ===========================

export default function RdvKarineSection() {
  // États pour les données
  const [prospects, setProspects] = React.useState<Prospect[]>([])
  const [rdvs, setRdvs] = React.useState<RDV[]>([])
  const [loading, setLoading] = React.useState(false)
  const [activeView, setActiveView] = React.useState<'dashboard' | 'prospects' | 'rdv' | 'nouveau-rdv'>('dashboard')
  
  // État pour le commercial actuel (Karine MOMUS par défaut)
  const [currentCommercial] = React.useState("Karine MOMUS")
  
  // États pour le formulaire RDV
  const [selectedProspect, setSelectedProspect] = React.useState<Prospect | null>(null)
  const [selectedDate, setSelectedDate] = React.useState("")
  const [selectedTime, setSelectedTime] = React.useState("")
  const [typeVisite, setTypeVisite] = React.useState<RDV['type_visite']>("decouverte")
  const [priorite, setPriorite] = React.useState<RDV['priorite']>("normale")
  const [duree, setDuree] = React.useState("60")
  const [notes, setNotes] = React.useState("")
  const [lieu, setLieu] = React.useState("")
  const [rappel, setRappel] = React.useState(true)
  const [rappelMinutes, setRappelMinutes] = React.useState("15")
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterSecteur, setFilterSecteur] = React.useState("all")
  const [filterStatut, setFilterStatut] = React.useState("all")
  const [filterDateRange, setFilterDateRange] = React.useState("all")
  const [showNewProspectForm, setShowNewProspectForm] = React.useState(false)
  const [editingRdv, setEditingRdv] = React.useState<RDV | null>(null)
  
  // État pour le nouveau prospect
  const [newProspect, setNewProspect] = React.useState<Partial<Prospect>>({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    secteur: 'hotel',
    statut: 'nouveau',
    notes: '',
    contact: ''
  })
  
  const { toast } = useToast()
  const today = new Date().toISOString().split("T")[0]

  // ===========================
  // CHARGEMENT DES DONNÉES
  // ===========================

  async function loadProspects() {
    try {
      setLoading(true)
      const response = await fetch('/api/prospects')
      if (response.ok) {
        const data = await response.json()
        setProspects(Array.isArray(data) ? data : [])
        console.log(`✅ ${data.length} prospects chargés`)
      } else {
        throw new Error('Erreur API prospects')
      }
    } catch (error) {
      console.error('❌ Erreur chargement prospects:', error)
      toast({ 
        title: "Erreur", 
        description: "Impossible de charger les prospects",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadRdvs() {
    try {
      const response = await fetch(`/api/rdv?commercial=${encodeURIComponent(currentCommercial)}`)
      if (response.ok) {
        const data = await response.json()
        setRdvs(Array.isArray(data) ? data : [])
        console.log(`✅ ${data.length} RDV chargés pour ${currentCommercial}`)
      } else {
        throw new Error('Erreur API RDV')
      }
    } catch (error) {
      console.error('❌ Erreur chargement RDV:', error)
      toast({ 
        title: "Erreur", 
        description: "Impossible de charger les rendez-vous",
        variant: "destructive"
      })
    }
  }

  // Chargement initial
  React.useEffect(() => {
    loadProspects()
    loadRdvs()
  }, [])

  // ===========================
  // FONCTIONS CRUD
  // ===========================

  async function createRdv(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedProspect || !selectedDate || !selectedTime) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    try {
      const rdvData = {
        prospect_id: selectedProspect.id,
        commercial: currentCommercial, // IMPORTANT: Ajout du commercial requis par l'API
        titre: `RDV - ${selectedProspect.nom}`,
        date_time: `${selectedDate}T${selectedTime}:00`,
        type_visite: typeVisite,
        priorite: priorite,
        duree_min: parseInt(duree),
        notes: notes || '',
        lieu: lieu || `${selectedProspect.ville}, ${selectedProspect.district || ''}`,
        statut: 'planifie',
        rappel: rappel,
        rappel_minutes: parseInt(rappelMinutes)
      }

      console.log('📤 Création RDV:', rdvData)

      const response = await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rdvData)
      })

      const responseData = await response.json()

      if (response.ok) {
        await loadRdvs()
        toast({ 
          title: "✅ RDV planifié", 
          description: `RDV avec ${selectedProspect.nom} le ${new Date(selectedDate).toLocaleDateString('fr-FR')} à ${selectedTime}`
        })
        resetRdvForm()
        setActiveView('rdv')
      } else {
        throw new Error(responseData.error || 'Erreur création RDV')
      }
    } catch (error: any) {
      console.error('❌ Erreur création RDV:', error)
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible de créer le RDV",
        variant: "destructive"
      })
    }
  }

  async function updateRdvStatut(rdv: RDV, newStatut: RDV['statut']) {
    try {
      const response = await fetch('/api/rdv', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rdv.id,
          statut: newStatut
        })
      })

      if (response.ok) {
        await loadRdvs()
        toast({ 
          title: "✅ Statut mis à jour", 
          description: `RDV marqué comme ${STATUTS_RDV[newStatut].label}`
        })
      } else {
        throw new Error('Erreur mise à jour')
      }
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      })
    }
  }

  async function createProspect(e: React.FormEvent) {
    e.preventDefault()
    
    if (!newProspect.nom || !newProspect.email || !newProspect.telephone) {
      toast({ 
        title: "Erreur", 
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProspect)
      })

      if (response.ok) {
        await loadProspects()
        toast({ 
          title: "✅ Prospect créé", 
          description: `${newProspect.nom} ajouté à la base`
        })
        setShowNewProspectForm(false)
        setNewProspect({
          nom: '',
          email: '',
          telephone: '',
          adresse: '',
          ville: '',
          secteur: 'hotel',
          statut: 'nouveau',
          notes: '',
          contact: ''
        })
      }
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Impossible de créer le prospect",
        variant: "destructive"
      })
    }
  }

  async function deleteRdv(id: number) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce RDV ?")) return

    try {
      const response = await fetch(`/api/rdv?id=${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadRdvs()
        toast({ 
          title: "✅ RDV supprimé", 
          description: "Le rendez-vous a été supprimé"
        })
      }
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Impossible de supprimer le RDV",
        variant: "destructive"
      })
    }
  }

  function resetRdvForm() {
    setSelectedProspect(null)
    setSelectedDate("")
    setSelectedTime("")
    setTypeVisite("decouverte")
    setPriorite("normale")
    setDuree("60")
    setNotes("")
    setLieu("")
    setRappel(true)
    setRappelMinutes("15")
  }

  // ===========================
  // FILTRAGE ET STATS
  // ===========================

  const filteredProspects = React.useMemo(() => {
    let filtered = [...prospects]
    
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (filterSecteur !== 'all') {
      filtered = filtered.filter(p => p.secteur === filterSecteur)
    }
    
    if (filterStatut !== 'all') {
      filtered = filtered.filter(p => p.statut === filterStatut)
    }
    
    return filtered
  }, [prospects, searchTerm, filterSecteur, filterStatut])

  const filteredRdvs = React.useMemo(() => {
    let filtered = [...rdvs]
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const monthEnd = new Date(today)
    monthEnd.setDate(monthEnd.getDate() + 30)

    switch(filterDateRange) {
      case 'today':
        filtered = filtered.filter(r => {
          const rdvDate = new Date(r.date_time)
          return rdvDate >= today && rdvDate < tomorrow
        })
        break
      case 'week':
        filtered = filtered.filter(r => {
          const rdvDate = new Date(r.date_time)
          return rdvDate >= today && rdvDate < weekEnd
        })
        break
      case 'month':
        filtered = filtered.filter(r => {
          const rdvDate = new Date(r.date_time)
          return rdvDate >= today && rdvDate < monthEnd
        })
        break
      case 'past':
        filtered = filtered.filter(r => new Date(r.date_time) < today)
        break
    }

    return filtered.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
  }, [rdvs, filterDateRange])

  const stats = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return {
      totalProspects: prospects.length,
      nouveaux: prospects.filter(p => p.statut === 'nouveau').length,
      qualifies: prospects.filter(p => p.statut === 'qualifie').length,
      signes: prospects.filter(p => p.statut === 'signe').length,
      rdvTotal: rdvs.length,
      rdvPlanifies: rdvs.filter(r => r.statut === 'planifie' || r.statut === 'confirme').length,
      rdvTermines: rdvs.filter(r => r.statut === 'termine').length,
      rdvAujourdhui: rdvs.filter(r => {
        const rdvDate = new Date(r.date_time)
        rdvDate.setHours(0, 0, 0, 0)
        return rdvDate.getTime() === today.getTime()
      }).length,
      rdvSemaine: rdvs.filter(r => {
        const rdvDate = new Date(r.date_time)
        const weekFromNow = new Date(today)
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        return rdvDate >= today && rdvDate <= weekFromNow
      }).length,
      tauxConversion: prospects.length > 0 
        ? Math.round((prospects.filter(p => p.statut === 'signe').length / prospects.length) * 100)
        : 0
    }
  }, [prospects, rdvs])

  // ===========================
  // RENDU
  // ===========================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Gestion des Rendez-Vous
          </h2>
          <p className="text-gray-600">
            Commercial: <strong>{currentCommercial}</strong> • Île Maurice
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              loadProspects()
              loadRdvs()
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => setActiveView('nouveau-rdv')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau RDV
          </Button>
        </div>
      </div>

      {/* KPIs améliorés */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveView('prospects')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Prospects</p>
                <p className="text-2xl font-bold">{stats.totalProspects}</p>
                <p className="text-xs text-green-600">+12% ce mois</p>
              </div>
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Qualifiés</p>
                <p className="text-2xl font-bold">{stats.qualifies}</p>
                <p className="text-xs text-orange-600">{stats.nouveaux} nouveaux</p>
              </div>
              <Target className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Signés</p>
                <p className="text-2xl font-bold">{stats.signes}</p>
                <p className="text-xs text-emerald-600">{stats.tauxConversion}% conv.</p>
              </div>
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveView('rdv')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">RDV Total</p>
                <p className="text-2xl font-bold">{stats.rdvTotal}</p>
                <p className="text-xs text-blue-600">{stats.rdvPlanifies} planifiés</p>
              </div>
              <Calendar className="h-6 w-6 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Aujourd'hui</p>
                <p className="text-2xl font-bold">{stats.rdvAujourdhui}</p>
                <p className="text-xs text-purple-600">RDV du jour</p>
              </div>
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Cette semaine</p>
                <p className="text-2xl font-bold">{stats.rdvSemaine}</p>
                <p className="text-xs text-red-600">{stats.rdvTermines} terminés</p>
              </div>
              <Activity className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation améliorée */}
      <div className="flex gap-2 border-b">
        <Button 
          variant={activeView === 'dashboard' ? 'default' : 'ghost'}
          onClick={() => setActiveView('dashboard')}
          className="rounded-b-none"
        >
          Dashboard
        </Button>
        <Button 
          variant={activeView === 'prospects' ? 'default' : 'ghost'}
          onClick={() => setActiveView('prospects')}
          className="rounded-b-none"
        >
          Prospects ({stats.totalProspects})
        </Button>
        <Button 
          variant={activeView === 'rdv' ? 'default' : 'ghost'}
          onClick={() => setActiveView('rdv')}
          className="rounded-b-none"
        >
          RDV ({stats.rdvTotal})
        </Button>
        <Button 
          variant={activeView === 'nouveau-rdv' ? 'default' : 'ghost'}
          onClick={() => setActiveView('nouveau-rdv')}
          className="rounded-b-none"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau RDV
        </Button>
      </div>

      {/* Vue Dashboard améliorée */}
      {activeView === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Planning du jour */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Planning du jour</span>
                <Badge variant="outline">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rdvs
                  .filter(r => {
                    const rdvDate = new Date(r.date_time)
                    const today = new Date()
                    return rdvDate.toDateString() === today.toDateString()
                  })
                  .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
                  .map(rdv => {
                    const now = new Date()
                    const rdvTime = new Date(rdv.date_time)
                    const isNow = rdvTime <= now && new Date(rdvTime.getTime() + rdv.duree_min * 60000) > now
                    const isPast = new Date(rdvTime.getTime() + rdv.duree_min * 60000) < now
                    
                    return (
                      <div key={rdv.id} className={`
                        flex items-center justify-between p-3 border rounded-lg
                        ${isNow ? 'bg-yellow-50 border-yellow-300' : isPast ? 'bg-gray-50' : 'hover:bg-gray-50'}
                      `}>
                        <div className="flex items-center gap-3">
                          <div className="text-center min-w-[50px]">
                            <p className="text-lg font-bold">
                              {new Date(rdv.date_time).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {isNow && <Badge variant="default" className="text-xs">En cours</Badge>}
                          </div>
                          <div>
                            <p className="font-medium">{rdv.prospect_nom || rdv.titre}</p>
                            <p className="text-sm text-gray-500">
                              {rdv.type_visite} • {rdv.duree_min} min • {rdv.prospect_ville}
                            </p>
                            {rdv.notes && (
                              <p className="text-xs text-gray-400 mt-1">{rdv.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            rdv.priorite === 'urgente' ? 'destructive' : 
                            rdv.priorite === 'haute' ? 'default' : 
                            'secondary'
                          }>
                            {rdv.priorite}
                          </Badge>
                          {!isPast && rdv.statut !== 'termine' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRdvStatut(rdv, 'termine')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                
                {stats.rdvAujourdhui === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun rendez-vous aujourd'hui</p>
                    <Button 
                      size="sm" 
                      className="mt-3"
                      onClick={() => setActiveView('nouveau-rdv')}
                    >
                      Planifier un RDV
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides et prospects prioritaires */}
          <div className="space-y-6">
            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => setShowNewProspectForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau prospect
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => setActiveView('nouveau-rdv')}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Planifier RDV
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      setFilterDateRange('today')
                      setActiveView('rdv')
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    RDV du jour
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      setFilterStatut('nouveau')
                      setActiveView('prospects')
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Nouveaux prospects
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Prospects à recontacter */}
            <Card>
              <CardHeader>
                <CardTitle>À contacter en priorité</CardTitle>
                <CardDescription>Prospects qualifiés sans RDV planifié</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {prospects
                    .filter(p => {
                      const hasRdv = rdvs.some(r => 
                        r.prospect_id === p.id && 
                        (r.statut === 'planifie' || r.statut === 'confirme')
                      )
                      return (p.statut === 'qualifie' || p.statut === 'en-negociation') && !hasRdv
                    })
                    .slice(0, 5)
                    .map(prospect => (
                      <div key={prospect.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium">{prospect.nom}</p>
                          <p className="text-sm text-gray-500">
                            {prospect.ville} • {SECTEURS[prospect.secteur as keyof typeof SECTEURS]?.label}
                          </p>
                        </div>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProspect(prospect)
                            setActiveView('nouveau-rdv')
                          }}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Contacter
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Vue Prospects améliorée */}
      {activeView === 'prospects' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un prospect..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    className="border rounded-md px-3 py-2 text-sm"
                    value={filterSecteur}
                    onChange={(e) => setFilterSecteur(e.target.value)}
                  >
                    <option value="all">Tous les secteurs</option>
                    {Object.entries(SECTEURS).map(([key, secteur]) => (
                      <option key={key} value={key}>
                        {secteur.icon} {secteur.label}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    className="border rounded-md px-3 py-2 text-sm"
                    value={filterStatut}
                    onChange={(e) => setFilterStatut(e.target.value)}
                  >
                    <option value="all">Tous les statuts</option>
                    {Object.entries(STATUTS).map(([key, statut]) => (
                      <option key={key} value={key}>{statut.label}</option>
                    ))}
                  </select>
                  
                  <Button onClick={() => setShowNewProspectForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProspects.map(prospect => {
              const lastRdv = rdvs
                .filter(r => r.prospect_id === prospect.id)
                .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())[0]
              
              return (
                <Card key={prospect.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold">{prospect.nom}</h4>
                        <p className="text-sm text-muted-foreground">
                          {SECTEURS[prospect.secteur as keyof typeof SECTEURS]?.icon} {SECTEURS[prospect.secteur as keyof typeof SECTEURS]?.label}
                        </p>
                      </div>
                      <Badge className={STATUTS[prospect.statut as keyof typeof STATUTS]?.color}>
                        {STATUTS[prospect.statut as keyof typeof STATUTS]?.label}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{prospect.ville}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{prospect.telephone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{prospect.email}</span>
                      </div>
                      {prospect.contact && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{prospect.contact}</span>
                        </div>
                      )}
                    </div>
                    
                    {lastRdv && (
                      <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                        <p className="font-medium text-blue-700">Dernier RDV:</p>
                        <p className="text-blue-600">
                          {new Date(lastRdv.date_time).toLocaleDateString('fr-FR')} - {lastRdv.type_visite}
                        </p>
                      </div>
                    )}
                    
                    {prospect.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 line-clamp-2">
                        {prospect.notes}
                      </div>
                    )}
                    
                    <Button 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => {
                        setSelectedProspect(prospect)
                        setActiveView('nouveau-rdv')
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Planifier RDV
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredProspects.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun prospect trouvé</p>
                <Button 
                  size="sm" 
                  className="mt-4"
                  onClick={() => setShowNewProspectForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un prospect
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Vue RDV améliorée avec filtres */}
      {activeView === 'rdv' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Liste des rendez-vous</CardTitle>
                <div className="flex gap-2">
                  <select
                    className="border rounded-md px-3 py-2 text-sm"
                    value={filterDateRange}
                    onChange={(e) => setFilterDateRange(e.target.value)}
                  >
                    <option value="all">Tous les RDV</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                    <option value="past">Passés</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredRdvs.map(rdv => {
                  const isPast = new Date(rdv.date_time) < new Date()
                  const isToday = new Date(rdv.date_time).toDateString() === new Date().toDateString()
                  
                  return (
                    <div key={rdv.id} className={`
                      flex items-center justify-between p-4 border rounded-lg
                      ${isPast && rdv.statut !== 'termine' ? 'bg-red-50' : ''}
                      ${rdv.statut === 'termine' ? 'bg-gray-50' : ''}
                      ${rdv.statut === 'annule' ? 'bg-gray-100 opacity-60' : ''}
                      ${isToday && rdv.statut === 'planifie' ? 'bg-blue-50 border-blue-300' : ''}
                      hover:shadow-md transition-shadow
                    `}>
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-xs font-bold uppercase text-gray-500">
                            {new Date(rdv.date_time).toLocaleDateString('fr-FR', {
                              month: 'short'
                            })}
                          </p>
                          <p className="text-2xl font-bold">
                            {new Date(rdv.date_time).getDate()}
                          </p>
                          <p className="text-sm">
                            {new Date(rdv.date_time).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{rdv.prospect_nom || rdv.titre}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {rdv.type_visite}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {rdv.duree_min} min
                            </Badge>
                            {rdv.prospect_ville && (
                              <Badge variant="outline" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {rdv.prospect_ville}
                              </Badge>
                            )}
                            {rdv.prospect_secteur && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${SECTEURS[rdv.prospect_secteur as keyof typeof SECTEURS]?.color}`}
                              >
                                {SECTEURS[rdv.prospect_secteur as keyof typeof SECTEURS]?.icon} 
                                {SECTEURS[rdv.prospect_secteur as keyof typeof SECTEURS]?.label}
                              </Badge>
                            )}
                          </div>
                          {rdv.notes && (
                            <p className="text-xs text-gray-500 mt-2 italic">{rdv.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          rdv.priorite === 'urgente' ? 'destructive' : 
                          rdv.priorite === 'haute' ? 'default' : 
                          'secondary'
                        }>
                          {rdv.priorite}
                        </Badge>
                        <Badge className={STATUTS_RDV[rdv.statut]?.color}>
                          {STATUTS_RDV[rdv.statut]?.label}
                        </Badge>
                        <div className="flex gap-1">
                          {rdv.statut === 'planifie' && !isPast && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => updateRdvStatut(rdv, 'confirme')}
                              title="Confirmer"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {(rdv.statut === 'planifie' || rdv.statut === 'confirme') && !isPast && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => updateRdvStatut(rdv, 'reporte')}
                              title="Reporter"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          )}
                          {rdv.statut !== 'termine' && rdv.statut !== 'annule' && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => updateRdvStatut(rdv, 'termine')}
                              title="Marquer comme terminé"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => deleteRdv(rdv.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {filteredRdvs.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Aucun rendez-vous trouvé</p>
                    <Button onClick={() => setActiveView('nouveau-rdv')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Planifier un nouveau RDV
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vue Nouveau RDV améliorée */}
      {activeView === 'nouveau-rdv' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner un prospect</CardTitle>
              <CardDescription>
                Choisissez un prospect pour planifier un rendez-vous
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Rechercher un prospect..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredProspects
                  .filter(p => p.statut !== 'signe' && p.statut !== 'perdu')
                  .map(prospect => (
                    <div
                      key={prospect.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedProspect?.id === prospect.id ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                      onClick={() => {
                        setSelectedProspect(prospect)
                        // Auto-remplir le lieu si on a une adresse
                        if (prospect.adresse || prospect.ville) {
                          setLieu(`${prospect.adresse || ''} ${prospect.ville || ''}`.trim())
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{prospect.nom}</p>
                          <p className="text-sm text-gray-500">
                            {prospect.ville} • {SECTEURS[prospect.secteur as keyof typeof SECTEURS]?.label}
                          </p>
                          {prospect.contact && (
                            <p className="text-xs text-gray-400">{prospect.contact}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={STATUTS[prospect.statut as keyof typeof STATUTS]?.color}>
                            {STATUTS[prospect.statut as keyof typeof STATUTS]?.label}
                          </Badge>
                          {selectedProspect?.id === prospect.id && (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowNewProspectForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un nouveau prospect
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Détails du rendez-vous</CardTitle>
              <CardDescription>
                Configurez les détails du rendez-vous
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedProspect ? (
                <form onSubmit={createRdv} className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{selectedProspect.nom}</p>
                        <p className="text-sm text-gray-500">
                          {selectedProspect.ville} • {selectedProspect.telephone}
                        </p>
                        {selectedProspect.contact && (
                          <p className="text-sm text-gray-500">Contact: {selectedProspect.contact}</p>
                        )}
                      </div>
                      <Badge className={STATUTS[selectedProspect.statut as keyof typeof STATUTS]?.color}>
                        {STATUTS[selectedProspect.statut as keyof typeof STATUTS]?.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Date *</label>
                      <Input
                        type="date"
                        min={today}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Heure *</label>
                      <Input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Type de visite</label>
                      <select
                        className="w-full border rounded-md px-3 py-2"
                        value={typeVisite}
                        onChange={(e) => setTypeVisite(e.target.value as RDV['type_visite'])}
                      >
                        <option value="decouverte">🔍 Découverte</option>
                        <option value="presentation">📊 Présentation</option>
                        <option value="negociation">💼 Négociation</option>
                        <option value="signature">✍️ Signature</option>
                        <option value="suivi">📞 Suivi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Priorité</label>
                      <select
                        className="w-full border rounded-md px-3 py-2"
                        value={priorite}
                        onChange={(e) => setPriorite(e.target.value as RDV['priorite'])}
                      >
                        <option value="normale">🔵 Normale</option>
                        <option value="haute">🟠 Haute</option>
                        <option value="urgente">🔴 Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Durée</label>
                      <select
                        className="w-full border rounded-md px-3 py-2"
                        value={duree}
                        onChange={(e) => setDuree(e.target.value)}
                      >
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">1 heure</option>
                        <option value="90">1h30</option>
                        <option value="120">2 heures</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Rappel</label>
                      <div className="flex gap-2">
                        <input
                          type="checkbox"
                          checked={rappel}
                          onChange={(e) => setRappel(e.target.checked)}
                          className="mt-1"
                        />
                        {rappel && (
                          <select
                            className="flex-1 border rounded-md px-3 py-2"
                            value={rappelMinutes}
                            onChange={(e) => setRappelMinutes(e.target.value)}
                          >
                            <option value="15">15 min avant</option>
                            <option value="30">30 min avant</option>
                            <option value="60">1h avant</option>
                            <option value="120">2h avant</option>
                          </select>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Lieu</label>
                    <Input
                      value={lieu}
                      onChange={(e) => setLieu(e.target.value)}
                      placeholder="Adresse ou lieu du rendez-vous"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <Textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Objectifs du rendez-vous, points à aborder..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Planifier le RDV
                    </Button>
                    <Button type="button" variant="outline" onClick={resetRdvForm}>
                      Annuler
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-2">Sélectionnez un prospect pour planifier un rendez-vous</p>
                  <p className="text-sm text-gray-400">Choisissez dans la liste à gauche ou créez un nouveau prospect</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Nouveau Prospect */}
      {showNewProspectForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Créer un nouveau prospect</CardTitle>
              <CardDescription>
                Ajoutez un nouveau prospect à votre base de données
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createProspect} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom de l'entreprise *</label>
                    <Input
                      value={newProspect.nom}
                      onChange={(e) => setNewProspect({...newProspect, nom: e.target.value})}
                      placeholder="Ex: Hotel Le Meridien"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Secteur d'activité</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={newProspect.secteur}
                      onChange={(e) => setNewProspect({...newProspect, secteur: e.target.value})}
                    >
                      {Object.entries(SECTEURS).map(([key, secteur]) => (
                        <option key={key} value={key}>
                          {secteur.icon} {secteur.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom du contact</label>
                    <Input
                      value={newProspect.contact}
                      onChange={(e) => setNewProspect({...newProspect, contact: e.target.value})}
                      placeholder="Ex: Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone *</label>
                    <Input
                      value={newProspect.telephone}
                      onChange={(e) => setNewProspect({...newProspect, telephone: e.target.value})}
                      placeholder="+230 5XXX XXXX"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <Input
                    type="email"
                    value={newProspect.email}
                    onChange={(e) => setNewProspect({...newProspect, email: e.target.value})}
                    placeholder="contact@entreprise.mu"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ville</label>
                    <Input
                      value={newProspect.ville}
                      onChange={(e) => setNewProspect({...newProspect, ville: e.target.value})}
                      placeholder="Ex: Port Louis"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Statut initial</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={newProspect.statut}
                      onChange={(e) => setNewProspect({...newProspect, statut: e.target.value as Prospect['statut']})}
                    >
                      {Object.entries(STATUTS).map(([key, statut]) => (
                        <option key={key} value={key}>{statut.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Adresse</label>
                  <Input
                    value={newProspect.adresse}
                    onChange={(e) => setNewProspect({...newProspect, adresse: e.target.value})}
                    placeholder="Adresse complète"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <Textarea
                    rows={3}
                    value={newProspect.notes}
                    onChange={(e) => setNewProspect({...newProspect, notes: e.target.value})}
                    placeholder="Informations complémentaires..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowNewProspectForm(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le prospect
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
