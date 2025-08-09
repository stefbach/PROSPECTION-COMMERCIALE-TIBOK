"use client"

import * as React from "react"
import { MAURITIUS_CONFIG, type Prospect, type District, type Secteur, type Statut } from "@/lib/mauritius-config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendarPlus, Phone, Plus, Search, Mail, Globe, MapPin, Building2 } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ImportAnalyzer } from '@/components/import-analyzer'

export default function MauritiusProspectsSection() {
  const [loading, setLoading] = React.useState(false)
  const [prospects, setProspects] = React.useState<Prospect[]>([])
  const [filters, setFilters] = React.useState({
    secteur: '',
    district: '',
    statut: '',
    search: ''
  })
  const { toast } = useToast()

  async function loadProspects() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.secteur) params.set('secteur', filters.secteur)
      if (filters.district) params.set('district', filters.district)
      if (filters.statut) params.set('statut', filters.statut)
      if (filters.search) params.set('q', filters.search)
      
      const res = await fetch(`/api/prospects?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      setProspects(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger les prospects' })
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadProspects()
  }, [])

  const filtered = React.useMemo(() => {
    return prospects.filter((p) => {
      const matchSecteur = !filters.secteur || p.secteur === filters.secteur
      const matchDistrict = !filters.district || p.district === filters.district
      const matchStatut = !filters.statut || p.statut === filters.statut
      const matchSearch = !filters.search || 
        p.nom.toLowerCase().includes(filters.search.toLowerCase()) || 
        p.ville.toLowerCase().includes(filters.search.toLowerCase())
      return matchSecteur && matchDistrict && matchStatut && matchSearch
    })
  }, [prospects, filters])

  // Statistiques
  const stats = React.useMemo(() => {
    return {
      total: filtered.length,
      nouveaux: filtered.filter(p => p.statut === 'nouveau').length,
      qualifies: filtered.filter(p => p.statut === 'qualifie').length,
      signes: filtered.filter(p => p.statut === 'signe').length,
      topDistricts: Object.entries(
        filtered.reduce((acc, p) => {
          acc[p.district] = (acc[p.district] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      ).sort(([,a], [,b]) => b - a).slice(0, 3)
    }
  }, [filtered])

  async function addProspect(p: Omit<Prospect, "id">) {
    try {
      const res = await fetch('/api/prospects', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(p) 
      })
      if (!res.ok) throw new Error(await res.text())
      const created = await res.json()
      setProspects(prev => [created, ...prev])
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
      setProspects(prev => prev.map(p => (p.id === id ? { ...p, statut } : p)))
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

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total prospects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.nouveaux}</div>
            <p className="text-xs text-muted-foreground">Nouveaux</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-600">{stats.qualifies}</div>
            <p className="text-xs text-muted-foreground">Qualifiés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{stats.signes}</div>
            <p className="text-xs text-muted-foreground">Clients signés</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtres & Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Secteur */}
            <div>
              <label className="block text-sm font-medium mb-2">Secteur d'activité</label>
              <select 
                value={filters.secteur} 
                onChange={(e) => setFilters({...filters, secteur: e.target.value})} 
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Tous les secteurs</option>
                {Object.entries(MAURITIUS_CONFIG.secteurs).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium mb-2">District</label>
              <select 
                value={filters.district} 
                onChange={(e) => setFilters({...filters, district: e.target.value})} 
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Tous les districts</option>
                {Object.entries(MAURITIUS_CONFIG.districts).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-medium mb-2">Statut</label>
              <select 
                value={filters.statut} 
                onChange={(e) => setFilters({...filters, statut: e.target.value})} 
                className="w-full border rounded-md px-3 py-2"
              >{/* Filtre Secteur */}
            <div>
              <label className="block text-sm font-medium mb-2">Secteur</label>
              <select
                value={filters.secteur} 
                onChange={(e) => setFilters({...filters, secteur: e.target.value})} 
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Tous les secteurs</option> 
                {Object.entries(MAURITIUS_CONFIG.secteurs).map(([key, config]) => ( 
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre District */}
            <div>
              <label className="block text-sm font-medium mb-2">District</label>
              <select
                value={filters.district} 
                onChange={(e) => setFilters({...filters, district: e.target.value})} 
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Tous les districts</option> 
                {Object.entries(MAURITIUS_CONFIG.districts).map(([key, config]) => ( 
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
                <option value="">Tous les statuts</option>
                {Object.entries(MAURITIUS_CONFIG.statuts).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
{/* Filtre Secteur */}
            <div>
              <label className="block text-sm font-medium mb-2">Secteur</label>
              <select
                value={filters.secteur || ''} 
                onChange={(e) => setFilters({...filters, secteur: e.target.value})} 
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Tous les secteurs</option> 
                {Object.entries(MAURITIUS_CONFIG.secteurs).map(([key, config]) => ( 
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre District */}
            <div>
              <label className="block text-sm font-medium mb-2">District</label>
              <select
                value={filters.district || ''} 
                onChange={(e) => setFilters({...filters, district: e.target.value})} 
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Tous les districts</option> 
                {Object.entries(MAURITIUS_CONFIG.districts).map(([key, config]) => ( 
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            {/* Recherche */}
                        <div>
              <label className="block text-sm font-medium mb-2">Recherche</label>
              <Input 
                value={filters.search} 
                onChange={(e) => setFilters({...filters, search: e.target.value})} 
                placeholder="Nom ou ville..." 
              />
            </div>

            {/* Actions */}
            <div>
              <label className="block text-sm font-medium mb-2">&nbsp;</label>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={loadProspects} className="flex-1">
                  <Search className="h-4 w-4 mr-1" />
                  Filtrer
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({ secteur: '', district: '', statut: '', search: '' })
                loadProspects()
              }}
            >
              Réinitialiser
            </Button>

            <div className="flex gap-2">
              <MauritiusExcelImporter onImportComplete={loadProspects} />
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
          />
        ))}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Aucun prospect ne correspond aux filtres sélectionnés.
          </div>
        )}
        {loading && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Chargement des prospects...
          </div>
        )}
      </div>
    </div>
  )
}

function ProspectCard({ 
  prospect, 
  onStatusChange 
}: { 
  prospect: Prospect
  onStatusChange: (statut: Statut) => void 
}) {
  const statutConfig = MAURITIUS_CONFIG.statuts[prospect.statut]
  const secteurConfig = MAURITIUS_CONFIG.secteurs[prospect.secteur]
  const districtConfig = MAURITIUS_CONFIG.districts[prospect.district]
  const stars = "★".repeat(prospect.score) + "☆".repeat(5 - prospect.score)
  
  const statutColors = {
    gray: "bg-gray-100 text-gray-800",
    blue: "bg-blue-100 text-blue-800",
    yellow: "bg-yellow-100 text-yellow-800",
    purple: "bg-purple-100 text-purple-800",
    orange: "bg-orange-100 text-orange-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800"
  }

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>{secteurConfig?.icon}</span>
              <span className="truncate">{prospect.nom}</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {secteurConfig?.label}
            </p>
          </div>
          <span className={`px-2 py-1 rounded text-xs ${statutColors[statutConfig.color]}`}>
            {statutConfig.label}
          </span>
        </div>

        {/* Infos */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{prospect.ville}, {districtConfig?.label}</span>
          </div>
          
          {prospect.contact && (
            <div className="flex items-center gap-2 text-gray-600">
              <span>👤</span>
              <span>{prospect.contact}</span>
            </div>
          )}
          
          {prospect.telephone && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{prospect.telephone}</span>
            </div>
          )}
          
          {prospect.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="h-4 w-4" />
              <span className="truncate">{prospect.email}</span>
            </div>
          )}
          
          {prospect.website && (
            <div className="flex items-center gap-2 text-gray-600">
              <Globe className="h-4 w-4" />
              <span className="truncate">{prospect.website}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">{stars}</span>
            <span className="text-xs text-gray-500">Score: {prospect.score}/5</span>
          </div>
          
          {prospect.budget && (
            <div className="text-gray-600">
              💰 Budget: {MAURITIUS_CONFIG.labels.currency} {prospect.budget}
            </div>
          )}
        </div>

        {/* Notes */}
        {prospect.notes && (
          <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mb-4">
            {prospect.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => window.location.href = `tel:${prospect.telephone}`}
          >
            <Phone className="h-4 w-4 mr-1" />
            Appeler
          </Button>
          
          {prospect.email && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => window.location.href = `mailto:${prospect.email}`}
            >
              <Mail className="h-4 w-4 mr-1" />
              Email
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              const nextStatus = prospect.statut === 'nouveau' ? 'contacte' :
                               prospect.statut === 'contacte' ? 'qualifie' :
                               prospect.statut === 'qualifie' ? 'en-negociation' :
                               prospect.statut === 'en-negociation' ? 'signe' : 'signe'
              onStatusChange(nextStatus as Statut)
            }}
          >
            <CalendarPlus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Prospect
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau prospect</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input 
            placeholder="Nom de l'entreprise *" 
            value={form.nom} 
            onChange={(e) => setForm({ ...form, nom: e.target.value })} 
          />
          
          <select 
            className="border rounded-md px-3 py-2" 
            value={form.secteur} 
            onChange={(e) => setForm({ ...form, secteur: e.target.value as Secteur })}
          >
            {Object.entries(MAURITIUS_CONFIG.secteurs).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
          
          <Input 
            placeholder="Ville *" 
            value={form.ville} 
            onChange={(e) => setForm({ ...form, ville: e.target.value })} 
          />
          
          <select 
            className="border rounded-md px-3 py-2" 
            value={form.district} 
            onChange={(e) => setForm({ ...form, district: e.target.value as District })}
          >
            {Object.entries(MAURITIUS_CONFIG.districts).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
          
          <Input 
            placeholder="Personne de contact" 
            value={form.contact} 
            onChange={(e) => setForm({ ...form, contact: e.target.value })} 
          />
          
          <Input 
            placeholder="Téléphone (ex: +230 5123 4567)" 
            value={form.telephone} 
            onChange={(e) => setForm({ ...form, telephone: e.target.value })} 
          />
          
          <Input 
            placeholder="Email" 
            type="email"
            value={form.email} 
            onChange={(e) => setForm({ ...form, email: e.target.value })} 
          />
          
          <Input 
            placeholder="Site web" 
            value={form.website} 
            onChange={(e) => setForm({ ...form, website: e.target.value })} 
          />
          
          <select 
            className="border rounded-md px-3 py-2" 
            value={form.score} 
            onChange={(e) => setForm({ ...form, score: Number(e.target.value) as 1|2|3|4|5 })}
          >
            <option value={5}>★★★★★ Score excellent (5/5)</option>
            <option value={4}>★★★★☆ Très bon (4/5)</option>
            <option value={3}>★★★☆☆ Moyen (3/5)</option>
            <option value={2}>★★☆☆☆ Faible (2/5)</option>
            <option value={1}>★☆☆☆☆ Très faible (1/5)</option>
          </select>
          
          <Input 
            placeholder="Budget (ex: Rs 100k)" 
            value={form.budget} 
            onChange={(e) => setForm({ ...form, budget: e.target.value })} 
          />
          
          <Input 
            className="sm:col-span-2" 
            placeholder="Adresse complète" 
            value={form.adresse} 
            onChange={(e) => setForm({ ...form, adresse: e.target.value })} 
          />
          
          <Textarea 
            className="sm:col-span-2" 
            placeholder="Notes et commentaires..." 
            value={form.notes} 
            onChange={(e) => setForm({ ...form, notes: e.target.value })} 
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={submit}>
            Enregistrer le prospect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
