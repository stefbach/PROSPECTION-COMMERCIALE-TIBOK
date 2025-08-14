"use client"

import * as React from "react"
import { AIDashboard } from "@/components/ai-dashboard"
import MauritiusProspectsSection from "@/components/sections/prospects-mauritius"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, Home, Users, Calendar, TrendingUp, Target,
  Menu, X, Hotel, Building2, Activity, ChevronRight
} from "lucide-react"

export default function Page() {
  const [section, setSection] = React.useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const today = new Date().toLocaleDateString("fr-FR")
  const currentCommercial = "Karine MOMUS"

  // Menu de navigation
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home },
    { id: 'prospects', label: 'Prospects Maurice', icon: Users },
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
                  <p className="text-xs text-gray-500">Île Maurice 🇲🇺</p>
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
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                  section === item.id
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                {sidebarOpen && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>
        
        {sidebarOpen && (
          <div className="p-4 text-xs text-gray-500 border-t">
            <p className="font-medium">{currentCommercial}</p>
            <p>{today}</p>
            <p className="mt-2 text-green-600">✅ Supabase connecté</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {menuItems.find(m => m.id === section)?.label}
            </h1>
            <Badge variant="outline" className="gap-1">
              ProspectMed - Téléconsultation Médicale
            </Badge>
          </div>
        </header>
        
        {/* Contenu dynamique */}
        <div className={section === 'prospects' ? '' : 'p-6'}>
          {section === 'dashboard' && <DashboardSection />}
          {section === 'prospects' && <MauritiusProspectsSection />}
          {section === 'planning' && <PlanningSection />}
          {section === 'ai' && (
            <div className="max-w-7xl mx-auto">
              <AIDashboard commercial={currentCommercial} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Dashboard Section
function DashboardSection() {
  const [stats, setStats] = React.useState({
    totalProspects: 0,
    hotels: 0,
    pharmacies: 0,
    cliniques: 0,
    nouveaux: 0,
    signes: 0
  })

  React.useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const res = await fetch('/api/prospects?limit=5000')
      if (res.ok) {
        const data = await res.json()
        const prospects = data.data || []
        
        setStats({
          totalProspects: data.pagination?.total || prospects.length,
          hotels: prospects.filter((p: any) => p.secteur === 'hotel').length,
          pharmacies: prospects.filter((p: any) => p.secteur === 'pharmacie').length,
          cliniques: prospects.filter((p: any) => p.secteur === 'clinique').length,
          nouveaux: prospects.filter((p: any) => p.statut === 'nouveau').length,
          signes: prospects.filter((p: any) => p.statut === 'signe').length
        })
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  const metrics = [
    { 
      title: 'Total Prospects', 
      value: stats.totalProspects, 
      icon: Users, 
      color: 'blue',
      description: 'Base de données complète'
    },
    { 
      title: 'Hôtels', 
      value: stats.hotels,
      icon: Hotel, 
      color: 'green',
      description: 'Cible prioritaire'
    },
    { 
      title: 'Pharmacies', 
      value: stats.pharmacies,
      icon: Building2, 
      color: 'purple',
      description: 'Fort potentiel'
    },
    { 
      title: 'Taux conversion', 
      value: '32%', 
      icon: TrendingUp, 
      color: 'orange',
      description: '+5% ce mois'
    }
  ]

  const activities = [
    { text: 'Nouveau prospect ajouté: Hôtel Paradise', time: 'Il y a 2h', icon: '🏨', type: 'success' },
    { text: 'RDV confirmé avec Pharmacie Centrale', time: 'Il y a 4h', icon: '💊', type: 'info' },
    { text: 'Contrat signé: Clinique du Nord', time: 'Hier', icon: '✅', type: 'success' },
    { text: 'Rappel: RDV demain avec Hôtel Blue Bay', time: 'Demain 10h', icon: '⏰', type: 'warning' }
  ]

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
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
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
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
              {activities.map((activity, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${
                  activity.type === 'success' ? 'bg-green-50' :
                  activity.type === 'warning' ? 'bg-yellow-50' :
                  'bg-blue-50'
                }`}>
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.text}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Objectifs du mois */}
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
                  <span className="text-sm font-bold">{stats.nouveaux}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min(100, (stats.nouveaux / 100) * 100)}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Contrats signés</span>
                  <span className="text-sm font-bold">{stats.signes}/20</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min(100, (stats.signes / 20) * 100)}%` }}
                  />
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

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              onClick={() => setSection('prospects')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Voir Prospects
            </Button>
            <Button 
              onClick={() => setSection('planning')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Planning
            </Button>
            <Button 
              onClick={() => setSection('ai')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Brain className="h-4 w-4 mr-2" />
              Assistant IA
            </Button>
            <Button 
              variant="outline"
              className="border-gray-300"
            >
              <Activity className="h-4 w-4 mr-2" />
              Rapports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Planning Section basique
function PlanningSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Planning de la semaine</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Section planning en cours de développement</p>
          <p className="text-sm mt-2">Utilisez la section Prospects pour planifier des RDV</p>
        </div>
      </CardContent>
    </Card>
  )
}
