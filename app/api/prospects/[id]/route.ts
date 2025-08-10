"use client"

import * as React from "react"
import type { Prospect } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { 
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  CalendarDays,
  FileText,
  Star,
  TrendingUp,
  Building,
  User,
  Timer,
  ArrowUpDown,
  Grid,
  List
} from 'lucide-react'

interface RDV {
  id: number
  prospect_id: number
  titre: string
  commercial: string
  date_time: string
  type_visite: string
  priorite: 'normale' | 'haute' | 'urgente'
  duree_min: number
  notes: string
  statut?: 'planifie' | 'confirme' | 'en-cours' | 'termine' | 'annule'
  prospect?: Prospect
}

export default function RdvSection() {
  const [prospects, setProspects] = React.useState<Prospect[]>([])
  const [rdvs, setRdvs] = React.useState<RDV[]>([])
  const [filteredRdvs, setFilteredRdvs] = React.useState<RDV[]>([])
  
  // États pour le formulaire
  const [prospectId, setProspectId] = React.useState<number | "">("")
  const [date, setDate] = React.useState("")
  const [time, setTime] = React.useState("")
  const [commercial, setCommercial] = React.useState("")
  const [typeVisite, setTypeVisite] = React.useState("decouverte")
  const [priorite, setPriorite] = React.useState<"normale" | "haute" | "urgente">("normale")
  const [duree, setDuree] = React.useState("60")
  const [notes, setNotes] = React.useState("")
  
  // États pour la recherche et filtres
  const [searchTerm, setSearchTerm] = React.useState("")
  const [filterCommercial, setFilterCommercial] = React.useState("all")
  const [filterPriorite, setFilterPriorite] = React.useState("all")
  const [filterStatut, setFilterStatut] = React.useState("all")
  const [filterDate, setFilterDate] = React.useState("all")
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list')
  const [selectedRdv, setSelectedRdv] = React.useState<RDV | null>(null)
  const [showDetails, setShowDetails] = React.useState(false)
  const [showEditDialog, setShowEditDialog] = React.useState(false)
  
  const { toast } = useToast()
  const todayIso = new Date().toISOString().split("T")[0]

  // Chargement des données
  async function loadProspects() {
    const data = await fetch('/api/prospects', { cache: 'no-store' }).then(r => r.json()).catch(() => [])
    setProspects(Array.isArray(data) ? data : [])
  }
  
  async function loadRdvs() {
    const data = await fetch('/api/rdv', { cache: 'no-store' }).then(r => r.json()).catch(() => [])
    // Enrichir les RDV avec les données des prospects
    const enrichedRdvs = data.map((rdv: RDV) => ({
      ...rdv,
      prospect: prospects.find(p => p.id === rdv.prospect_id)
    }))
    setRdvs(Array.isArray(enrichedRdvs) ? enrichedRdvs : [])
    setFilteredRdvs(Array.isArray(enrichedRdvs) ? enrichedRdvs : [])
  }
  
  React.useEffect(() => {
    loadProspects()
    loadRdvs()
  }, [])

  // Filtrage des RDV
  React.useEffect(() => {
    let filtered = [...rdvs]
    
    // Recherche textuelle
    if (searchTerm) {
      filtered = filtered.filter(rdv => 
        rdv.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rdv.commercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rdv.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rdv.prospect?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Filtre par commercial
    if (filterCommercial !== 'all') {
      filtered = filtered.filter(rdv => rdv.commercial === filterCommercial)
    }
    
    // Filtre par priorité
    if (filterPriorite !== 'all') {
      filtered = filtered.filter(rdv => rdv.priorite === filterPriorite)
    }
    
    // Filtre par statut
    if (filterStatut !== 'all') {
      filtered = filtered.filter(rdv => rdv.statut === filterStatut)
    }
    
    // Filtre par date
    if (filterDate !== 'all') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      filtered = filtered.filter(rdv => {
        const rdvDate = new Date(rdv.date_time)
        rdvDate.setHours(0, 0, 0, 0)
        
        switch(filterDate) {
          case 'today':
            return rdvDate.getTime() === today.getTime()
          case 'week':
            const weekFromNow = new Date(today)
            weekFromNow.setDate(weekFromNow.getDate() + 7)
            return rdvDate >= today && rdvDate <= weekFromNow
          case 'month':
            const monthFromNow = new Date(today)
            monthFromNow.setMonth(monthFromNow.getMonth() + 1)
            return rdvDate >= today && rdvDate <= monthFromNow
          case 'past':
            return rdvDate < today
          default:
            return true
        }
      })
    }
    
    // Tri par date
    filtered.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
    
    setFilteredRdvs(filtered)
  }, [rdvs, searchTerm, filterCommercial, filterPriorite, filterStatut, filterDate])

  // Soumission du formulaire
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!prospectId || !date || !time || !commercial) return
    const p = prospects.find(x => x.id === prospectId)
    try {
      const body = {
        prospect_id: typeof prospectId === 'number' ? prospectId : null,
        titre: p ? p.nom : 'Nouveau RDV',
        commercial,
        date_time: new Date(`${date}T${time}:00Z`).toISOString(),
        type_visite: typeVisite,
        priorite,
        duree_min: Number(duree) || 60,
        notes: notes || 'RDV nouvellement créé',
        statut: 'planifie'
      }
      const res = await fetch('/api/rdv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(await res.text())
      await loadRdvs()
      toast({ title: '✅ RDV planifié', description: body.titre })
      resetForm()
    } catch (e: any) {
      toast({ title: 'Erreur RDV', description: e.message })
    }
  }

  function resetForm() {
    setProspectId("")
    setDate("")
    setTime("")
    setCommercial("")
    setTypeVisite("decouverte")
    setPriorite("normale")
    setDuree("60")
    setNotes("")
  }

  // Statistiques
  const stats = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return {
      total: rdvs.length,
      aujourdhui: rdvs.filter(r => {
        const d = new Date(r.date_time)
        d.setHours(0, 0, 0, 0)
        return d.getTime() === today.getTime()
      }).length,
      semaine: rdvs.filter(r => {
        const d = new Date(r.date_time)
        const weekFromNow = new Date(today)
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        return d >= today && d <= weekFromNow
      }).length,
      urgents: rdvs.filter(r => r.priorite === 'urgente').length,
      confirmes: rdvs.filter(r => r.statut === 'confirme').length
    }
  }, [rdvs])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Gestion des Rendez-Vous</h2>
          <p className="text-gray-600">Planification intelligente et suivi des visites commerciales</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Nouveau RDV
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Planifier un nouveau rendez-vous</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Prospect *</label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={prospectId}
                  onChange={(e) => setProspectId(e.target.value ? Number(e.target.value) : "")}
                  required
                >
                  <option value="">Sélectionner un prospect</option>
                  {prospects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom} - {p.ville} ({p.statut})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date *</label>
                  <Input type="date" min={todayIso} value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Heure *</label>
                  <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Commercial Assigné *</label>
                <select className="w-full border rounded-md px-3 py-2" value={commercial} onChange={(e) => setCommercial(e.target.value)} required>
                  <option value="">Sélectionner un commercial</option>
                  <option value="M. Dupont">M. Dupont - Région Paris</option>
                  <option value="Mme Martin">Mme Martin - Région Lyon</option>
                  <option value="M. Bernard">M. Bernard - Région PACA</option>
                  <option value="Mme Roux">Mme Roux - Région Grand Est</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type de Visite</label>
                  <select className="w-full border rounded-md px-3 py-2" value={typeVisite} onChange={(e) => setTypeVisite(e.target.value)}>
                    <option value="decouverte">🔍 Découverte</option>
                    <option value="presentation">📊 Présentation</option>
                    <option value="negociation">💼 Négociation</option>
                    <option value="signature">✍️ Signature</option>
                    <option value="suivi">📞 Suivi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Priorité</label>
                  <select className="w-full border rounded-md px-3 py-2" value={priorite} onChange={(e) => setPriorite(e.target.value as any)}>
                    <option value="normale">🟢 Normale</option>
                    <option value="haute">🟡 Haute</option>
                    <option value="urgente">🔴 Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Durée</label>
                  <select className="w-full border rounded-md px-3 py-2" value={duree} onChange={(e) => setDuree(e.target.value)}>
                    <option value="30">30 minutes</option>
                    <option value="60">1 heure</option>
                    <option value="90">1h30</option>
                    <option value="120">2 heures</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes & Objectifs</label>
                <Textarea 
                  rows={4} 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Objectifs de la visite, points à aborder, préparation nécessaire..." 
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit">
                  Planifier le RDV
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total RDV</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                <p className="text-2xl font-bold">{stats.aujourdhui}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cette semaine</p>
                <p className="text-2xl font-bold">{stats.semaine}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgents</p>
                <p className="text-2xl font-bold">{stats.urgents}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmés</p>
                <p className="text-2xl font-bold">{stats.confirmes}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher par nom, commercial, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="past">Passés</option>
              </select>
              
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={filterCommercial}
                onChange={(e) => setFilterCommercial(e.target.value)}
              >
                <option value="all">Tous les commerciaux</option>
                <option value="M. Dupont">M. Dupont</option>
                <option value="Mme Martin">Mme Martin</option>
                <option value="M. Bernard">M. Bernard</option>
                <option value="Mme Roux">Mme Roux</option>
              </select>
              
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={filterPriorite}
                onChange={(e) => setFilterPriorite(e.target.value)}
              >
                <option value="all">Toutes priorités</option>
                <option value="urgente">Urgente</option>
                <option value="haute">Haute</option>
                <option value="normale">Normale</option>
              </select>
              
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
              >
                <option value="all">Tous statuts</option>
                <option value="planifie">Planifié</option>
                <option value="confirme">Confirmé</option>
                <option value="en-cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
              
              <div className="flex gap-1 border rounded-md">
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {filteredRdvs.length !== rdvs.length && (
            <Alert className="mt-4">
              <AlertDescription>
                {filteredRdvs.length} résultat(s) sur {rdvs.length} rendez-vous
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Liste des RDV */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
        {filteredRdvs.map((rdv) => (
          <RdvCard 
            key={rdv.id} 
            rdv={rdv} 
            viewMode={viewMode}
            onViewDetails={(rdv) => {
              setSelectedRdv(rdv)
              setShowDetails(true)
            }}
            onEdit={(rdv) => {
              setSelectedRdv(rdv)
              setShowEditDialog(true)
            }}
          />
        ))}
        
        {filteredRdvs.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterCommercial !== 'all' || filterPriorite !== 'all' || filterStatut !== 'all' || filterDate !== 'all'
                  ? "Aucun rendez-vous ne correspond à vos critères"
                  : "Aucun rendez-vous planifié pour le moment"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog détails RDV */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails du Rendez-Vous</DialogTitle>
          </DialogHeader>
          {selectedRdv && <RdvDetails rdv={selectedRdv} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant Carte RDV
function RdvCard({ 
  rdv, 
  viewMode, 
  onViewDetails, 
  onEdit 
}: { 
  rdv: RDV
  viewMode: 'list' | 'grid'
  onViewDetails: (rdv: RDV) => void
  onEdit: (rdv: RDV) => void
}) {
  const priorityColor = {
    urgente: 'border-red-500 bg-red-50',
    haute: 'border-yellow-500 bg-yellow-50',
    normale: 'border-green-500 bg-green-50'
  }[rdv.priorite]
  
  const typeIcon = {
    decouverte: '🔍',
    presentation: '📊',
    negociation: '💼',
    signature: '✍️',
    suivi: '📞'
  }[rdv.type_visite] || '📅'
  
  const statutBadge = {
    planifie: { color: 'secondary', label: 'Planifié' },
    confirme: { color: 'default', label: 'Confirmé' },
    'en-cours': { color: 'warning', label: 'En cours' },
    termine: { color: 'success', label: 'Terminé' },
    annule: { color: 'destructive', label: 'Annulé' }
  }[rdv.statut || 'planifie']
  
  const dateTime = new Date(rdv.date_time)
  const dateStr = dateTime.toLocaleDateString('fr-FR', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  })
  const timeStr = dateTime.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  
  // Vérifier si le RDV est passé
  const isPast = dateTime < new Date()
  
  if (viewMode === 'grid') {
    return (
      <Card className={`border-l-4 ${priorityColor} hover:shadow-lg transition-shadow`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{typeIcon}</span>
              <div>
                <h4 className="font-semibold">{rdv.titre}</h4>
                <p className="text-sm text-muted-foreground">{rdv.prospect?.secteur || 'Prospect'}</p>
              </div>
            </div>
            <Badge variant={statutBadge.color as any}>
              {statutBadge.label}
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className={isPast ? 'text-muted-foreground line-through' : ''}>
                {dateStr} à {timeStr}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{rdv.commercial}</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span>{rdv.duree_min} min</span>
            </div>
            {rdv.prospect && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{rdv.prospect.ville}</span>
              </div>
            )}
          </div>
          
          {rdv.notes && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 line-clamp-2">
              {rdv.notes}
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => onViewDetails(rdv)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Détails
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => onEdit(rdv)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Vue liste
  return (
    <Card className={`border-l-4 ${priorityColor} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="text-center">
              <span className="text-2xl">{typeIcon}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {rdv.type_visite}
              </p>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{rdv.titre}</h4>
                <Badge variant={statutBadge.color as any} className="text-xs">
                  {statutBadge.label}
                </Badge>
                <Badge variant={
                  rdv.priorite === 'urgente' ? 'destructive' : 
                  rdv.priorite === 'haute' ? 'warning' : 
                  'secondary'
                } className="text-xs">
                  {rdv.priorite}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {dateStr} à {timeStr}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {rdv.commercial}
                </span>
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {rdv.duree_min} min
                </span>
                {rdv.prospect && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {rdv.prospect.ville}
                  </span>
                )}
              </div>
              
              {rdv.notes && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                  {rdv.notes}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onViewDetails(rdv)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onEdit(rdv)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Composant Détails RDV
function RdvDetails({ rdv }: { rdv: RDV }) {
  const dateTime = new Date(rdv.date_time)
  
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            {rdv.titre}
            <Badge variant={
              rdv.priorite === 'urgente' ? 'destructive' : 
              rdv.priorite === 'haute' ? 'warning' : 
              'secondary'
            }>
              {rdv.priorite}
            </Badge>
          </h3>
          <p className="text-muted-foreground">
            Type: {rdv.type_visite} • Durée: {rdv.duree_min} minutes
          </p>
        </div>
        <Badge variant="outline" className="text-base px-3 py-1">
          {rdv.statut || 'planifie'}
        </Badge>
      </div>
      
      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Informations RDV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{dateTime.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{dateTime.toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })} - {new Date(dateTime.getTime() + rdv.duree_min * 60000).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</span>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{rdv.commercial}</span>
            </div>
          </CardContent>
        </Card>
        
        {rdv.prospect && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Informations Prospect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{rdv.prospect.nom}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{rdv.prospect.adresse}, {rdv.prospect.ville}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{rdv.prospect.telephone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{rdv.prospect.email}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Notes et objectifs */}
      {rdv.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Notes & Objectifs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{rdv.notes}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline">
          <Phone className="h-4 w-4 mr-2" />
          Appeler
        </Button>
        <Button variant="outline">
          <Mail className="h-4 w-4 mr-2" />
          Envoyer email
        </Button>
        <Button>
          <ChevronRight className="h-4 w-4 mr-2" />
          Voir fiche complète
        </Button>
      </div>
    </div>
  )
}
