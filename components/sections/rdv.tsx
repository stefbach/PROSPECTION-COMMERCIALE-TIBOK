"use client"

import * as React from "react"
import type { Prospect } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function RdvSection() {
  const [prospects, setProspects] = React.useState<Prospect[]>([])
  const [rdvs, setRdvs] = React.useState<any[]>([])
  const [prospectId, setProspectId] = React.useState<number | "">("")
  const [date, setDate] = React.useState("")
  const [time, setTime] = React.useState("")
  const [commercial, setCommercial] = React.useState("")
  const [typeVisite, setTypeVisite] = React.useState("decouverte")
  const [priorite, setPriorite] = React.useState<"normale" | "haute" | "urgente">("normale")
  const [duree, setDuree] = React.useState("60")
  const [notes, setNotes] = React.useState("")
  const { toast } = useToast()

  const todayIso = new Date().toISOString().split("T")[0]

  async function loadProspects() {
    const data = await fetch('/api/prospects', { cache: 'no-store' }).then(r => r.json()).catch(() => [])
    setProspects(Array.isArray(data) ? data : [])
  }
  async function loadRdvs() {
    const data = await fetch('/api/rdv', { cache: 'no-store' }).then(r => r.json()).catch(() => [])
    setRdvs(Array.isArray(data) ? data : [])
  }
  React.useEffect(() => {
    loadProspects()
    loadRdvs()
  }, [])

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
      }
      const res = await fetch('/api/rdv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(await res.text())
      await loadRdvs()
      toast({ title: 'RDV planifié', description: body.titre })
      setProspectId("")
      setDate("")
      setTime("")
      setCommercial("")
      setTypeVisite("decouverte")
      setPriorite("normale")
      setDuree("60")
      setNotes("")
    } catch (e: any) {
      toast({ title: 'Erreur RDV', description: e.message })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Prise de Rendez-Vous</h2>
        <p className="text-gray-600">Planification intelligente des visites commerciales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nouveau Rendez-Vous</CardTitle>
          </CardHeader>
          <CardContent>
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
                    <option key={p.id} value={p.id}>{p.nom} - {p.ville}</option>
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
                    <option value="decouverte">Visite de Découverte</option>
                    <option value="presentation">Présentation Solution</option>
                    <option value="negociation">Négociation</option>
                    <option value="signature">Signature Contrat</option>
                    <option value="suivi">Suivi Client</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Priorité</label>
                  <select className="w-full border rounded-md px-3 py-2" value={priorite} onChange={(e) => setPriorite(e.target.value as any)}>
                    <option value="normale">Normale</option>
                    <option value="haute">Haute</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Durée Estimée</label>
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
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Objectifs de la visite, points à aborder..." />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">Planifier le RDV</Button>
                <Button type="button" variant="secondary" onClick={() => {
                  setProspectId(""); setDate(""); setTime(""); setCommercial(""); setTypeVisite("decouverte"); setPriorite("normale"); setDuree("60"); setNotes("")
                }}>
                  Effacer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">RDV Programmés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rdvs.map((r) => (
              <RdvItem key={r.id} item={r} />
            ))}
            {rdvs.length === 0 && <div className="text-sm text-gray-600">Aucun RDV pour le moment.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RdvItem({ item }: { item: any }) {
  const p = item.priorite as 'normale' | 'haute' | 'urgente'
  const border = p === 'urgente' ? 'border-yellow-500 bg-yellow-50' : p === 'haute' ? 'border-blue-500 bg-blue-50' : 'border-green-500 bg-green-50'
  const tagColor = {
    negociation: "bg-blue-100 text-blue-800",
    decouverte: "bg-green-100 text-green-800",
    signature: "bg-purple-100 text-purple-800",
    suivi: "bg-gray-100 text-gray-800",
    presentation: "bg-green-100 text-green-800",
  }[item.type_visite || 'presentation'] || "bg-gray-100 text-gray-800"

  const title = item.titre || 'RDV'
  const date = new Date(item.date_time).toLocaleString()

  return (
    <div className={`border-l-4 ${border} p-4 rounded-r-lg`}>
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <span className={`text-xs px-2 py-1 rounded ${p === "urgente" ? "bg-yellow-100 text-yellow-800" : p === "haute" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
          {p.charAt(0).toUpperCase() + p.slice(1)}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-1">📅 {date} • {item.commercial}</p>
      <p className="text-sm text-gray-700">{item.notes}</p>
      <div className="mt-2">
        <span className={`text-xs px-2 py-1 rounded ${tagColor}`}>{(item.type_visite || '').charAt(0).toUpperCase() + (item.type_visite || '').slice(1)}</span>
      </div>
    </div>
  )
}
