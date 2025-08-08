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
import { useToast } from "@/hooks/use-toast"

type Monthly = { month: string; total_mur: number }

const donutData = [
  { name: "Cliniques", value: 35, color: "hsl(217 91% 60%)" },
  { name: "EHPAD", value: 28, color: "hsl(160 84% 39%)" },
  { name: "Médecins", value: 20, color: "hsl(42 95% 55%)" },
  { name: "Hôpitaux", value: 12, color: "hsl(0 84% 60%)" },
  { name: "Maisons Retraite", value: 5, color: "hsl(262 83% 58%)" },
]

export default function DashboardSection() {
  const [totalMur, setTotalMur] = React.useState<number>(0)
  const [monthly, setMonthly] = React.useState<Monthly[]>([])
  const { toast } = useToast()

  React.useEffect(() => {
    ;(async () => {
      try {
        const t = await fetch('/api/metrics/revenue-total', { cache: 'no-store' }).then(r => r.json())
        setTotalMur(t?.total_mur || 0)
      } catch {
        toast({ title: 'Info', description: 'KPI MUR indisponible (aucune donnée encore)' })
      }
      try {
        const m = await fetch('/api/metrics/revenue-monthly', { cache: 'no-store' }).then(r => r.json())
        setMonthly(Array.isArray(m) ? m : [])
      } catch {
        // ignore
      }
    })()
  }, [toast])

  const kpiCards = [
    { title: "Chiffre d'Affaires (MUR)", value: `MUR ${totalMur.toLocaleString()}`, trend: "", color: "purple" as const, icon: "₨" },
    { title: "Contrats Signés", value: "—", trend: "", color: "yellow" as const, icon: "🖊️" },
    { title: "Prospects Actifs", value: "—", trend: "", color: "blue" as const, icon: "🏥" },
    { title: "RDV Programmés", value: "—", trend: "", color: "green" as const, icon: "📅" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Tableau de Bord</h2>
        <p className="text-gray-600">Vue d'ensemble de votre activité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k, i) => (
          <KpiCard key={i} title={k.title} value={k.value} trend={k.trend} color={k.color} icon={k.icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-[360px]">
          <CardHeader>
            <CardTitle className="text-base">Revenu Mensuel (MUR)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ChartContainer
              config={{
                mur: { label: "Recettes (MUR)", color: "hsl(262 83% 58%)" },
              }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly.map((m) => ({ mois: m.month, mur: m.total_mur }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="mur" stroke="hsl(262 83% 58%)" strokeWidth={2} dot={false} />
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
