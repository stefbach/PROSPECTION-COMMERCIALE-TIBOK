"use client"

import * as React from "react"

export default function Page() {
  const [section, setSection] = React.useState("dashboard")
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
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <header className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">ProspectMed Pro</h1>
            <span className="text-sm text-gray-600">{currentCommercial} • {today}</span>
          </div>
        </header>
        {sections[section as keyof typeof sections] || <div>Section non trouvée</div>}
      </main>
    </div>
  )
}

function DashboardSection() {
  const metrics = [
    { title: 'Total Prospects', value: '254' },
    { title: 'RDV cette semaine', value: '18' },
    { title: 'Taux de conversion', value: '32%' },
    { title: 'Objectif mensuel', value: '67%' }
  ]

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Tableau de bord</h2>
      <div className="grid grid-cols-4 gap-4">
        {metrics && metrics.map((metric, i) => (
          <div key={i} className="p-4 border rounded">
            <p className="text-sm text-gray-600">{metric.title}</p>
            <p className="text-2xl font-bold">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProspectsSection() {
  const prospects = [
    { id: 1, nom: "Hôtel Paradise", ville: "Grand Baie" },
    { id: 2, nom: "Pharmacie Centrale", ville: "Port Louis" }
  ]

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Prospects Maurice</h2>
      <div className="space-y-2">
        {prospects && prospects.map(p => (
          <div key={p.id} className="p-4 border rounded">
            {p.nom} - {p.ville}
          </div>
        ))}
      </div>
    </div>
  )
}

function PlanningSection() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Planning</h2>
      <p>Planning hebdomadaire</p>
    </div>
  )
}

function AISection({ commercial }: { commercial: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Assistant IA</h2>
      <p>Bienvenue {commercial}</p>
    </div>
  )
}
