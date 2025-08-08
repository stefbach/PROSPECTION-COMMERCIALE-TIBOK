"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, ResponsiveContainer } from "recharts"

const lineData = [
  { mois: "Jan", qualifies: 45, rdv: 12, contrats: 3 },
  { mois: "Fév", qualifies: 52, rdv: 18, contrats: 5 },
  { mois: "Mar", qualifies: 48, rdv: 15, contrats: 4 },
  { mois: "Avr", qualifies: 61, rdv: 23, contrats: 8 },
  { mois: "Mai", qualifies: 55, rdv: 19, contrats: 6 },
  { mois: "Jun", qualifies: 67, rdv: 27, contrats: 11 },
]

const donutData = [
  { name: "Cliniques", value: 35, color: "hsl(217 91% 60%)" },
  { name: "EHPAD", value: 28, color: "hsl(160 84% 39%)" },
  { name: "Médecins", value: 20, color: "hsl(42 95% 55%)" },
  { name: "Hôpitaux", value: 12, color: "hsl(0 84% 60%)" },
  { name: "Maisons Retraite", value: 5, color: "hsl(262 83% 58%)" },
]

const chartConfig = {
  qualifies: { label: "Prospects Qualifiés", color: "hsl(217 91% 60%)" },
  rdv: { label: "RDV Obtenus", color: "hsl(160 84% 39%)" },
  contrats: { label: "Contrats Signés", color: "hsl(42 95% 55%)" },
} as const

export default function DashboardSection() {
  const formatMUR = (v: number) => {
    try {
      return new Intl.NumberFormat("fr-MU", { style: "currency", currency: "MUR", maximumFractionDigits: 0 }).format(v)
    } catch {
      return `MUR ${Math.round(v).toLocaleString("fr-FR")}`
    }
  }
  const [revenueMur, setRevenueMur] = React.useState<number>(0)

  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch("/api/metrics")
        const json = await res.json()
        if (alive && res.ok) {
          setRevenueMur(Number(json?.data?.revenueMur || 0))
        }
      } catch {}
    })()
    return () => { alive = false }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Tableau de Bord</h2>
        <p className="text-gray-600">Vue d'ensemble de votre activité de prospection télémédecine</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Prospects Actifs" value="2,847" trend="+12%" color="blue" icon="🏥" />
        <KpiCard title="RDV Programmés" value="127" trend="+8%" color="green" icon="📅" />
        <KpiCard title="Contrats Signés" value="43" trend="+15%" color="yellow" icon="🖊️" />
        <KpiCard title="CA Généré (MUR)" value={formatMUR(revenueMur)} trend="+22%" color="purple" icon="₨" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-[360px]">
          <CardHeader>
            <CardTitle className="text-base">Évolution des Performances</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ChartContainer
              config={{
                qualifies: { label: "Prospects Qualifiés", color: chartConfig.qualifies.color },
                rdv: { label: "RDV Obtenus", color: chartConfig.rdv.color },
                contrats: { label: "Contrats Signés", color: chartConfig.contrats.color },
              }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="qualifies" stroke={chartConfig.qualifies.color} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="rdv" stroke={chartConfig.rdv.color} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="contrats" stroke={chartConfig.contrats.color} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="h-[360px]">
          <CardHeader>
            <CardTitle className="text-base">Répartition par Secteur</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activité Récente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ActivityItem tone="green" title="Contrat signé - Clinique Saint-Martin" meta="Il y a 2 heures • Commercial: M. Dupont" />
          <ActivityItem tone="blue" title="Nouveau RDV planifié - EHPAD Les Roses" meta="Il y a 3 heures • Téléprospecteur: Mme Martin" />
          <ActivityItem tone="yellow" title="Appel qualifié - Cabinet Dr. Lambert" meta="Il y a 4 heures • Téléprospecteur: M. Roux" />
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  title = "Titre",
  value = "—",
  trend = "",
  color = "blue",
  icon = "📈",
}: {
  title?: string
  value?: string
  trend?: string
  color?: "blue" | "green" | "yellow" | "purple"
  icon?: string
}) {
  const border = {
    blue: "border-l-blue-500",
    green: "border-l-green-500",
    yellow: "border-l-yellow-500",
    purple: "border-l-purple-500",
  }[color]

  const text = {
    blue: "text-blue-500",
    green: "text-green-600",
    yellow: "text-yellow-600",
    purple: "text-purple-600",
  }[color]

  return (
    <Card className={`border-l-4 ${border}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-green-600 text-sm">{trend}</p>
          </div>
          <div className={`text-2xl ${text}`} aria-hidden>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({
  tone = "green",
  title = "Événement",
  meta = "Il y a X • Auteur",
}: {
  tone?: "green" | "blue" | "yellow"
  title?: string
  meta?: string
}) {
  const bg = {
    green: "bg-green-50",
    blue: "bg-blue-50",
    yellow: "bg-yellow-50",
  }[tone]
  const icon = {
    green: "✅",
    blue: "📅",
    yellow: "📞",
  }[tone]
  const textColor = {
    green: "text-green-600",
    blue: "text-blue-600",
    yellow: "text-yellow-600",
  }[tone]

  return (
    <div className={`flex items-center p-3 rounded-lg ${bg}`}>
      <div className={`mr-3 ${textColor}`} aria-hidden>{icon}</div>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{meta}</p>
      </div>
    </div>
  )
}
