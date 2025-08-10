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
  Star
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
}

interface RDV {
  id: number
  prospect_id: number
  titre: string
  date_time: string
  type_visite: 'decouverte' | 'presentation' | 'negociation' | 'signature' | 'suivi'
  priorite: 'normale' | 'haute' | 'urgente'
  duree_min: number
  notes: string
  statut?: 'planifie' | 'confirme' | 'termine' | 'annule'
  prospect?: Prospect
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
  'hotel': { label: 'Hôtel', icon: '🏨' },
  'restaurant': { label: 'Restaurant', icon: '🍽️' },
  'retail': { label: 'Retail', icon: '🏪' },
  'clinique': { label: 'Clinique', icon: '🏥' },
  'pharmacie': { label: 'Pharmacie', icon: '💊' },
  'wellness': { label: 'Wellness', icon: '🌿' },
  'spa': { label: 'Spa', icon: '💆' },
  'tourisme': { label: 'Tourisme', icon: '🏖️' },
  'autre': { label: 'Autre', icon: '🏢' }
}

const STATUTS = {
  'nouveau': { label: 'Nouveau', color: 'bg-blue-100 text-blue-700' },
  'contacte': { label: 'Contacté', color: 'bg-yellow-100 text-yellow-700' },
  'qualifie': { label: 'Qualifié', color: 'bg-green-100 text-green-700' },
  'en-negociation': { label: 'En négociation', color: 'bg-purple-100 text-purple-700' },
  'signe': { label: 'Signé', color: 'bg-emerald-100 text-emerald-700' },
  'perdu': { label: 'Perdu', color: 'bg-red-100 text-red-700' }
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
  
  // États pour le formulaire RDV
  const [selectedProspect, setSelectedProspect] = React.useState<Prospect | null>(null)
  const [selectedDate, setSelectedDate] = React.useState("")
  const [selectedTime, setSelectedTime] = React.useState("")
  const [typeVisite, setTypeVisite] = React.useState<RDV['type_visite']>("decouverte")
  const [priorite, setPriorite] = React.useState<RDV['priorite']>("normale")
  const [duree, setDuree] = React.useState("60")
  const [notes, setNotes] = React.useState("")
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterSecteur, setFilterSecteur] = React.useState("all")
  const [filterStatut, setFilterStatut] = React.useState("all")
  const [showNewProspectForm, setShowNewProspectForm] = React.useState(false)
  
  // État pour le nouveau prospect
  const [newProspect, setNewProspect] = React.useState<Partial<Prospect>>({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    secteur: 'hotel',
    statut: 'nouveau',
    notes: ''
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
      } else {
        // Données de démonstration si l'API ne fonctionne pas
        setProspects([
          {
            id: 1,
            nom: "Hotel Le Meridien",
            secteur: "hotel",
            ville: "Port Louis",
            statut: "en-negociation",
            telephone: "+230 5234 5678",
            email: "contact@meridien.mu",
            adresse: "Caudan Waterfront",
            notes: "Très intéressé par notre solution"
          },
          {
            id: 2,
            nom: "Restaurant Le Capitaine",
            secteur: "restaurant",
            ville: "Curepipe",
            statut: "qualifie",
            telephone: "+230 5345 6789",
            email: "info@lecapitaine.mu",
            adresse: "Royal Road, Curepipe",
            notes: "RDV prévu cette semaine"
          },
          {
            id: 3,
            nom: "Winners Supermarket",
            secteur: "retail",
            ville: "Phoenix",
            statut: "nouveau",
            telephone: "+230 5456 7890",
            email: "manager@winners.mu",
            adresse: "Phoenix Mall",
            notes: "Premier contact à établir"
          }
        ])
      }
    } catch (error) {
      console.error('Erreur chargement prospects:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadRdvs() {
    try {
      const response = await fetch('/api/rdv')
      if (response.ok) {
        const data = await response.json()
        // Enrichir avec les données prospects
        const enrichedRdvs = data.map((rdv: RDV) => ({
          ...rdv,
          prospect: prospects.find(p => p.id === rdv.prospect_id)
        }))
        setRdvs(Array.isArray(enrichedRdvs) ? enrichedRdvs : [])
      }
    } catch (error) {
      console.error('Erreur chargement RDV:', error)
    }
  }

  // Chargement initial
  React.useEffect(() => {
    loadProspects()
  }, [])

  React.useEffect(() => {
    if (prospects.length > 0) {
      loadRdvs()
    }
  }, [prospects])

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
        titre: `RDV - ${selectedProspect.nom}`,
        date_time: `${selectedDate}T${selectedTime}:00`,
        type_visite: typeVisite,
        priorite: priorite,
        duree_min: parseInt(duree),
        notes: notes || '',
        statut: 'planifie'
      }

      const response = await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rdvData)
      })

      if (response.ok) {
        await loadRdvs()
        toast({ 
          title: "✅ RDV planifié", 
          description: `RDV avec ${selectedProspect.nom} le ${new Date(selectedDate).toLocaleDateString('fr-FR')}`
        })
        resetRdvForm()
        setActiveView('rdv')
      } else {
        throw new Error('Erreur création RDV')
      }
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Impossible de créer le RDV",
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
          notes: ''
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

  const stats = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return {
      totalProspects: prospects.length,
      nouveaux: prospects.filter(p => p.statut === 'nouveau').length,
      qualifies: prospects.filter(p => p.statut === 'qualifie').length,
      signes: prospects.filter(p => p.statut === 'signe').length,
      rdvTotal: rdvs.length,
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
      }).length
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
            Commercial: <strong>Karine MOMUS</strong> • Île Maurice
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              loadProspects()
              loadRdvs()
            }}
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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveView('prospects')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Prospects</p>
                <p className="text-2xl font-bold">{stats.totalProspects}</p>
              </div>
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Nouveaux</p>
                <p className="text-2xl font-bold">{stats.nouveaux}</p>
              </div>
              <Target className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Qualifiés</p>
                <p className="text-2xl font-bold">{stats.qualifies}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Signés</p>
                <p className="text-2xl font-bold">{stats.signes}</p>
              </div>
              <Activity className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setActiveView('rdv')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">RDV Total</p>
                <p className="text-2xl font-bold">{stats.rdvTotal}</p>
              </div>
              <Calendar className="h-6 w-6 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Cette semaine</p>
                <p className="text-2xl font-bold">{stats.rdvSemaine}</p>
              </div>
              <Clock className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
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

      {/* Vue Dashboard */}
      {activeView === 'dashboard' && (
        <div className="space-y-4">
          {/* RDV du jour */}
          <Card>
            <CardHeader>
              <CardTitle>Rendez-vous d'aujourd'hui</CardTitle>
            </CardHeader>
            <CardContent>
              {rdvs
                .filter(r => {
                  const rdvDate = new Date(r.date_time)
                  const today = new Date()
                  return rdvDate.toDateString() === today.toDateString()
                })
                .map(rdv => (
                  <div key={rdv.id} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                    <div>
                      <p className="font-medium">{rdv.prospect?.nom || rdv.titre}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(rdv.date_time).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} • {rdv.type_visite} • {rdv.duree_min} min
                      </p>
                    </div>
                    <Badge variant={
                      rdv.priorite === 'urgente' ? 'destructive' : 
                      rdv.priorite === 'haute' ? 'default' : 
                      'secondary'
                    }>
                      {rdv.priorite}
                    </Badge>
                  </div>
                ))}
              
              {stats.rdvAujourdhui === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Aucun rendez-vous aujourd'hui
                </p>
              )}
            </CardContent>
          </Card>

          {/* Prospects prioritaires */}
          <Card>
            <CardHeader>
              <CardTitle>Prospects à contacter en priorité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {prospects
                  .filter(p => p.statut === 'nouveau' || p.statut === 'qualifie')
                  .slice(0, 5)
                  .map(prospect => (
                    <div key={prospect.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{prospect.nom}</p>
                        <p className="text-sm text-gray-500">
                          {prospect.ville} • {SECTEURS[prospect.secteur as keyof typeof SECTEURS]?.label || prospect.secteur}
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedProspect(prospect)
                          setActiveView('nouveau-rdv')
                        }}
                      >
                        Planifier RDV
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vue Prospects */}
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
            {filteredProspects.map(prospect => (
              <Card key={prospect.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{prospect.nom}</h4>
                      <p className="text-sm text-muted-foreground">
                        {SECTEURS[prospect.secteur as keyof typeof SECTEURS]?.icon} {SECTEURS[prospect.secteur as keyof typeof SECTEURS]?.label || prospect.secteur}
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
                  </div>
                  
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
            ))}
          </div>

          {filteredProspects.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun prospect trouvé</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Vue RDV */}
      {activeView === 'rdv' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des rendez-vous</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rdvs
                  .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
                  .map(rdv => {
                    const isPast = new Date(rdv.date_time) < new Date()
                    return (
                      <div key={rdv.id} className={`flex items-center justify-between p-4 border rounded-lg ${isPast ? 'bg-gray-50' : ''}`}>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-bold">
                              {new Date(rdv.date_time).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short'
                              })}
                            </p>
                            <p className="text-lg">
                              {new Date(rdv.date_time).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">{rdv.prospect?.nom || rdv.titre}</p>
                            <p className="text-sm text-gray-500">
                              {rdv.type_visite} • {rdv.duree_min} min
                              {rdv.prospect && ` • ${rdv.prospect.ville}`}
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
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => deleteRdv(rdv.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                
                {rdvs.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Aucun rendez-vous planifié
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vue Nouveau RDV */}
      {activeView === 'nouveau-rdv' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner un prospect</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {prospects
                  .filter(p => p.statut !== 'signe' && p.statut !== 'perdu')
                  .map(prospect => (
                    <div
                      key={prospect.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedProspect?.id === prospect.id ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                      onClick={() => setSelectedProspect(prospect)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{prospect.nom}</p>
                          <p className="text-sm text-gray-500">
                            {prospect.ville} • {SECTEURS[prospect.secteur as keyof typeof SECTEURS]?.label || prospect.secteur}
                          </p>
                        </div>
                        <Badge className={STATUTS[prospect.statut as keyof typeof STATUTS]?.color}>
                          {STATUTS[prospect.statut as keyof typeof STATUTS]?.label}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Détails du rendez-vous</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedProspect ? (
                <form onSubmit={createRdv} className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">{selectedProspect.nom}</p>
                    <p className="text-sm text-gray-500">
                      {selectedProspect.ville} • {selectedProspect.telephone}
                    </p>
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
                        <option value="decouverte">Découverte</option>
                        <option value="presentation">Présentation</option>
                        <option value="negociation">Négociation</option>
                        <option value="signature">Signature</option>
                        <option value="suivi">Suivi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Priorité</label>
                      <select
                        className="w-full border rounded-md px-3 py-2"
                        value={priorite}
                        onChange={(e) => setPriorite(e.target.value as RDV['priorite'])}
                      >
                        <option value="normale">Normale</option>
                        <option value="haute">Haute</option>
                        <option value="urgente">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Durée</label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={duree}
                      onChange={(e) => setDuree(e.target.value)}
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">1 heure</option>
                      <option value="90">1h30</option>
                      <option value="120">2 heures</option>
                    </select>
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

                  <div className="flex gap-3">
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
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Sélectionnez un prospect pour planifier un rendez-vous</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Nouveau Prospect */}
      {showNewProspectForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle>Créer un nouveau prospect</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createProspect} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom *</label>
                    <Input
                      value={newProspect.nom}
                      onChange={(e) => setNewProspect({...newProspect, nom: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Secteur</label>
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
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <Input
                      type="email"
                      value={newProspect.email}
                      onChange={(e) => setNewProspect({...newProspect, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone *</label>
                    <Input
                      value={newProspect.telephone}
                      onChange={(e) => setNewProspect({...newProspect, telephone: e.target.value})}
                      placeholder="+230..."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Ville</label>
                    <Input
                      value={newProspect.ville}
                      onChange={(e) => setNewProspect({...newProspect, ville: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Adresse</label>
                    <Input
                      value={newProspect.adresse}
                      onChange={(e) => setNewProspect({...newProspect, adresse: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <Textarea
                    rows={3}
                    value={newProspect.notes}
                    onChange={(e) => setNewProspect({...newProspect, notes: e.target.value})}
                  />
                </div>

                <div className="flex justify-end gap-3">
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
