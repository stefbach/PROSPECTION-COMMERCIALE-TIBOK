"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { 
  CalendarPlus, Phone, Plus, Search, Mail, Globe, MapPin, Building2, Eye, 
  FileText, TrendingUp, Users, Trash2, Edit, X, Save, Calendar, Clock, 
  CheckCircle, AlertCircle, DollarSign, FileSignature, Download, Upload, 
  Star, Activity, Target, Timer, User, RefreshCw, Filter, Database
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
  created_at?: string
  updated_at?: string
}

interface RDV {
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
  statut: 'planifie' | 'confirme' | 'en-cours' | 'termine' | 'annule' | 'reporte'
  notes?: string
  lieu?: string
  created_at?: string
  updated_at?: string
}

// ========== CONFIGURATION ==========
const MAURITIUS_CONFIG = {
  districts: {
    'port-louis': { label: 'Port Louis', color: 'blue' },
    'pamplemousses': { label: 'Pamplemousses', color: 'green' },
    'riviere-du-rempart': { label: 'Rivière du Rempart', color: 'purple' },
    'flacq': { label: 'Flacq', color: 'orange' },
    'grand-port': { label: 'Grand Port', color: 'red' },
    'savanne': { label: 'Savanne', color: 'yellow' },
    'plaines-wilhems': { label: 'Plaines Wilhems', color: 'indigo' },
    'moka': { label: 'Moka', color: 'pink' },
    'riviere-noire': { label: 'Rivière Noire', color: 'cyan' }
  },
  secteurs: {
    'hotel': { label: 'Hôtel', icon: '🏨' },
    'restaurant': { label: 'Restaurant', icon: '🍽️' },
    'clinique': { label: 'Clinique', icon: '🏥' },
    'pharmacie': { label: 'Pharmacie', icon: '💊' },
    'supermarche': { label: 'Supermarché', icon: '🛒' },
    'entreprise': { label: 'Entreprise', icon: '🏢' },
    'ecole': { label: 'École', icon: '🎓' },
    'autre': { label: 'Autre', icon: '📍' }
  },
  statuts: {
    'nouveau': { label: 'Nouveau', color: 'gray' },
    'contacte': { label: 'Contacté', color: 'blue' },
    'qualifie': { label: 'Qualifié', color: 'yellow' },
    'proposition': { label: 'Proposition', color: 'purple' },
    'negociation': { label: 'Négociation', color: 'orange' },
    'signe': { label: 'Signé', color: 'green' },
    'perdu': { label: 'Perdu', color: 'red' }
  },
  labels: {
    currency: 'Rs'
  }
}

// ========== COMPOSANT PRINCIPAL ==========
export default function MauritiusProspectsSection() {
  // États principaux
  const [loading, setLoading] = React.useState(false)
  const [prospects, setProspects] = React.useState<Prospect[]>([])
  const [allProspects, setAllProspects] = React.useState<Prospect[]>([])
  const [viewMode, setViewMode] = React.useState<'paginated' | 'all'>('paginated')
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })
  
  // États des filtres
  const [filters, setFilters] = React.useState({
    secteur: '',
    district: '',
    statut: '',
    search: ''
  })
  
  // États UI
  const [showAddDialog, setShowAddDialog] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)
  
  const { toast } = useToast()

  // ========== CHARGEMENT DES DONNÉES ==========
  
  // Charger avec pagination
  async function loadProspects(page = 1, limit = pagination.limit) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.secteur) params.set('secteur', filters.secteur)
      if (filters.district) params.set('district', filters.district)
      if (filters.statut) params.set('statut', filters.statut)
      if (filters.search) params.set('q', filters.search)
      
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      
      const res = await fetch(`/api/prospects?${params.toString()}`, { cache: 'no-store' })
      const result = await res.json()
      
      if (result.data && result.pagination) {
        setProspects(result.data)
        setPagination({
          page,
          limit,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        })
      } else {
        const data = Array.isArray(result) ? result : []
        setProspects(data.slice((page - 1) * limit, page * limit))
        setPagination({
          page,
          limit,
          total: data.length,
          totalPages: Math.ceil(data.length / limit)
        })
      }
    } catch (error) {
      console.error('Erreur chargement prospects:', error)
      toast({ 
        title: 'Erreur', 
        description: 'Impossible de charger les prospects',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Charger TOUS les prospects
  async function loadAllProspects() {
    setLoading(true)
    setViewMode('all')
    
    try {
      const params = new URLSearchParams()
      if (filters.secteur) params.set('secteur', filters.secteur)
      if (filters.district) params.set('district', filters.district)
      if (filters.statut) params.set('statut', filters.statut)
      if (filters.search) params.set('q', filters.search)
      
      params.set('limit', '10000')
      params.set('page', '1')
      
      const res = await fetch(`/api/prospects?${params.toString()}`, { cache: 'no-store' })
      const result = await res.json()
      
      const allData = result.data || result || []
      setAllProspects(allData)
      
      toast({
        title: '✅ Chargement complet',
        description: `${allData.length} prospects chargés`
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger tous les prospects',
        variant: 'destructive'
      })
      setViewMode('paginated')
    } finally {
      setLoading(false)
    }
  }

  // Rafraîchir les données
  async function refreshData() {
    setRefreshing(true)
    if (viewMode === 'all') {
      await loadAllProspects()
    } else {
      await loadProspects(pagination.page)
    }
    setRefreshing(false)
  }

  // Charger au démarrage
  React.useEffect(() => {
    loadProspects(1)
  }, [])

  // ========== GESTION DES PROSPECTS ==========
  
  // Ajouter un prospect
  async function addProspect(p: Omit<Prospect, "id">) {
    try {
      const res = await fetch('/api/prospects', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(p) 
      })
      
      if (!res.ok) throw new Error(await res.text())
      
      const created = await res.json()
      
      if (viewMode === 'all') {
        setAllProspects(prev => [created, ...prev])
      } else {
        loadProspects(pagination.page)
      }
      
      toast({ 
        title: "✅ Prospect ajouté", 
        description: `${created.nom} a été ajouté avec succès.` 
      })
      
      return created
    } catch (e: any) {
      toast({ 
        title: "Erreur", 
        description: e.message || "Impossible d'ajouter le prospect",
        variant: "destructive"
      })
      return null
    }
  }

  // Mettre à jour un prospect
  async function updateProspect(id: number, updates: Partial<Prospect>) {
    try {
      const res = await fetch(`/api/prospects`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id, ...updates }) 
      })
      
      if (!res.ok) throw new Error(await res.text())
      
      const updated = await res.json()
      
      if (viewMode === 'all') {
        setAllProspects(prev => prev.map(p => p.id === id ? updated : p))
      } else {
        setProspects(prev => prev.map(p => p.id === id ? updated : p))
      }
      
      toast({ 
        title: "✅ Prospect modifié", 
        description: "Les modifications ont été enregistrées"
      })
      
      return updated
    } catch (e: any) {
      toast({ 
        title: "Erreur", 
        description: e.message || "Impossible de modifier le prospect",
        variant: "destructive"
      })
      return null
    }
  }

  // Supprimer un prospect
  async function deleteProspect(id: number) {
    try {
      const res = await fetch(`/api/prospects?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      
      if (viewMode === 'all') {
        setAllProspects(prev => prev.filter(p => p.id !== id))
      } else {
        loadProspects(pagination.page)
      }
      
      toast({ 
        title: "Prospect supprimé", 
        description: "Le prospect a été supprimé avec succès." 
      })
      
      return true
    } catch (e: any) {
      toast({ 
        title: "Erreur", 
        description: e.message || "Impossible de supprimer le prospect",
        variant: "destructive"
      })
      return false
    }
  }

  // Mettre à jour le statut
  async function updateStatus(id: number, statut: Statut) {
    return updateProspect(id, { statut })
  }

  // ========== FILTRES ET RECHERCHE ==========
  
  const applyFilters = () => {
    if (viewMode === 'all') {
      loadAllProspects()
    } else {
      loadProspects(1)
    }
  }

  const resetFilters = () => {
    setFilters({ secteur: '', district: '', statut: '', search: '' })
    setTimeout(() => {
      if (viewMode === 'all') {
        loadAllProspects()
      } else {
        loadProspects(1)
      }
    }, 100)
  }

  // Données filtrées
  const filtered = React.useMemo(() => {
    const sourceData = viewMode === 'all' ? allProspects : prospects
    
    return sourceData.filter((p) => {
      const matchSecteur = !filters.secteur || p.secteur === filters.secteur
      const matchDistrict = !filters.district || p.district === filters.district
      const matchStatut = !filters.statut || p.statut === filters.statut
      const matchSearch = !filters.search || 
        p.nom.toLowerCase().includes(filters.search.toLowerCase()) || 
        p.ville.toLowerCase().includes(filters.search.toLowerCase()) ||
        (p.contact && p.contact.toLowerCase().includes(filters.search.toLowerCase()))
      return matchSecteur && matchDistrict && matchStatut && matchSearch
    })
  }, [prospects, allProspects, filters, viewMode])

  // ========== STATISTIQUES ==========
  
  const stats = React.useMemo(() => {
    return {
      total: viewMode === 'all' ? allProspects.length : pagination.total,
      nouveaux: filtered.filter(p => p.statut === 'nouveau').length,
      qualifies: filtered.filter(p => p.statut === 'qualifie').length,
      signes: filtered.filter(p => p.statut === 'signe').length,
      affiches: filtered.length
    }
  }, [filtered, pagination.total, viewMode, allProspects])

  // ========== RENDU ==========
  
  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <p className="text-xs text-gray-600">Total prospects</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.affiches}</div>
                <p className="text-xs text-gray-600">Affichés</p>
              </div>
              <Eye className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.nouveaux}</div>
                <p className="text-xs text-gray-600">Nouveaux</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.qualifies}</div>
                <p className="text-xs text-gray-600">Qualifiés</p>
              </div>
              <FileText className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.signes}</div>
                <p className="text-xs text-gray-600">Clients signés</p>
              </div>
              <CalendarPlus className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-base text-gray-900">Filtres & Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ligne de filtres */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  value={filters.search} 
                  onChange={(e) => setFilters({...filters, search: e.target.value})} 
                  placeholder="Nom, ville, contact..." 
                  className="pl-10 bg-white text-gray-900 border-gray-300"
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Secteur</label>
              <select 
                value={filters.secteur} 
                onChange={(e) => setFilters({...filters, secteur: e.target.value})} 
                className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
              >
                <option value="">Tous les secteurs</option>
                {Object.entries(MAURITIUS_CONFIG.secteurs).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">District</label>
              <select 
                value={filters.district} 
                onChange={(e) => setFilters({...filters, district: e.target.value})} 
                className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
              >
                <option value="">Tous les districts</option>
                {Object.entries(MAURITIUS_CONFIG.districts).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Statut</label>
              <select 
                value={filters.statut} 
                onChange={(e) => setFilters({...filters, statut: e.target.value})} 
                className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
              >
                <option value="">Tous les statuts</option>
                {Object.entries(MAURITIUS_CONFIG.statuts).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">&nbsp;</label>
              <Button 
                variant="secondary" 
                onClick={applyFilters} 
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtrer
              </Button>
            </div>
          </div>

          {/* Ligne d'actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={resetFilters}
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Réinitialiser
              </Button>
              
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                onClick={() => {
                  if (viewMode === 'paginated') {
                    loadAllProspects()
                  } else {
                    setViewMode('paginated')
                    loadProspects(1)
                  }
                }}
                disabled={loading}
                className={viewMode === 'all' ? 
                  "bg-purple-600 text-white hover:bg-purple-700" : 
                  "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }
              >
                {loading ? 'Chargement...' : viewMode === 'all' ? '✓ Vue complète' : 'Charger tout'}
              </Button>
              
              <Button
                variant="outline"
                onClick={refreshData}
                disabled={refreshing}
                className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Prospect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des prospects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <ProspectCard
            key={p.id}
            prospect={p}
            onStatusChange={(statut) => updateStatus(p.id, statut)}
            onUpdate={(updated) => updateProspect(p.id, updated)}
            onDelete={() => deleteProspect(p.id)}
            refreshList={refreshData}
          />
        ))}
        
        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-600 bg-white rounded-lg border border-gray-200">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="mb-1">Aucun prospect ne correspond aux filtres sélectionnés.</p>
            <Button onClick={resetFilters} variant="outline" className="mt-2">
              Réinitialiser les filtres
            </Button>
          </div>
        )}
        
        {loading && (
          <div className="col-span-full text-center py-8 text-gray-600 bg-white rounded-lg border border-gray-200">
            <div className="space-y-2">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              <div>Chargement des prospects...</div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {viewMode === 'paginated' && pagination.totalPages > 1 && (
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {pagination.page} sur {pagination.totalPages} • {pagination.total} prospects
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadProspects(1)}
                  disabled={pagination.page === 1}
                >
                  Première
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadProspects(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadProspects(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Suivant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadProspects(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Dernière
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Ajout Prospect */}
      <AddProspectDialog 
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={async (p) => {
          const created = await addProspect(p)
          if (created) {
            setShowAddDialog(false)
          }
        }}
      />
    </div>
  )
}

// ========== COMPOSANT CARTE PROSPECT ==========
function ProspectCard({ 
  prospect, 
  onStatusChange,
  onUpdate,
  onDelete,
  refreshList
}: { 
  prospect: Prospect
  onStatusChange: (statut: Statut) => void
  onUpdate: (updates: Partial<Prospect>) => void
  onDelete: () => void
  refreshList: () => void
}) {
  const [showDetail, setShowDetail] = React.useState(false)
  const [showRdvDialog, setShowRdvDialog] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [upcomingRdv, setUpcomingRdv] = React.useState<RDV | null>(null)
  const [rdvCount, setRdvCount] = React.useState(0)
  const [loadingRdv, setLoadingRdv] = React.useState(true)
  
  const statutConfig = MAURITIUS_CONFIG.statuts[prospect.statut]
  const secteurConfig = MAURITIUS_CONFIG.secteurs[prospect.secteur]
  const districtConfig = MAURITIUS_CONFIG.districts[prospect.district]
  
  // Charger les RDV du prospect
  React.useEffect(() => {
    loadProspectRdvs()
  }, [prospect.id])
  
  async function loadProspectRdvs() {
    setLoadingRdv(true)
    try {
      const res = await fetch(`/api/rdv?prospect_id=${prospect.id}`)
      if (res.ok) {
        const rdvs = await res.json()
        setRdvCount(rdvs.length)
        
        // Trouver le prochain RDV
        const now = new Date()
        const futureRdvs = rdvs
          .filter((rdv: RDV) => 
            new Date(rdv.date_time) >= now && 
            rdv.statut !== 'annule' && 
            rdv.statut !== 'termine'
          )
          .sort((a: RDV, b: RDV) => 
            new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
          )
        
        setUpcomingRdv(futureRdvs[0] || null)
      }
    } catch (error) {
      console.error('Erreur chargement RDV:', error)
    } finally {
      setLoadingRdv(false)
    }
  }
  
  const getTimeUntilRdv = () => {
    if (!upcomingRdv) return null
    
    const now = new Date()
    const rdvDate = new Date(upcomingRdv.date_time)
    const diffMs = rdvDate.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (diffDays > 0) {
      return `Dans ${diffDays}j`
    } else if (diffHours > 0) {
      return `Dans ${diffHours}h`
    } else {
      return "Aujourd'hui"
    }
  }

  const statutColors: Record<string, string> = {
    gray: "bg-gray-100 text-gray-800 border-gray-300",
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    purple: "bg-purple-100 text-purple-800 border-purple-300",
    orange: "bg-orange-100 text-orange-800 border-orange-300",
    green: "bg-green-100 text-green-800 border-green-300",
    red: "bg-red-100 text-red-800 border-red-300"
  }

  return (
    <>
      <Card 
        className="transition-all hover:shadow-lg cursor-pointer relative group bg-white border-gray-200 hover:border-blue-300"
        onClick={() => setShowDetail(true)}
      >
        {/* Badges */}
        <div className="absolute -top-2 -right-2 z-10 flex gap-2">
          {prospect.priority === 'Haute' && (
            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              ⚡ Priorité
            </div>
          )}
          
          {upcomingRdv && (
            <div className={`text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
              upcomingRdv.priorite === 'urgente' ? 'bg-red-500' :
              upcomingRdv.priorite === 'haute' ? 'bg-orange-500' :
              'bg-blue-500'
            }`}>
              <Calendar className="h-3 w-3" />
              {getTimeUntilRdv()}
            </div>
          )}
          
          {rdvCount > 0 && !upcomingRdv && (
            <div className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
              {rdvCount} RDV passé{rdvCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">{secteurConfig?.icon}</span>
                <span className="truncate">{prospect.nom}</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {secteurConfig?.label}
              </p>
            </div>
            <Badge className={`${statutColors[statutConfig?.color || 'gray']} border`}>
              {statutConfig?.label}
            </Badge>
          </div>

          {/* RDV Info */}
          {!loadingRdv && upcomingRdv && (
            <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">
                  RDV : {new Date(upcomingRdv.date_time).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
                <span className="text-blue-700">
                  à {new Date(upcomingRdv.date_time).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {upcomingRdv.statut === 'confirme' && (
                <div className="flex items-center gap-1 mt-1 text-xs text-green-700">
                  <CheckCircle className="h-3 w-3" />
                  Confirmé
                </div>
              )}
            </div>
          )}

          {/* Infos principales */}
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{prospect.ville}, {districtConfig?.label}</span>
            </div>
            
            {prospect.contact && (
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4 text-gray-400" />
                <span>{prospect.contact}</span>
              </div>
            )}
            
            {prospect.telephone && (
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{prospect.telephone}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">
                {"★".repeat(Math.min(5, Math.max(1, prospect.score)))}
                {"☆".repeat(Math.max(0, 5 - prospect.score))}
              </span>
              <span className="text-xs text-gray-600">Score: {prospect.score}/5</span>
              {rdvCount > 0 && (
                <span className="text-xs text-gray-600 ml-2">
                  • {rdvCount} RDV
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          {prospect.notes && (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded text-sm text-gray-700 mb-4 line-clamp-2">
              {prospect.notes}
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
            <Button 
              size="sm" 
              className={`${upcomingRdv ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
              onClick={(e) => {
                e.stopPropagation()
                setShowRdvDialog(true)
              }}
            >
              <Calendar className="h-4 w-4 mr-1" />
              {upcomingRdv ? 'Gérer RDV' : 'Planifier'}
            </Button>
            
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={(e) => {
                e.stopPropagation()
                if (prospect.telephone) {
                  window.location.href = `tel:${prospect.telephone}`
                }
              }}
              disabled={!prospect.telephone}
            >
              <Phone className="h-4 w-4 mr-1" />
              Appeler
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
              onClick={(e) => {
                e.stopPropagation()
                setShowDetail(true)
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Détails
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              className="bg-white hover:bg-red-50 text-red-600 border-gray-300"
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteDialog(true)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Dialogs */}
      <ProspectDetailModal
        prospect={prospect}
        open={showDetail}
        onClose={() => {
          setShowDetail(false)
          loadProspectRdvs()
        }}
        onUpdate={onUpdate}
        onDelete={() => {
          setShowDetail(false)
          onDelete()
        }}
      />

      <RdvDialog
        prospect={prospect}
        open={showRdvDialog}
        onClose={() => setShowRdvDialog(false)}
        onSuccess={() => {
          loadProspectRdvs()
          setShowRdvDialog(false)
          refreshList()
        }}
        existingRdv={upcomingRdv}
      />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Voulez-vous vraiment supprimer "{prospect.nom}" ?
              {rdvCount > 0 && (
                <span className="block mt-2 text-orange-600 font-medium">
                  ⚠️ Attention : {rdvCount} rendez-vous seront également supprimés.
                </span>
              )}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="bg-white text-gray-700 border-gray-300"
            >
              Annuler
            </Button>
            <Button 
              onClick={() => {
                onDelete()
                setShowDeleteDialog(false)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ========== MODAL DÉTAILS PROSPECT ==========
function ProspectDetailModal({
  prospect,
  open,
  onClose,
  onUpdate,
  onDelete
}: {
  prospect: Prospect
  open: boolean
  onClose: () => void
  onUpdate: (updates: Partial<Prospect>) => void
  onDelete?: () => void
}) {
  const [editMode, setEditMode] = React.useState(false)
  const [form, setForm] = React.useState(prospect)
  const [rdvs, setRdvs] = React.useState<RDV[]>([])
  const [loadingRdvs, setLoadingRdvs] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    setForm(prospect)
    setEditMode(false)
    if (open) {
      loadRdvs()
    }
  }, [prospect, open])

  async function loadRdvs() {
    setLoadingRdvs(true)
    try {
      const res = await fetch(`/api/rdv?prospect_id=${prospect.id}`)
      if (res.ok) {
        const data = await res.json()
        setRdvs(data)
      }
    } catch (error) {
      console.error('Erreur chargement RDV:', error)
    } finally {
      setLoadingRdvs(false)
    }
  }

  async function saveChanges() {
    onUpdate(form)
    setEditMode(false)
  }

  const statutConfig = MAURITIUS_CONFIG.statuts[form.statut]
  const secteurConfig = MAURITIUS_CONFIG.secteurs[form.secteur]
  const districtConfig = MAURITIUS_CONFIG.districts[form.district]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900 flex items-center justify-between">
            <span className="flex items-center gap-3">
              <span className="text-3xl">{secteurConfig?.icon}</span>
              {editMode ? (
                <Input 
                  value={form.nom}
                  onChange={(e) => setForm({...form, nom: e.target.value})}
                  className="text-2xl font-semibold bg-white text-gray-900 border-gray-300"
                />
              ) : (
                prospect.nom
              )}
            </span>
            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForm(prospect)
                      setEditMode(false)
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveChanges}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Enregistrer
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditMode(true)}
                    className="bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onDelete}
                      className="bg-white text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  )}
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="informations" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="informations">Informations</TabsTrigger>
            <TabsTrigger value="rdv" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              RDV ({rdvs.length})
            </TabsTrigger>
            <TabsTrigger value="historique">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="informations" className="space-y-4 mt-4">
            {/* Contenu informations */}
            <div className="grid grid-cols-2 gap-4">
              {/* Colonne gauche */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Statut</label>
                  {editMode ? (
                    <select
                      value={form.statut}
                      onChange={(e) => setForm({...form, statut: e.target.value as Statut})}
                      className="w-full mt-1 border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
                    >
                      {Object.entries(MAURITIUS_CONFIG.statuts).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1">
                      <Badge className={`${
                        statutConfig?.color === 'green' ? 'bg-green-100 text-green-800' :
                        statutConfig?.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {statutConfig?.label}
                      </Badge>
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Score</label>
                  {editMode ? (
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={form.score}
                      onChange={(e) => setForm({...form, score: parseInt(e.target.value) || 3})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1 text-yellow-500">
                      {"★".repeat(form.score)}{"☆".repeat(5-form.score)} ({form.score}/5)
                    </p>
                  )}
                </div>
              </div>

              {/* Colonne droite */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact</label>
                  {editMode ? (
                    <Input
                      value={form.contact || ''}
                      onChange={(e) => setForm({...form, contact: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">{form.contact || 'Non spécifié'}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Téléphone</label>
                  {editMode ? (
                    <Input
                      value={form.telephone || ''}
                      onChange={(e) => setForm({...form, telephone: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">{form.telephone || 'Non spécifié'}</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rdv" className="space-y-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Rendez-vous</h3>
              <RdvDialog prospect={prospect} onSuccess={loadRdvs}>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau RDV
                </Button>
              </RdvDialog>
            </div>

            {loadingRdvs ? (
              <div className="text-center py-8">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
              </div>
            ) : rdvs.length > 0 ? (
              <div className="space-y-3">
                {rdvs.map((rdv) => (
                  <Card key={rdv.id} className="bg-white border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(rdv.date_time).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(rdv.date_time).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} • {rdv.duree_min} min • {rdv.type_visite}
                          </p>
                          {rdv.notes && (
                            <p className="text-sm text-gray-600 mt-2">{rdv.notes}</p>
                          )}
                        </div>
                        <Badge className={
                          rdv.statut === 'termine' ? 'bg-green-100 text-green-800' :
                          rdv.statut === 'annule' ? 'bg-red-100 text-red-800' :
                          rdv.statut === 'confirme' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {rdv.statut}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Aucun rendez-vous planifié</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="historique" className="space-y-4 mt-4">
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-8 text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Historique des interactions à venir</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// ========== DIALOG CRÉATION RDV ==========
function RdvDialog({ 
  prospect, 
  open, 
  onClose,
  onSuccess,
  children,
  existingRdv
}: { 
  prospect: Prospect
  open?: boolean
  onClose?: () => void
  onSuccess?: () => void
  children?: React.ReactNode
  existingRdv?: RDV | null
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    date: '',
    time: '',
    duree_min: 60,
    type_visite: 'decouverte' as RDV['type_visite'],
    priorite: 'normale' as RDV['priorite'],
    notes: '',
    lieu: ''
  })
  const { toast } = useToast()

  const actualOpen = open !== undefined ? open : isOpen
  const actualOnClose = onClose || (() => setIsOpen(false))

  React.useEffect(() => {
    // Initialiser le formulaire
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    setForm({
      date: tomorrow.toISOString().split('T')[0],
      time: '10:00',
      duree_min: 60,
      type_visite: 'decouverte',
      priorite: prospect.score >= 4 ? 'haute' : 'normale',
      notes: '',
      lieu: prospect.adresse || `${prospect.ville}, ${prospect.district}`
    })
  }, [prospect, actualOpen])

  async function createRdv() {
    if (!form.date || !form.time) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir la date et l'heure",
        variant: "destructive"
      })
      return
    }

    try {
      // IMPORTANT: Inclure l'objet prospect complet pour la synchronisation avec planning
      const rdvData = {
        prospect_id: prospect.id,
        prospect_nom: prospect.nom,
        commercial: "Karine MOMUS", // À récupérer depuis les paramètres utilisateur
        titre: `RDV - ${prospect.nom}`,
        date_time: `${form.date}T${form.time}:00`,
        duree_min: form.duree_min,
        type_visite: form.type_visite,
        priorite: form.priorite,
        statut: 'planifie' as const,
        notes: form.notes,
        lieu: form.lieu,
        // Données complètes du prospect pour la page planning
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

      if (!res.ok) {
        const error = await res.text()
        throw new Error(error)
      }

      toast({
        title: "✅ RDV créé",
        description: `Rendez-vous planifié avec ${prospect.nom} le ${new Date(rdvData.date_time).toLocaleDateString('fr-FR')}`
      })

      actualOnClose()
      onSuccess?.()
      
    } catch (error: any) {
      console.error('Erreur création RDV:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le RDV",
        variant: "destructive"
      })
    }
  }

  const dialogContent = (
    <DialogContent className="bg-white max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-xl text-gray-900">
          Planifier un rendez-vous avec {prospect.nom}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 mt-4">
        {/* Date et heure */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({...form, date: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
              className="bg-white text-gray-900 border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Heure *</label>
            <Input
              type="time"
              value={form.time}
              onChange={(e) => setForm({...form, time: e.target.value})}
              className="bg-white text-gray-900 border-gray-300"
            />
          </div>
        </div>

        {/* Type et durée */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type de visite</label>
            <select
              value={form.type_visite}
              onChange={(e) => setForm({...form, type_visite: e.target.value as RDV['type_visite']})}
              className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
            >
              <option value="decouverte">🔍 Découverte</option>
              <option value="presentation">📊 Présentation</option>
              <option value="negociation">💼 Négociation</option>
              <option value="signature">✍️ Signature</option>
              <option value="suivi">📞 Suivi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durée</label>
            <select
              value={form.duree_min}
              onChange={(e) => setForm({...form, duree_min: parseInt(e.target.value)})}
              className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
            >
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 heure</option>
              <option value="90">1h30</option>
              <option value="120">2 heures</option>
            </select>
          </div>
        </div>

        {/* Priorité et lieu */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
            <select
              value={form.priorite}
              onChange={(e) => setForm({...form, priorite: e.target.value as RDV['priorite']})}
              className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
            >
              <option value="normale">🟢 Normale</option>
              <option value="haute">🟠 Haute</option>
              <option value="urgente">🔴 Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lieu</label>
            <Input
              value={form.lieu}
              onChange={(e) => setForm({...form, lieu: e.target.value})}
              placeholder="Lieu du rendez-vous"
              className="bg-white text-gray-900 border-gray-300"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes / Objectifs</label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({...form, notes: e.target.value})}
            rows={3}
            placeholder="Points à aborder, objectifs du rendez-vous..."
            className="bg-white text-gray-900 border-gray-300"
          />
        </div>

        {/* Info prospect */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-2">Informations prospect</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Score : {prospect.score}/5 ⭐</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Statut : {MAURITIUS_CONFIG.statuts[prospect.statut].label}</span>
              </div>
              {prospect.budget && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Budget : Rs {prospect.budget}</span>
                </div>
              )}
              {prospect.contact && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Contact : {prospect.contact}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={actualOnClose}
          className="bg-white text-gray-700 border-gray-300"
        >
          Annuler
        </Button>
        <Button
          onClick={createRdv}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Créer le RDV
        </Button>
      </div>
    </DialogContent>
  )

  if (children) {
    return (
      <Dialog open={actualOpen} onOpenChange={actualOnClose}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        {dialogContent}
      </Dialog>
    )
  }

  return (
    <Dialog open={actualOpen} onOpenChange={actualOnClose}>
      {dialogContent}
    </Dialog>
  )
}

// ========== DIALOG AJOUT PROSPECT ==========
function AddProspectDialog({ 
  open,
  onClose,
  onAdd 
}: { 
  open: boolean
  onClose: () => void
  onAdd: (p: Omit<Prospect, "id">) => void 
}) {
  const [form, setForm] = React.useState<Omit<Prospect, "id">>({
    nom: "",
    secteur: "autre",
    ville: "",
    district: "port-louis",
    statut: "nouveau",
    contact: "",
    telephone: "",
    email: "",
    score: 3,
    budget: "",
    notes: "",
    website: "",
    adresse: ""
  })

  function submit() {
    if (!form.nom || !form.ville) {
      return
    }
    onAdd(form)
    // Réinitialiser le formulaire
    setForm({
      ...form,
      nom: "",
      ville: "",
      contact: "",
      telephone: "",
      email: "",
      budget: "",
      notes: "",
      website: "",
      adresse: ""
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-900">Ajouter un nouveau prospect</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nom de l'entreprise *</label>
            <Input 
              placeholder="Nom de l'entreprise" 
              value={form.nom} 
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="bg-white text-gray-900 border-gray-300"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Secteur d'activité</label>
            <select 
              className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2" 
              value={form.secteur} 
              onChange={(e) => setForm({ ...form, secteur: e.target.value as Secteur })}
            >
              {Object.entries(MAURITIUS_CONFIG.secteurs).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Ville *</label>
            <Input 
              placeholder="Ville" 
              value={form.ville} 
              onChange={(e) => setForm({ ...form, ville: e.target.value })}
              className="bg-white text-gray-900 border-gray-300"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">District</label>
            <select 
              className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2" 
              value={form.district} 
              onChange={(e) => setForm({ ...form, district: e.target.value as District })}
            >
              {Object.entries(MAURITIUS_CONFIG.districts).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Personne de contact</label>
            <Input 
              placeholder="Nom du contact" 
              value={form.contact} 
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="bg-white text-gray-900 border-gray-300"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Téléphone</label>
            <Input 
              placeholder="+230 5123 4567" 
              value={form.telephone} 
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              className="bg-white text-gray-900 border-gray-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <Input 
              type="email"
              placeholder="email@exemple.com" 
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-white text-gray-900 border-gray-300"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Score (1-5)</label>
            <Input 
              type="number"
              min="1"
              max="5"
              value={form.score} 
              onChange={(e) => setForm({ ...form, score: parseInt(e.target.value) || 3 })}
              className="bg-white text-gray-900 border-gray-300"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Adresse complète</label>
            <Input 
              placeholder="Adresse complète" 
              value={form.adresse} 
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              className="bg-white text-gray-900 border-gray-300"
            />
          </div>
          
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Notes et commentaires</label>
            <Textarea 
              placeholder="Notes et commentaires..." 
              value={form.notes} 
              onChange={(e) => setForm({ ...form, notes: e.target.value })} 
              rows={4}
              className="bg-white text-gray-900 border-gray-300"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            Annuler
          </Button>
          <Button 
            onClick={submit}
            disabled={!form.nom || !form.ville}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Enregistrer le prospect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
