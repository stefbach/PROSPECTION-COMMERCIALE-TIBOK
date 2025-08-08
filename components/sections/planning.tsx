"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PlanningSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Planning & Optimisation</h2>
        <p className="text-gray-600">Gestion des tournées et optimisation des déplacements commerciaux</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Planification des Tournées</CardTitle>
            <div className="flex gap-2">
              <select className="border rounded-md px-3 py-2">
                <option value="semaine">Cette Semaine</option>
                <option value="mois">Ce Mois</option>
                <option value="trimestre">Ce Trimestre</option>
              </select>
              <Button>Optimiser Tournées</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InfoTile tone="blue" icon="📅" label="RDV Semaine" value="23" />
          <InfoTile tone="green" icon="🚗" label="Km Optimisés" value="-18%" />
          <InfoTile tone="yellow" icon="⏱️" label="Temps Gagné" value="3h15" />
          <InfoTile tone="purple" icon="€" label="Économies" value="€147" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TourCard
          titre="M. Dupont - Région Paris"
          badge={{ text: "Tournée Optimisée", tone: "green" }}
          items={[
            { border: "blue", hour: "09:30", who: "Clinique Saint-Martin", meta: "Paris 15ème • Négociation finale", sub: "🚗 25 min depuis domicile", tag: { text: "Urgent", tone: "red" } },
            { border: "green", hour: "14:00", who: "Maison de Retraite Belle Vue", meta: "Paris 12ème • Présentation solution", sub: "🚗 12 min depuis RDV précédent", tag: { text: "Normal", tone: "green" } },
            { border: "yellow", hour: "16:30", who: "Cabinet Dr. Moreau", meta: "Neuilly • Découverte besoins", sub: "🚗 18 min depuis RDV précédent", tag: { text: "Moyen", tone: "yellow" } },
          ]}
          resume={[
            ["Distance Totale", "67 km"],
            ["Temps Route", "1h25"],
            ["Coût Estimé", "€23.45"],
          ]}
        />

        <TourCard
          titre="Mme Martin - Région Lyon"
          badge={{ text: "À Optimiser", tone: "yellow" }}
          items={[
            { border: "green", hour: "10:00", who: "EHPAD Les Roses", meta: "Lyon 6ème • Première visite", sub: "🚗 15 min depuis domicile", tag: { text: "Normal", tone: "green" } },
            { border: "red", hour: "15:00", who: "Clinique des Monts d'Or", meta: "Collonges • Suivi commercial", sub: "🚗 45 min depuis RDV précédent ⚠️", tag: { text: "Suivi", tone: "blue" }, filled: true },
            { border: "purple", hour: "17:30", who: "Cabinet Dr. Roussel", meta: "Lyon 3ème • Signature contrat", sub: "🚗 28 min depuis RDV précédent", tag: { text: "Signature", tone: "purple" } },
          ]}
          resume={[
            ["Distance Totale", "89 km ⚠️"],
            ["Temps Route", "2h03 ⚠️"],
            ["Coût Estimé", "€31.15"],
          ]}
          footerActions={[
            { label: "Réorganiser", tone: "orange" },
            { label: "Itinéraire", tone: "blue" },
          ]}
        />
      </div>

      <div className="rounded-lg p-6 border bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-blue-800 font-semibold mb-3">💡 Suggestions d'Optimisation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="font-medium text-gray-900 mb-1">🗺️ Optimisation Géographique</div>
            <p className="text-sm text-gray-600">
              Regrouper les RDV de Mme Martin dans Lyon centre pourrait économiser 23 km et 35 minutes.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="font-medium text-gray-900 mb-1">⏰ Optimisation Temporelle</div>
            <p className="text-sm text-gray-600">
              Proposer des créneaux matinaux aux prospects éloignés pour éviter les embouteillages.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoTile({ tone = "blue", icon = "ℹ️", label = "Label", value = "—" }: { tone?: "blue" | "green" | "yellow" | "purple"; icon?: string; label?: string; value?: string }) {
  const bg = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    purple: "bg-purple-50 text-purple-700",
  }[tone]
  return (
    <div className={`text-center p-4 rounded-lg ${bg}`}>
      <div className="text-2xl mb-2" aria-hidden>{icon}</div>
      <p className="font-semibold text-gray-900">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function TourCard({
  titre = "Commercial - Région",
  badge = { text: "Tournée Optimisée", tone: "green" as const },
  items = [] as {
    border: "blue" | "green" | "yellow" | "red" | "purple"
    hour: string
    who: string
    meta: string
    sub: string
    filled?: boolean
    tag?: { text: string; tone: "red" | "green" | "yellow" | "purple" | "blue" }
  }[],
  resume = [] as [string, string][],
  footerActions = [] as { label: string; tone: "orange" | "blue" }[],
}) {
  const badgeTone = {
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
  }[badge.tone]

  const borderMap = {
    blue: "border-blue-500",
    green: "border-green-500",
    yellow: "border-yellow-500",
    red: "border-red-500",
    purple: "border-purple-500",
  } as const

  const tagTone = (tone: string) =>
    ({
      red: "bg-red-100 text-red-800",
      green: "bg-green-100 text-green-800",
      yellow: "bg-yellow-100 text-yellow-800",
      purple: "bg-purple-100 text-purple-800",
      blue: "bg-blue-100 text-blue-800",
    }[tone as any] || "")

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">{titre}</h3>
          <span className={`px-3 py-1 rounded-full text-sm ${badgeTone}`}>{badge.text}</span>
        </div>

        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className={`border-l-4 pl-4 py-2 ${borderMap[it.border]} ${it.filled ? "bg-red-50 rounded-r-lg" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{it.hour} - {it.who}</p>
                  <p className="text-sm text-gray-600">{it.meta}</p>
                  <p className={`text-xs ${it.border === "blue" ? "text-blue-600" : it.border === "green" ? "text-green-600" : it.border === "yellow" ? "text-yellow-600" : it.border === "red" ? "text-red-600" : "text-purple-600"}`}>{it.sub}</p>
                </div>
                {it.tag && <span className={`text-sm px-2 py-1 rounded ${tagTone(it.tag.tone)}`}>{it.tag.text}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded">
          <div className="grid grid-cols-3 gap-4 text-center">
            {resume.map(([k, v], i) => (
              <div key={i}>
                <p className="text-sm text-gray-600">{k}</p>
                <p className="font-semibold text-gray-900">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {footerActions.length > 0 && (
          <div className="flex gap-2 mt-4">
            {footerActions.map((a, i) => (
              <Button key={i} className={a.tone === "orange" ? "bg-orange-600 hover:bg-orange-700 text-white flex-1" : "flex-1"}>
                {a.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
