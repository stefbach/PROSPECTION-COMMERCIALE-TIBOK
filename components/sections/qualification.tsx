"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Props = {
  onQualify?: (id: number, statut: "qualifie" | "non-qualifie" | "en-negociation" | "rdv-planifie" | "signe" | "nouveau") => void
  onPlanifierRdv?: (id: number) => void
}

export default function QualificationSection({ onQualify = () => {}, onPlanifierRdv = () => {} }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Qualification des Prospects</h2>
        <p className="text-gray-600">Interface complète de qualification et suivi des opportunités</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtres de Qualification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Statut Qualification</label>
              <select className="w-full border rounded-md px-3 py-2">
                <option value="">Tous les statuts</option>
                <option value="a-qualifier">À Qualifier</option>
                <option value="qualifie">Qualifié</option>
                <option value="non-qualifie">Non Qualifié</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Score Intérêt</label>
              <select className="w-full border rounded-md px-3 py-2">
                <option value="">Tous les scores</option>
                <option value="5">★★★★★ (5/5)</option>
                <option value="4">★★★★☆ (4/5)</option>
                <option value="3">★★★☆☆ (3/5)</option>
                <option value="2">★★☆☆☆ (2/5)</option>
                <option value="1">★☆☆☆☆ (1/5)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Commercial</label>
              <select className="w-full border rounded-md px-3 py-2">
                <option value="">Tous les commerciaux</option>
                <option value="dupont">M. Dupont</option>
                <option value="martin">Mme Martin</option>
                <option value="bernard">M. Bernard</option>
                <option value="roux">Mme Roux</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <QualifCard
          id={1}
          titre="Clinique Saint-Martin"
          sousTitre="Paris 15ème • Clinique Privée • 150 lits"
          score="★★★★☆"
          badge={{ text: "À Qualifier", tone: "orange" }}
          lignes={[
            ["Contact Principal", "Dr. Moreau - Directeur"],
            ["Téléphone", "01.45.32.18.97"],
            ["Dernier Contact", "Il y a 2 jours"],
            ["Budget Estimé", "€15,000-25,000/an"],
          ]}
          notes={`"Intéressé par solution télémédecine pour urgences nocturnes. 
Décision fin du mois. Concurrent présent (MedConnect)."`}
          actions={[
            { label: "Qualifier", tone: "green", onClick: () => onQualify(1, "qualifie") },
            { label: "RDV", tone: "blue", onClick: () => onPlanifierRdv(1) },
            { label: "Éditer", tone: "gray" },
          ]}
        />
        <QualifCard
          id={2}
          titre="EHPAD Les Roses"
          sousTitre="Lyon 6ème • EHPAD • 80 résidents"
          score="★★★★★"
          badge={{ text: "Qualifié", tone: "green" }}
          lignes={[
            ["Contact Principal", "Mme Dubois - Directrice"],
            ["Téléphone", "04.72.15.89.34"],
            ["Dernier Contact", "Hier"],
            ["Budget Confirmé", "€18,000/an"],
          ]}
          notes={`"Très motivée. Budget validé par le conseil d'administration. 
Souhaite démarrer avant fin d'année. RDV commercial programmé."`}
          actions={[
            { label: "Négocier", tone: "blue" },
            { label: "Contrat", tone: "purple" },
            { label: "Éditer", tone: "gray" },
          ]}
        />
        <QualifCard
          id={3}
          titre="Cabinet Dr. Lambert"
          sousTitre="Marseille • Cabinet Médical • 3 médecins"
          score="★★☆☆☆"
          badge={{ text: "Non Qualifié", tone: "red" }}
          lignes={[
            ["Contact Principal", "Dr. Lambert"],
            ["Téléphone", "04.91.25.47.83"],
            ["Dernier Contact", "Il y a 1 semaine"],
            ["Budget", "Non communiqué"],
          ]}
          notes={`"Pas de besoin immédiat. Cabinet bien organisé avec solution existante. 
À recontacter dans 6 mois."`}
          actions={[
            { label: "Relance 6M", tone: "yellow" },
            { label: "Archiver", tone: "gray" },
            { label: "Éditer", tone: "gray" },
          ]}
        />
        <QualifCard
          id={4}
          titre="Hôpital Privé de Versailles"
          sousTitre="Versailles • Hôpital Privé • 200 lits"
          score="★★★★★"
          badge={{ text: "En Négociation", tone: "blue" }}
          lignes={[
            ["Contact Principal", "M. Rousseau - DSI"],
            ["Téléphone", "01.39.24.65.78"],
            ["Dernier Contact", "Aujourd'hui"],
            ["Budget Négocié", "€35,000/an"],
          ]}
          notes={`"Négociation avancée. Reste à finaliser les conditions techniques 
et l'intégration avec leur SIH. Décision attendue cette semaine."`}
          actions={[
            { label: "Finaliser", tone: "green" },
            { label: "Relancer", tone: "orange" },
            { label: "Éditer", tone: "gray" },
          ]}
        />
      </div>
    </div>
  )
}

function QualifCard({
  id = 0,
  titre = "Prospect",
  sousTitre = "",
  score = "★★★★☆",
  badge = { text: "À Qualifier", tone: "orange" as const },
  lignes = [] as [string, string][],
  notes = "",
  actions = [] as { label: string; tone: "green" | "blue" | "purple" | "gray" | "yellow" | "orange"; onClick?: () => void }[],
}: {
  id?: number
  titre?: string
  sousTitre?: string
  score?: string
  badge?: { text: string; tone: "green" | "orange" | "red" | "blue" }
  lignes?: [string, string][]
  notes?: string
  actions?: { label: string; tone: "green" | "blue" | "purple" | "gray" | "yellow" | "orange"; onClick?: () => void }[]
}) {
  const badgeTone = {
    green: "bg-green-100 text-green-800",
    orange: "bg-orange-100 text-orange-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
  }[badge.tone]

  const btnTone = (tone: string) =>
    ({
      green: "bg-green-600 hover:bg-green-700 text-white",
      blue: "",
      purple: "bg-purple-600 hover:bg-purple-700 text-white",
      gray: "bg-gray-600 hover:bg-gray-700 text-white",
      yellow: "bg-yellow-600 hover:bg-yellow-700 text-white",
      orange: "bg-orange-600 hover:bg-orange-700 text-white",
    }[tone as any] || "")

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{titre}</h3>
            <p className="text-sm text-gray-600">{sousTitre}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-yellow-500" aria-hidden>{score}</div>
            <span className={`px-2 py-1 rounded text-xs ${badgeTone}`}>{badge.text}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          {lignes.map(([k, v], idx) => (
            <div key={idx}>
              <p className="text-sm font-medium text-gray-600">{k}</p>
              <p className="text-sm text-gray-900">{v}</p>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600 mb-2">Notes de Qualification</p>
          <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-line">{notes}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          {actions.map((a, i) => (
            <Button key={i} className={btnTone(a.tone)} onClick={a.onClick}>
              {a.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
