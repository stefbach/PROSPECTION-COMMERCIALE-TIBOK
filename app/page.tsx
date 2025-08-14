"use client"

import * as React from "react"
import { AIDashboard } from "@/components/ai-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Home, Users, Calendar, TrendingUp, Target, MapPin, RefreshCw } from "lucide-react"

export default function Page() {
  const [section, setSection] = React.useState("dashboard")
  const [showAI, setShowAI] = React.useState(false)
  const [prospects, setProspects] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const today = new Date().toLocaleDateString("fr-FR")
  const currentCommercial = "Jean Dupont"

  // Charger les prospects depuis l'API
  React.useEffect(() => {
    loadProspects()
  }, [])

  async function loadProspects() {
    setLoading(true)
    try {
      const res = await fetch('/api/prospects')
      if (res.ok) {
        const data = await res.json()
        setProspects(data.data || data || [])
        console.log('Prospects chargés:', data)
      } else {
        console.error('Erreur API:', res.status)
      }
    } catch (error) {
      console.error('Erreur chargement prospects:', error)
      // Données de fallback si l'API ne fonctionne pas
      setProspects([
        { id: 1, nom: "Hôtel Paradise Beach", ville: "Grand Baie", zone: "Nord", statut: "nouveau", secteur: "hotel" },
        { id: 2, nom: "Pharmacie Centrale", ville: "Port Louis", zone: "Centre", statut: "qualifié", secteur: "pharmacie" }
      ])
    } finally {
      setLoading(false)
    }
  }

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home },
    { id: 'prospects', label: 'Prospects', icon: Users },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'ai', label: 'Assistant IA', icon: Brain }
  ]

  const sections = {
    dashboard: <DashboardSection prospects={prospects} />,
    prospects: <ProspectsSection prospects={prospects} onReload={loadProspects} loading={loading} />,
    planning: <PlanningSection />,
    ai: <AIDashboard commercial={currentCommercial} />
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
              PM
            </div>
            <div>
              <h2 className="text-lg font-bold">ProspectMed Pro</h2>
              <p className="text-xs text-gray-500">Téléconsultation</p>
            </div>
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
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        
        <div className="p-4 border-t">
          <Button 
            onClick={() => setShowAI(!showAI)}
            className={`w-full ${showAI ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            <Brain className="h-4 w-4 mr-2" />
            {showAI ? 'Masquer IA' : 'Assistant IA'}
          </Button>
        </div>
        
        <div className="p-4 text-xs text-gray-500">
          <p>{currentCommercial}</p>
          <p>{today}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {showAI ? 'Assistant IA ProspectMed' : menuItems.find(m => m.id === section)?.label}
            </h1>
            <div className="flex items-center gap-3">
              {section === 'prospects' && (
                <Button 
                  onClick={loadProspects} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              )}
              <Badge variant="outline" className="gap-1">
                Île Maurice 🇲🇺
              </Badge>
            </div>
          </div>
        </header>
        
        <div className="p-6">
          {showAI ? (
            <AIDashboard commercial={currentCommercial} />
          ) : (
            sections[section as keyof typeof sections] || <div>Section non trouvée</div>
          )}
        </div>
      </main>
    </div>
  )
}

function DashboardSection({ prospects }: { prospects: any[] }) {
  const metrics = [
    { title: 'Total Prospects', value: prospects.length.toString(), change: '+12% ce mois', icon: Users, color: 'blue' },
    { title: 'RDV cette semaine', value: '18', change: '6 confirmés', icon: Calendar, color: 'green' },
    { title: 'Taux de conversion', value: '32%', change: '+5%', icon: TrendingUp, color: 'purple' },
    { title: 'Objectif mensuel', value: '67%', change: 'Rs 134k/200k', icon: Target, color: 'orange' }
  ]

  return (
    <div className="space-y-6">
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
                <p className="text-xs text-green-600 mt-2">{metric.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statut Base de Données</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>API Prospects:</span>
              <Badge variant={prospects.length > 0 ? "success" : "destructive"}>
                {prospects.length > 0 ? 'Connectée' : 'Déconnectée'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Nombre de prospects:</span>
              <span className="font-bold">{prospects.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ProspectsSection({ prospects, onReload, loading }: { prospects: any[], onReload: () => void, loading: boolean }) {
  const getIcon = (secteur: string) => {
    switch(secteur) {
      case 'hotel': return '🏨'
      case 'pharmacie': return '💊'
      case 'clinique': return '🏥'
      default: return '🏢'
    }
  }

  if (loading) {
    return <div className="text-center py-8">Chargement des prospects...</div>
  }

  if (prospects.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <p className="text-gray-600 mb-4">Aucun prospect trouvé</p>
          <Button onClick={onReload}>Recharger</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Prospects Île Maurice</h2>
          <p className="text-gray-600">{prospects.length} prospects au total</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          + Nouveau prospect
        </Button>
      </div>

      <div className="grid gap-4">
        {prospects.map(p => (
          <Card key={p.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{getIcon(p.secteur)}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{p.nom}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{p.ville || 'Non défini'} - Zone {p.zone || p.district || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={
                    p.statut === 'nouveau' ? 'default' :
                    p.statut === 'qualifie' || p.statut === 'qualifié' ? 'secondary' :
                    'outline'
                  }>
                    {p.statut || 'nouveau'}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => alert(`Détails de ${p.nom}`)}
                  >
                    Détails
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => alert(`Contacter ${p.nom}`)}
                  >
                    Contacter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function PlanningSection() {
  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Planning Hebdomadaire</h2>
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
                <div className="p-2 bg-blue-50 rounded text-xs">
                  <p className="font-semibold">9h00 - Hôtel Paradise</p>
                  <p className="text-gray-600">Grand Baie</p>
                </div>
                <div className="p-2 bg-green-50 rounded text-xs">
                  <p className="font-semibold">14h00 - Pharmacie</p>
                  <p className="text-gray-600">Port Louis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
