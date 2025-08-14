"use client"

import * as React from "react"
import { AIDashboard } from "@/components/ai-dashboard"

export default function Page() {
  const [section, setSection] = React.useState("dashboard")
  const [showAI, setShowAI] = React.useState(false)
  const today = new Date().toLocaleDateString("fr-FR")
  const currentCommercial = "Jean Dupont"

  const sections = {
    dashboard: <DashboardSection />,
    prospects: <ProspectsSection />,
    planning: <PlanningSection />,
    ai: <AISection commercial={currentCommercial} />
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar simple */}
      <aside className="w-64 bg-gray-100 p-4">
        <h2 className="text-xl font-bold mb-4">ProspectMed Pro</h2>
        <nav className="space-y-2">
          {["dashboard", "prospects", "planning", "ai"].map(key => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`w-full text-left p-2 rounded ${section === key ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </nav>
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={() => setShowAI(!showAI)}
            className="w-full p-2 bg-indigo-500 text-white rounded"
          >
            {showAI ? 'Masquer' : 'Afficher'} Assistant IA
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <header className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">ProspectMed Pro</h1>
            <span className="text-sm text-gray-600">{currentCommercial} • {today}</span>
          </div>
        </header>
        
        {showAI ? (
          <AIDashboard commercial={currentCommercial} />
        ) : (
          sections[section as keyof typeof sections] || <div>Section non trouvée</div>
        )}
      </main>
    </div>
  )
}

function DashboardSection() {
  const metrics = [
    { title: 'Total Prospects', value: '254', change: '+12% ce mois' },
    { title: 'RDV cette semaine', value: '18', change: '6 confirmés' },
    { title: 'Taux de conversion', value: '32%', change: '+5%' },
    { title: 'Objectif mensuel', value: '67%', change: 'Rs 134k/200k' }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Tableau de bord</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics && metrics.map((metric, i) => (
          <div key={i} className="p-4 bg-white border rounded-lg shadow">
            <p className="text-sm text-gray-600">{metric.title}</p>
            <p className="text-2xl font-bold mt-1">{metric.value}</p>
            <p className="text-xs text-green-600 mt-2">{metric.change}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProspectsSection() {
  const prospects = [
    { id: 1, nom: "Hôtel Paradise Beach", ville: "Grand Baie", zone: "Nord", statut: "nouveau" },
    { id: 2, nom: "Pharmacie Centrale", ville: "Port Louis", zone: "Centre", statut: "qualifié" },
    { id: 3, nom: "Hôtel Flic en Flac", ville: "Flic en Flac", zone: "Ouest", statut: "nouveau" },
    { id: 4, nom: "Clinique du Nord", ville: "Pereybère", zone: "Nord", statut: "proposition" }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Prospects Île Maurice</h2>
      <div className="space-y-3">
        {prospects && prospects.map(p => (
          <div key={p.id} className="p-4 bg-white border rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{p.nom}</h3>
                <p className="text-sm text-gray-600">{p.ville} - Zone {p.zone}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  p.statut === 'nouveau' ? 'bg-blue-100 text-blue-700' :
                  p.statut === 'qualifié' ? 'bg-green-100 text-green-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {p.statut}
                </span>
                <button className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600">
                  Voir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlanningSection() {
  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Planning Hebdomadaire</h2>
      <div className="grid grid-cols-5 gap-4">
        {jours && jours.map(jour => (
          <div key={jour} className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-3">{jour}</h3>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-blue-50 rounded">
                <p className="font-medium">9h00</p>
                <p className="text-xs text-gray-600">RDV Client</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AISection({ commercial }: { commercial: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Assistant IA</h2>
      <p className="text-gray-600">Bienvenue {commercial}</p>
      <p className="mt-4">Cliquez sur "Afficher Assistant IA" dans la sidebar pour accéder au dashboard complet.</p>
    </div>
  )
}
