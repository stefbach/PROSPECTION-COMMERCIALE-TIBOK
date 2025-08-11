"use client"

import * as React from "react"
import { MAURITIUS_CONFIG, type Prospect, type District, type Secteur, type Statut } from "@/lib/mauritius-config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  CalendarPlus, Phone, Plus, Search, Mail, Globe, MapPin, Building2, Eye, 
  FileText, TrendingUp, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Trash2, Edit, X, Save, Calendar, Clock, CheckCircle, AlertCircle, DollarSign,
  FileSignature, Download, Upload, Star, Activity, Target, Timer
} from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ImportAnalyzer } from '@/components/import-analyzer'

function getStars(score: number | undefined): string {
  const normalizedScore = Math.min(5, Math.max(1, Math.ceil((score || 50) / 20)))
  return "★".repeat(normalizedScore) + "☆".repeat(5 - normalizedScore)
}

// Types pour RDV et Contrats
interface RDV {
  id: number
  prospect_id: number
  prospect_nom?: string
  commercial: string
  titre: string
  date_time: string
  duree_min: number
  type_visite: 'decouverte' | 'presentation' | 'negociation' | 'signature' | 'suivi'
  priorite: 'normale' | 'haute' | 'urgente'
  statut: 'planifie' | 'confirme' | 'en-cours' | 'termine' | 'annule' | 'reporte'
  notes?: string
  lieu?: string
  created_at: string
  updated_at: string
}

interface Contrat {
  id: number
  prospect_id: number
  numero: string
  titre: string
  date_debut: string
  date_fin: string
  montant: number
  devise: string
  statut: 'brouillon' | 'envoye' | 'negocie' | 'signe' | 'actif' | 'termine' | 'annule'
  type: 'vente' | 'service' | 'maintenance' | 'location' | 'autre'
  conditions?: string
  fichier_url?: string
  created_at: string
  updated_at: string
}

export default function MauritiusProspectsSection() {
  const [loading, setLoading] = React.useState(false)
  const [loadingMessage, setLoadingMessage] = React.useState('')
  const [prospects, setProspects] = React.useState<Prospect[]>([])
  const [allProspects, setAllProspects] = React.useState<Prospect[]>([])
  const [viewMode, setViewMode] = React.useState<'paginated' | 'all'>('paginated')
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })
  const [filters, setFilters] = React.useState({
    secteur: '',
    district: '',
    statut: '',
    search: ''
  })
  const { toast } = useToast()

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
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les prospects' })
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
        title: 'Chargement complet',
        description: `${allData.length} prospects chargés en mémoire`
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

  React.useEffect(() => {
    loadProspects(1)
  }, [])

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
    } catch (e: any) {
      toast({ 
        title: "Erreur", 
        description: e.message || "Impossible de supprimer le prospect",
        variant: "destructive"
      })
    }
  }

  // Changer de page
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadProspects(newPage)
    }
  }

  // Changer la limite
  const handleLimitChange = (newLimit: number) => {
    setPagination({ ...pagination, limit: newLimit })
    loadProspects(1, newLimit)
  }

  // Appliquer les filtres
  const applyFilters = () => {
    if (viewMode === 'all') {
      loadAllProspects()
    } else {
      loadProspects(1)
    }
  }

  // Réinitialiser les filtres
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

  // Statistiques
  const stats = React.useMemo(() => {
    return {
      total: viewMode === 'all' ? allProspects.length : pagination.total,
      nouveaux: filtered.filter(p => p.statut === 'nouveau').length,
      qualifies: filtered.filter(p => p.statut === 'qualifie').length,
      signes: filtered.filter(p => p.statut === 'signe').length,
      affiches: filtered.length
    }
  }, [filtered, pagination.total, viewMode, allProspects])

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
        title: "Prospect ajouté", 
        description: `${created.nom} a été ajouté avec succès.` 
      })
    } catch (e: any) {
      toast({ 
        title: "Erreur", 
        description: e.message || "Impossible d'ajouter le prospect" 
      })
    }
  }

  async function updateStatus(id: number, statut: Statut) {
    try {
      const res = await fetch(`/api/prospects`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id, statut }) 
      })
      if (!res.ok) throw new Error(await res.text())
      
      if (viewMode === 'all') {
        setAllProspects(prev => prev.map(p => (p.id === id ? { ...p, statut } : p)))
      } else {
        setProspects(prev => prev.map(p => (p.id === id ? { ...p, statut } : p)))
      }
      
      toast({ 
        title: "Statut mis à jour", 
        description: `Le statut a été changé en ${MAURITIUS_CONFIG.statuts[statut].label}` 
      })
    } catch (e: any) {
      toast({ 
        title: "Erreur", 
        description: e.message || "Impossible de mettre à jour le statut" 
      })
    }
  }

  function updateProspect(updated: Prospect) {
    if (viewMode === 'all') {
      setAllProspects(prev => prev.map(p => p.id === updated.id ? updated : p))
    } else {
      setProspects(prev => prev.map(p => p.id === updated.id ? updated : p))
    }
  }

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

      {/* Filtres */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-base text-gray-900">Filtres & Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Recherche par nom</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  value={filters.search} 
                  onChange={(e) => setFilters({...filters, search: e.target.value})} 
                  placeholder="Nom, ville, contact..." 
                  className="pl-10 bg-white text-gray-900 border-gray-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Secteur d'activité</label>
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
                <Search className="h-4 w-4 mr-1" />
                Filtrer
              </Button>
            </div>
          </div>

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
            </div>

            <div className="flex gap-2">
              <ImportAnalyzer onImportComplete={() => viewMode === 'all' ? loadAllProspects() : loadProspects(pagination.page)} />
              <AddProspectDialog onAdd={addProspect} />
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
            onUpdate={updateProspect}
            onDelete={() => deleteProspect(p.id)}
          />
        ))}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-600 bg-white rounded-lg border border-gray-200">
            Aucun prospect ne correspond aux filtres sélectionnés.
          </div>
        )}
        {loading && (
          <div className="col-span-full text-center py-8 text-gray-600 bg-white rounded-lg border border-gray-200">
            <div className="space-y-2">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              <div>{loadingMessage || 'Chargement des prospects...'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ProspectCard avec boutons RDV et Contrat
function ProspectCard({ 
  prospect, 
  onStatusChange,
  onUpdate,
  onDelete
}: { 
  prospect: Prospect
  onStatusChange: (statut: Statut) => void
  onUpdate: (updated: Prospect) => void
  onDelete: () => void
}) {
  const [showDetail, setShowDetail] = React.useState(false)
  const [showRdvDialog, setShowRdvDialog] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  
  const statutConfig = MAURITIUS_CONFIG.statuts[prospect.statut]
  const secteurConfig = MAURITIUS_CONFIG.secteurs[prospect.secteur]
  const districtConfig = MAURITIUS_CONFIG.districts[prospect.district]
  const stars = getStars(prospect.score)
  
  const statutColors: Record<string, string> = {
    gray: "bg-gray-100 text-gray-800 border border-gray-300",
    blue: "bg-blue-100 text-blue-800 border border-blue-300",
    yellow: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    purple: "bg-purple-100 text-purple-800 border border-purple-300",
    orange: "bg-orange-100 text-orange-800 border border-orange-300",
    green: "bg-green-100 text-green-800 border border-green-300",
    red: "bg-red-100 text-red-800 border border-red-300"
  }

  return (
    <>
      <Card 
        className="transition-all hover:shadow-lg cursor-pointer relative group bg-white border-gray-200 hover:border-blue-300"
        onClick={() => setShowDetail(true)}
      >
        {prospect.priority === 'Haute' && (
          <div className="absolute -top-2 -right-2 z-10">
            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              Priorité
            </div>
          </div>
        )}
        
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
            <span className={`px-2 py-1 rounded text-xs ${
              statutColors[statutConfig?.color || 'gray'] || statutColors.gray
            }`}>
              {statutConfig?.label}
            </span>
          </div>

          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{prospect.ville}, {districtConfig?.label}</span>
            </div>
            
            {prospect.contact && (
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-gray-400">👤</span>
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
              <span className="text-yellow-500">{stars}</span>
              <span className="text-xs text-gray-600">Score: {prospect.score}/5</span>
            </div>
          </div>

          {prospect.notes && (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded text-sm text-gray-700 mb-4 line-clamp-2">
              {prospect.notes}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={(e) => {
                e.stopPropagation()
                setShowRdvDialog(true)
              }}
            >
              <Calendar className="h-4 w-4 mr-1" />
              RDV
            </Button>
            
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = `tel:${prospect.telephone}`
              }}
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
      
      <ProspectDetailModal
        prospect={prospect}
        open={showDetail}
        onClose={() => setShowDetail(false)}
        onUpdate={(updated) => {
          onUpdate(updated)
          onStatusChange(updated.statut)
        }}
        onDelete={() => {
          setShowDetail(false)
          onDelete()
        }}
      />

      <RdvDialog
        prospect={prospect}
        open={showRdvDialog}
        onClose={() => setShowRdvDialog(false)}
      />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Êtes-vous sûr ?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Cette action supprimera définitivement le prospect "{prospect.nom}". 
              Cette action ne peut pas être annulée.
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
              onClick={(e) => {
                e.stopPropagation()
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

// Modal de détails avec onglets RDV et Contrats
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
  onUpdate: (updated: Prospect) => void
  onDelete?: () => void
}) {
  const [editMode, setEditMode] = React.useState(false)
  const [form, setForm] = React.useState(prospect)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [rdvs, setRdvs] = React.useState<RDV[]>([])
  const [contrats, setContrats] = React.useState<Contrat[]>([])
  const [loadingRdvs, setLoadingRdvs] = React.useState(false)
  const [loadingContrats, setLoadingContrats] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    setForm(prospect)
    setEditMode(false)
    if (open) {
      loadRdvs()
      loadContrats()
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

  async function loadContrats() {
    setLoadingContrats(true)
    try {
      // API contrats à implémenter
      setContrats([])
    } catch (error) {
      console.error('Erreur chargement contrats:', error)
    } finally {
      setLoadingContrats(false)
    }
  }

  async function saveChanges() {
    try {
      const res = await fetch(`/api/prospects`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prospect.id, ...form })
      })
      if (!res.ok) throw new Error(await res.text())
      
      const updated = await res.json()
      onUpdate(updated)
      setEditMode(false)
      toast({
        title: "Modifications enregistrées",
        description: "Le prospect a été mis à jour avec succès."
      })
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e.message || "Impossible de sauvegarder les modifications",
        variant: "destructive"
      })
    }
  }

  const statutConfig = MAURITIUS_CONFIG.statuts[form.statut]
  const secteurConfig = MAURITIUS_CONFIG.secteurs[form.secteur]
  const districtConfig = MAURITIUS_CONFIG.districts[form.district]

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-white">
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
                      className="bg-white text-gray-700 border-gray-300"
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
                        onClick={() => setShowDeleteDialog(true)}
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="informations">Informations</TabsTrigger>
              <TabsTrigger value="rdv" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                RDV ({rdvs.length})
              </TabsTrigger>
              <TabsTrigger value="contrats" className="flex items-center gap-2">
                <FileSignature className="h-4 w-4" />
                Contrats ({contrats.length})
              </TabsTrigger>
              <TabsTrigger value="historique">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="informations" className="space-y-4 mt-4">
              {/* Contenu existant des informations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
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
                            statutConfig?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            statutConfig?.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {statutConfig?.label}
                          </Badge>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Score</label>
                     <p className="mt-1 text-yellow-500">
  {"★".repeat(Math.min(5, Math.max(1, Math.ceil((form.score || 50) / 20)))) + 
   "☆".repeat(Math.max(0, 5 - Math.min(5, Math.max(1, Math.ceil((form.score || 50) / 20)))))} 
  ({Math.min(5, Math.max(1, Math.ceil((form.score || 50) / 20)))}/5)
</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Budget</label>
                      <p className="mt-1 text-gray-900">
                        {form.budget ? `${MAURITIUS_CONFIG.labels.currency} ${form.budget}` : 'Non spécifié'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Personne de contact</label>
                      <p className="mt-1 text-gray-900">{form.contact || 'Non spécifié'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Téléphone</label>
                      <p className="mt-1 text-gray-900">{form.telephone || 'Non spécifié'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-gray-900">{form.email || 'Non spécifié'}</p>
                    </div>
                  </CardContent>
                </Card>
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
                            <div className="flex items-center gap-3">
                              <Calendar className="h-5 w-5 text-indigo-600" />
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
                              </div>
                            </div>
                            {rdv.notes && (
                              <p className="text-sm text-gray-600 mt-2 ml-8">{rdv.notes}</p>
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

            <TabsContent value="contrats" className="space-y-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Contrats</h3>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Contrat
                </Button>
              </div>

              {loadingContrats ? (
                <div className="text-center py-8">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
                </div>
              ) : contrats.length > 0 ? (
                <div className="space-y-3">
                  {/* Liste des contrats */}
                </div>
              ) : (
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-8 text-center">
                    <FileSignature className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Aucun contrat enregistré</p>
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
    </>
  )
}

// Dialog pour créer un RDV
function RdvDialog({ 
  prospect, 
  open, 
  onClose,
  onSuccess,
  children 
}: { 
  prospect: Prospect
  open?: boolean
  onClose?: () => void
  onSuccess?: () => void
  children?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    date: '',
    time: '',
    duree_min: 60,
    type_visite: 'decouverte' as RDV['type_visite'],
    priorite: 'normale' as RDV['priorite'],
    notes: '',
    lieu: `${prospect.ville}, ${prospect.district || ''}`
  })
  const { toast } = useToast()

  const actualOpen = open !== undefined ? open : isOpen
  const actualOnClose = onClose || (() => setIsOpen(false))

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
      const rdvData = {
        prospect_id: prospect.id,
        commercial: "Karine MOMUS", // À remplacer par l'utilisateur connecté
        titre: `RDV - ${prospect.nom}`,
        date_time: `${form.date}T${form.time}:00`,
        duree_min: form.duree_min,
        type_visite: form.type_visite,
        priorite: form.priorite,
        statut: 'planifie',
        notes: form.notes,
        lieu: form.lieu
      }

      const res = await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rdvData)
      })

      if (!res.ok) throw new Error(await res.text())

      toast({
        title: "RDV créé",
        description: `Rendez-vous planifié avec ${prospect.nom}`
      })

      actualOnClose()
      onSuccess?.()
    } catch (error: any) {
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
            <select
              value={form.priorite}
              onChange={(e) => setForm({...form, priorite: e.target.value as RDV['priorite']})}
              className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
            >
              <option value="normale">🔵 Normale</option>
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

        {/* Informations de qualification */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-2">Critères de qualification</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Budget confirmé : {prospect.budget || 'À définir'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Décideur identifié : {prospect.contact || 'À identifier'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Besoin qualifié : {prospect.statut === 'qualifie' ? 'Oui' : 'À qualifier'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>Score actuel : {prospect.score}/5</span>
              </div>
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

// AddProspectDialog reste identique
function AddProspectDialog({ onAdd }: { onAdd: (p: Omit<Prospect, "id">) => void }) {
  const [open, setOpen] = React.useState(false)
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
    setOpen(false)
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Prospect
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-900">Ajouter un nouveau prospect</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            onClick={() => setOpen(false)}
            className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            Annuler
          </Button>
          <Button 
            onClick={submit}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Enregistrer le prospect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
