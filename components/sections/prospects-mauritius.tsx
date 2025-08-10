"use client"

import * as React from "react"
import { MAURITIUS_CONFIG, type Prospect, type District, type Secteur, type Statut } from "@/lib/mauritius-config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  CalendarPlus, Phone, Plus, Search, Mail, Globe, MapPin, Building2, Eye, 
  FileText, TrendingUp, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Trash2, Edit, X, Save
} from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ImportAnalyzer } from '@/components/import-analyzer'

export default function MauritiusProspectsSection() {
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
      
      params.set('limit', '100000')
      params.set('page', '1')
      
      const res = await fetch(`/api/prospects?${params.toString()}`, { cache: 'no-store' })
      const result = await res.json()
      
      const data = result.data || result || []
      setAllProspects(Array.isArray(data) ? data : [])
      
      toast({
        title: 'Chargement complet',
        description: `${data.length} prospects chargés en mémoire`
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
      const res = await fetch(`/api/prospects/${id}`, { method: 'DELETE' })
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

  // Données filtrées (selon le mode)
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
      const res = await fetch(`/api/prospects/${id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ statut }) 
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
                className={viewMode === 'all' ? 
                  "bg-purple-600 text-white hover:bg-purple-700" : 
                  "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }
              >
                {viewMode === 'all' ? '✓ Vue complète' : 'Charger tout'}
              </Button>
            </div>

            <div className="flex gap-2">
              <ImportAnalyzer onImportComplete={() => viewMode === 'all' ? loadAllProspects() : loadProspects(pagination.page)} />
              <AddProspectDialog onAdd={addProspect} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contrôles de pagination */}
      {viewMode === 'paginated' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Page {pagination.page} sur {pagination.totalPages} • 
                  Affichage {((pagination.page - 1) * pagination.limit) + 1} à{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
                </span>
                
                <select
                  value={pagination.limit}
                  onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                  className="border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-1 text-sm"
                >
                  <option value="25">25 par page</option>
                  <option value="50">50 par page</option>
                  <option value="100">100 par page</option>
                  <option value="250">250 par page</option>
                  <option value="500">500 par page</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                  className="bg-white text-gray-700 border-gray-300"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="bg-white text-gray-700 border-gray-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex gap-1">
                  {(() => {
                    const pages = []
                    const maxVisible = 5
                    let start = Math.max(1, pagination.page - Math.floor(maxVisible / 2))
                    let end = Math.min(pagination.totalPages, start + maxVisible - 1)
                    
                    if (end - start < maxVisible - 1) {
                      start = Math.max(1, end - maxVisible + 1)
                    }
                    
                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <Button
                          key={i}
                          variant={i === pagination.page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(i)}
                          className={i === pagination.page ? 
                            "bg-blue-600 text-white hover:bg-blue-700" : 
                            "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }
                        >
                          {i}
                        </Button>
                      )
                    }
                    return pages
                  })()}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="bg-white text-gray-700 border-gray-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                  className="bg-white text-gray-700 border-gray-300"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info mode vue complète */}
      {viewMode === 'all' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Mode vue complète activé • {filtered.length} prospects affichés sans pagination
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setViewMode('paginated')
                  loadProspects(1)
                }}
                className="bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50"
              >
                Retour à la pagination
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            Chargement des prospects...
          </div>
        )}
      </div>

      {/* Pagination en bas */}
      {viewMode === 'paginated' && pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="bg-white text-gray-700 border-gray-300"
            >
              Page précédente
            </Button>
            
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {pagination.page} sur {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="bg-white text-gray-700 border-gray-300"
            >
              Page suivante
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ProspectCard avec bouton de suppression
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
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  
  const statutConfig = MAURITIUS_CONFIG.statuts[prospect.statut]
  const secteurConfig = MAURITIUS_CONFIG.secteurs[prospect.secteur]
  const districtConfig = MAURITIUS_CONFIG.districts[prospect.district]
  const stars = "★".repeat(prospect.score) + "☆".repeat(5 - prospect.score)
  
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
            
            {prospect.email && (
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="truncate">{prospect.email}</span>
              </div>
            )}
            
            {prospect.website && (
              <div className="flex items-center gap-2 text-gray-700">
                <Globe className="h-4 w-4 text-gray-400" />
                <span className="truncate">{prospect.website}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">{stars}</span>
              <span className="text-xs text-gray-600">Score: {prospect.score}/5</span>
            </div>
            
            {prospect.budget && (
              <div className="text-gray-700">
                💰 Budget: {MAURITIUS_CONFIG.labels.currency} {prospect.budget}
              </div>
            )}

            {prospect.quality_score && (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      prospect.quality_score >= 80 ? 'bg-green-500' :
                      prospect.quality_score >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${prospect.quality_score}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">{prospect.quality_score}%</span>
              </div>
            )}
          </div>

          {prospect.notes && (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded text-sm text-gray-700 mb-4 line-clamp-2">
              {prospect.notes}
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = `tel:${prospect.telephone}`
              }}
            >
              <Phone className="h-4 w-4 mr-1" />
              Appeler
            </Button>
            
            {prospect.email && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                onClick={(e) => {
                  e.stopPropagation()
                  window.location.href = `mailto:${prospect.email}`
                }}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
            )}
            
            <Button 
              size="sm" 
              variant="outline"
              className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
              onClick={(e) => {
                e.stopPropagation()
                setShowDetail(true)
              }}
            >
              <Eye className="h-4 w-4" />
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

// Modal de détails/édition amélioré pour desktop
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
  const { toast } = useToast()

  React.useEffect(() => {
    setForm(prospect)
    setEditMode(false)
  }, [prospect])

  async function saveChanges() {
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Colonne gauche - Informations principales */}
            <div className="space-y-4">
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Secteur d'activité</label>
                    {editMode ? (
                      <select
                        value={form.secteur}
                        onChange={(e) => setForm({...form, secteur: e.target.value as Secteur})}
                        className="w-full mt-1 border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
                      >
                        {Object.entries(MAURITIUS_CONFIG.secteurs).map(([key, config]) => (
                          <option key={key} value={key}>
                            {config.icon} {config.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-1 text-gray-900">
                        {secteurConfig?.icon} {secteurConfig?.label}
                      </p>
                    )}
                  </div>

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
                        <span className={`px-2 py-1 rounded text-sm ${
                          statutConfig?.color === 'gray' ? 'bg-gray-100 text-gray-800' :
                          statutConfig?.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          statutConfig?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          statutConfig?.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                          statutConfig?.color === 'green' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {statutConfig?.label}
                        </span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Score</label>
                    {editMode ? (
                      <select
                        value={form.score}
                        onChange={(e) => setForm({...form, score: Number(e.target.value) as 1|2|3|4|5})}
                        className="w-full mt-1 border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
                      >
                        <option value={5}>★★★★★ Excellent (5/5)</option>
                        <option value={4}>★★★★☆ Très bon (4/5)</option>
                        <option value={3}>★★★☆☆ Moyen (3/5)</option>
                        <option value={2}>★★☆☆☆ Faible (2/5)</option>
                        <option value={1}>★☆☆☆☆ Très faible (1/5)</option>
                      </select>
                    ) : (
                      <p className="mt-1 text-yellow-500">
                        {"★".repeat(form.score) + "☆".repeat(5 - form.score)} ({form.score}/5)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Budget</label>
                    {editMode ? (
                      <Input
                        value={form.budget || ''}
                        onChange={(e) => setForm({...form, budget: e.target.value})}
                        placeholder="Ex: Rs 100k"
                        className="mt-1 bg-white text-gray-900 border-gray-300"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">
                        {form.budget ? `${MAURITIUS_CONFIG.labels.currency} ${form.budget}` : 'Non spécifié'}
                      </p>
                    )}
                  </div>

                  {form.priority && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Priorité</label>
                      <p className="mt-1">
                        <span className={`px-2 py-1 rounded text-sm ${
                          form.priority === 'Haute' ? 'bg-red-100 text-red-800' :
                          form.priority === 'Moyenne' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {form.priority}
                        </span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Personne de contact</label>
                    {editMode ? (
                      <Input
                        value={form.contact || ''}
                        onChange={(e) => setForm({...form, contact: e.target.value})}
                        className="mt-1 bg-white text-gray-900 border-gray-300"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{form.contact || 'Non spécifié'}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Téléphone</label>
                    {editMode ? (
                      <Input
                        value={form.telephone || ''}
                        onChange={(e) => setForm({...form, telephone: e.target.value})}
                        placeholder="+230 5123 4567"
                        className="mt-1 bg-white text-gray-900 border-gray-300"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">
                        {form.telephone || 'Non spécifié'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    {editMode ? (
                      <Input
                        type="email"
                        value={form.email || ''}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        className="mt-1 bg-white text-gray-900 border-gray-300"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">
                        {form.email || 'Non spécifié'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Site web</label>
                    {editMode ? (
                      <Input
                        value={form.website || ''}
                        onChange={(e) => setForm({...form, website: e.target.value})}
                        className="mt-1 bg-white text-gray-900 border-gray-300"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">
                        {form.website ? (
                          <a href={form.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {form.website}
                          </a>
                        ) : (
                          'Non spécifié'
                        )}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Colonne droite - Localisation et Notes */}
            <div className="space-y-4">
              <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Localisation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ville</label>
                    {editMode ? (
                      <Input
                        value={form.ville}
                        onChange={(e) => setForm({...form, ville: e.target.value})}
                        className="mt-1 bg-white text-gray-900 border-gray-300"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{form.ville}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">District</label>
                    {editMode ? (
                      <select
                        value={form.district}
                        onChange={(e) => setForm({...form, district: e.target.value as District})}
                        className="w-full mt-1 border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
                      >
                        {Object.entries(MAURITIUS_CONFIG.districts).map(([key, config]) => (
                          <option key={key} value={key}>{config.label}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-1 text-gray-900">{districtConfig?.label}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Adresse complète</label>
                    {editMode ? (
                      <Textarea
                        value={form.adresse || ''}
                        onChange={(e) => setForm({...form, adresse: e.target.value})}
                        rows={3}
                        className="mt-1 bg-white text-gray-900 border-gray-300"
                      />
                    ) : (
                      <p className="mt-1 text-gray-900">{form.adresse || 'Non spécifiée'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Notes et commentaires</CardTitle>
                </CardHeader>
                <CardContent>
                  {editMode ? (
                    <Textarea
                      value={form.notes || ''}
                      onChange={(e) => setForm({...form, notes: e.target.value})}
                      rows={6}
                      placeholder="Ajoutez des notes..."
                      className="bg-white text-gray-900 border-gray-300"
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {form.notes || 'Aucune note'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {form.quality_score && (
                <Card className="bg-gray-50 border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Score de qualité</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            form.quality_score >= 80 ? 'bg-green-500' :
                            form.quality_score >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${form.quality_score}%` }}
                        />
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {form.quality_score}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Actions rapides en bas */}
          {!editMode && (
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.location.href = `tel:${prospect.telephone}`}
              >
                <Phone className="h-4 w-4 mr-2" />
                Appeler
              </Button>
              {prospect.email && (
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => window.location.href = `mailto:${prospect.email}`}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer un email
                </Button>
              )}
              {prospect.website && (
                <Button
                  variant="outline"
                  className="flex-1 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  onClick={() => window.open(prospect.website, '_blank')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Visiter le site
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              onClick={() => {
                onDelete?.()
                setShowDeleteDialog(false)
                onClose()
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

// AddProspectDialog reste identique mais avec le dialog plus grand
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
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <Input 
              placeholder="email@example.com" 
              type="email"
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-white text-gray-900 border-gray-300"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Site web</label>
            <Input 
              placeholder="https://..." 
              value={form.website} 
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="bg-white text-gray-900 border-gray-300"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Score</label>
            <select 
              className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2" 
              value={form.score} 
              onChange={(e) => setForm({ ...form, score: Number(e.target.value) as 1|2|3|4|5 })}
            >
              <option value={5}>★★★★★ Excellent (5/5)</option>
              <option value={4}>★★★★☆ Très bon (4/5)</option>
              <option value={3}>★★★☆☆ Moyen (3/5)</option>
              <option value={2}>★★☆☆☆ Faible (2/5)</option>
              <option value={1}>★☆☆☆☆ Très faible (1/5)</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Budget</label>
            <Input 
              placeholder="Rs 100k" 
              value={form.budget} 
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
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
