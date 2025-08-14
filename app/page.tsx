"use client"

import * as React from "react"
import { AIDashboard } from "@/components/ai-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, Home, Users, Calendar, TrendingUp, Target, MapPin, 
  RefreshCw, Search, Hotel, Building2, Activity, DollarSign,
  ChevronLeft, ChevronRight, Menu, X, Phone, Mail, Plus
} from "lucide-react"

export default function Page() {
  // États principaux
  const [section, setSection] = React.useState("dashboard")
  const [showAI, setShowAI] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  
  // États pour les prospects
  const [prospects, setProspects] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(0)
  const [totalProspects, setTotalProspects] = React.useState(0)
  const [search, setSearch] = React.useState("")
  
  const limit = 50
  const today = new Date().toLocaleDateString("fr-FR")
  const currentCommercial = "Jean Dupont"

  // Charger les prospects au démarrage
  React.useEffect(() => {
    loadProspects(1)
  }, [])

  // Fonction pour charger les prospects depuis Supabase
  async function loadProspects(pageNum: number, searchTerm: string = "") {
    setLoading(true)
    setError("")
    try {
      const url = `/api/prospects?page=${pageNum}&limit=${limit}${searchTerm ? `&search=${searchTerm}` : ''}`
      const res = await fetch(url)
      
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      
      const data = await res.json()
      setProspects(data.data || [])
      setPage(pageNum)
      
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1)
        setTotalProspects(data.pagination.total || 0)
      }
    } catch (err: any) {
      console.error('Erreur:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Recherche
  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadProspects(1, search)
  }

  // Menu de navigation
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home },
    { id: 'prospects', label: 'Prospects', icon: Users, count: totalProspects },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'ai', label: 'Assistant IA', icon: Brain }
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all bg-white shadow-lg`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${!sidebarOpen && 'justify-center'}`}>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                PM
              </div>
              {sidebarOpen && (
                <div>
                  <h2 className="text-lg font-bold">ProspectMed Pro</h2>
                  <p className="text-xs text-gray-500">Téléconsultation 🇲🇺</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSection(item.id)
                  setShowAI(false)
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  section === item.id && !showAI
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                {sidebarOpen && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
                {sidebarOpen && item.count && (
                  <Badge variant="outline" className="text-xs">
                    {item.count}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
        
        <div className="p-4 border-t">
          <Button 
            onClick={() => setShowAI(!showAI)}
            className={`w-full ${showAI ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            <Brain className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">{showAI ? 'Masquer IA' : 'Assistant IA'}</span>}
          </Button>
        </div>
        
        {sidebarOpen && (
          <div className="p-4 text-xs text-gray-500 border-t">
            <p className="font-medium">{currentCommercial}</p>
            <p>{today}</p>
            <p className="mt-2 text-green-600">✅ Supabase connecté</p>
            <p>📊 {totalProspects} prospects</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {showAI ? 'Assistant IA ProspectMed' : menuItems.find(m => m.id === section)?.label}
              </h1>
              {section === 'prospects' && (
                <p className="text-sm text-gray-600 mt-1">
                  Base de données : {totalProspects} prospects • Page {page}/{totalPages}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {section === 'prospects' && (
                <>
                  <Button 
                    onClick={() => loadProspects(page)} 
                    variant="outline" 
                    size="sm"
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau prospect
                  </Button>
                </>
              )}
              <Badge variant="outline" className="gap-1">
                Île Maurice 🇲🇺
              </Badge>
            </div>
          </div>
        </header>
        
        {/* Contenu principal */}
        <div className="p-6">
          {showAI ? (
            <AIDashboard commercial={currentCommercial} />
          ) : (
            <>
              {section === 'dashboard' && <DashboardSection prospects={prospects} />}
              {section === 'prospects' && (
                <ProspectsSection 
                  prospects={prospects}
                  loading={loading}
                  error={error}
                  page={page}
                  totalPages={totalPages}
                  search={search}
                  setSearch={setSearch}
                  onSearch={handleSearch}
                  onPageChange={loadProspects}
                />
              )}
              {section === 'planning' && <PlanningSection prospects={prospects} />}
              {section === 'ai' && <AIDashboard commercial={currentCommercial} />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// Section Dashboard
function DashboardSection({ prospects }: { prospects: any[] }) {
  const hotels = prospects.filter(p => p.secteur === 'hotel').length
  const pharmacies = prospects.filter(p => p.secteur === 'pharmacie').length
  const cliniques = prospects.filter(p => p.secteur === 'clinique').length
  
  const metrics = [
    { 
      title: 'Total Prospects', 
      value: prospects.length.toString(), 
      change: '+12% ce mois', 
      icon: Users, 
      color: 'blue' 
    },
    { 
      title: 'Hôtels', 
      value: hotels.toString(), 
      change: 'Cible prioritaire', 
      icon: Hotel, 
      color: 'green' 
    },
    { 
      title: 'Pharmacies', 
      value: pharmacies.toString(), 
      change: 'Fort potentiel', 
      icon: Building2, 
      color: 'purple' 
    },
    { 
      title: 'Taux conversion', 
      value: '32%', 
      change: '+5% ce mois', 
      icon: TrendingUp, 
      color: 'orange' 
    }
  ]

  const recentActivity = [
    { type: 'new', text: 'Nouveau prospect: Hôtel Belle Mare', time: '2h', icon: '🏨' },
    { type: 'rdv', text: 'RDV confirmé: Pharmacie Port Louis', time: '4h', icon: '💊' },
    { type: 'signed', text: 'Contrat signé: Clinique du Nord', time: '6h', icon: '✅' },
    { type: 'contact', text: 'À recontacter: Hôtel Flic en Flac', time: '1j', icon: '📞' }
  ]

  return (
    <div className="space-y-6">
      {/* Métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => {
          const Icon = metric.icon
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <Icon className={`h-5 w-5 text-${metric.color}-500`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-2">{metric.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.text}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Objectifs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objectifs du mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Nouveaux prospects</span>
                  <span className="text-sm font-bold">75/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Conversions</span>
                  <span className="text-sm font-bold">12/20</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Revenu mensuel</span>
                  <span className="text-sm font-bold">Rs 134k/200k</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '67%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Section Prospects
function ProspectsSection({ 
  prospects, loading, error, page, totalPages, 
  search, setSearch, onSearch, onPageChange 
}: any) {
  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={onSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, ville, secteur..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <Button type="submit" disabled={loading}>
              Rechercher
            </Button>
            {search && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setSearch("")
                  onPageChange(1, "")
                }}
              >
                Effacer
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Stats par secteur */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hôtels</p>
                <p className="text-2xl font-bold">
                  {prospects.filter((p: any) => p.secteur === 'hotel').length}
                </p>
              </div>
              <span className="text-3xl">🏨</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pharmacies</p>
                <p className="text-2xl font-bold">
                  {prospects.filter((p: any) => p.secteur === 'pharmacie').length}
                </p>
              </div>
              <span className="text-3xl">💊</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cliniques</p>
                <p className="text-2xl font-bold">
                  {prospects.filter((p: any) => p.secteur === 'clinique').length}
                </p>
              </div>
              <span className="text-3xl">🏥</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Autres</p>
                <p className="text-2xl font-bold">
                  {prospects.filter((p: any) => !['hotel', 'pharmacie', 'clinique'].includes(p.secteur)).length}
                </p>
              </div>
              <span className="text-3xl">🏢</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des prospects */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2">Chargement...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-red-600">Erreur : {error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {prospects.map((p: any) => (
            <Card key={p.id} className="hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">
                      {p.secteur === 'hotel' ? '🏨' : 
                       p.secteur === 'pharmacie' ? '💊' : 
                       p.secteur === 'clinique' ? '🏥' : '🏢'}
                    </span>
                    <div>
                      <h3 className="font-semibold text-lg">{p.nom}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {p.ville} • {p.district}
                        </span>
                        {p.telephone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {p.telephone}
                          </span>
                        )}
                        {p.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {p.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      p.statut === 'nouveau' ? 'default' :
                      p.statut === 'qualifie' ? 'secondary' :
                      p.statut === 'proposition' ? 'outline' :
                      'default'
                    }>
                      {p.statut || 'nouveau'}
                    </Badge>
                    <Button size="sm" variant="outline">Détails</Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Contacter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-center items-center gap-2">
            <Button
              onClick={() => onPageChange(1)}
              disabled={page === 1 || loading}
              variant="outline"
              size="sm"
            >
              Début
            </Button>
            <Button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="px-4 py-2 text-sm">
              Page {page} sur {totalPages}
            </span>
            
            <Button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || loading}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onPageChange(totalPages)}
              disabled={page === totalPages || loading}
              variant="outline"
              size="sm"
            >
              Fin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Section Planning
function PlanningSection({ prospects }: { prospects: any[] }) {
  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
  
  // Créer un planning fictif basé sur les vrais prospects
  const planning = {
    'Lundi': prospects.slice(0, 3).map(p => ({
      heure: '9h00',
      nom: p.nom,
      ville: p.ville,
      type: p.secteur
    })),
    'Mardi': prospects.slice(3, 6).map(p => ({
      heure: '10h00',
      nom: p.nom,
      ville: p.ville,
      type: p.secteur
    })),
    'Mercredi': prospects.slice(6, 9).map(p => ({
      heure: '14h00',
      nom: p.nom,
      ville: p.ville,
      type: p.secteur
    })),
    'Jeudi': prospects.slice(9, 12).map(p => ({
      heure: '11h00',
      nom: p.nom,
      ville: p.ville,
      type: p.secteur
    })),
    'Vendredi': prospects.slice(12, 15).map(p => ({
      heure: '15h00',
      nom: p.nom,
      ville: p.ville,
      type: p.secteur
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Planning Hebdomadaire</h2>
          <p className="text-gray-600">Optimisé par zones géographiques</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Brain className="h-4 w-4 mr-2" />
          Optimiser avec IA
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {jours.map(jour => (
          <Card key={jour}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{jour}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {planning[jour as keyof typeof planning]?.length > 0 ? (
                  planning[jour as keyof typeof planning].map((rdv, i) => (
                    <div key={i} className="p-2 bg-blue-50 rounded text-xs">
                      <p className="font-semibold">{rdv.heure}</p>
                      <p className="font-medium truncate">{rdv.nom}</p>
                      <p className="text-gray-600">{rdv.ville}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">
                    Aucun RDV
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statistiques de la semaine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total RDV</p>
              <p className="text-2xl font-bold">15</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Confirmés</p>
              <p className="text-2xl font-bold text-green-600">12</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-orange-600">3</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Taux confirmation</p>
              <p className="text-2xl font-bold">80%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
