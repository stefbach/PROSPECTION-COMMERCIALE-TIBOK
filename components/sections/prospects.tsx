"use client"

import * as React from "react"
import type { Prospect } from "@/app/page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Building2, CalendarPlus, Phone, Plus, Search } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"

type Props = {
  prospects?: Prospect[]
  onAddProspect?: (p: Omit<Prospect, "id">) => void
  onCall?: (id: number) => void
  onPlanifierRdv?: (id: number) => void
  onEdit?: (id: number) => void
}
const defaultProspects: Prospect[] = []

export default function ProspectsSection({
  prospects = defaultProspects,
  onAddProspect = () => {},
  onCall = () => {},
  onPlanifierRdv = () => {},
  onEdit = () => {},
}: Props) {
  const [secteur, setSecteur] = React.useState<string>("")
  const [statut, setStatut] = React.useState<string>("")
  const [region, setRegion] = React.useState<string>("")
  const [search, setSearch] = React.useState<string>("")

  const filtered = React.useMemo(() => {
    return prospects.filter((p) => {
      const matchSecteur = !secteur || p.secteur === secteur
      const matchStatut = !statut || p.statut === statut
      const matchRegion = !region || p.region === region
      const matchSearch = !search || p.nom.toLowerCase().includes(search.toLowerCase()) || p.ville.toLowerCase().includes(search.toLowerCase())
      return matchSecteur && matchStatut && matchRegion && matchSearch
    })
  }, [prospects, secteur, statut, region, search])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Base de Données Prospects</h2>
        <p className="text-gray-600">Gestion complète de vos prospects télémédecine</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtres de Recherche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Secteur</label>
              <select value={secteur} onChange={(e) => setSecteur(e.target.value)} className="w-full border rounded-md px-3 py-2">
                <option value="">Tous les secteurs</option>
                <option value="clinique">Cliniques Privées</option>
                <option value="ehpad">EHPAD</option>
                <option value="medecin">Médecins Libéraux</option>
                <option value="hopital">Hôpitaux</option>
                <option value="maison-retraite">Maisons de Retraite</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Statut</label>
              <select value={statut} onChange={(e) => setStatut(e.target.value)} className="w-full border rounded-md px-3 py-2">
                <option value="">Tous les statuts</option>
                <option value="nouveau">Nouveau</option>
                <option value="qualifie">Qualifié</option>
                <option value="rdv-planifie">RDV Planifié</option>
                <option value="en-negociation">En Négociation</option>
                <option value="signe">Contrat Signé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Région</label>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full border rounded-md px-3 py-2">
                <option value="">Toutes les régions</option>
                <option value="ile-de-france">Île-de-France</option>
                <option value="paca">PACA</option>
                <option value="aura">Auvergne-Rhône-Alpes</option>
                <option value="grand-est">Grand Est</option>
                <option value="occitanie">Occitanie</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Recherche</label>
              <div className="flex gap-2">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom ou ville..." />
                <Button variant="secondary">
                  <Search className="h-4 w-4 mr-2" />
                  Filtrer
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => { setSecteur(""); setStatut(""); setRegion(""); setSearch(""); }}>
              Réinitialiser
            </Button>

            <AddProspectDialog onAdd={onAddProspect} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <ProspectCard
            key={p.id}
            prospect={p}
            onCall={() => onCall(p.id)}
            onRdv={() => onPlanifierRdv(p.id)}
            onEdit={() => onEdit(p.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-sm text-gray-600">Aucun prospect ne correspond aux filtres.</div>
        )}
      </div>
    </div>
  )
}

function ProspectCard({
  prospect,
  onCall = () => {},
  onRdv = () => {},
  onEdit = () => {},
}: {
  prospect: Prospect
  onCall?: () => void
  onRdv?: () => void
  onEdit?: () => void
}) {
  const statutColors: Record<Prospect["statut"], string> = {
    nouveau: "bg-gray-100 text-gray-800",
    qualifie: "bg-green-100 text-green-800",
    "rdv-planifie": "bg-blue-100 text-blue-800",
    "en-negociation": "bg-yellow-100 text-yellow-800",
    signe: "bg-purple-100 text-purple-800",
  }
  const statutTexts: Record<Prospect["statut"], string> = {
    nouveau: "Nouveau",
    qualifie: "Qualifié",
    "rdv-planifie": "RDV Planifié",
    "en-negociation": "En Négociation",
    signe: "Contrat Signé",
  }
  const stars = "★".repeat(prospect.score) + "☆".repeat(5 - prospect.score)

  return (
    <Card className="transition-transform hover:-translate-y-0.5">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{prospect.nom}</h3>
          <span className={`px-2 py-1 rounded text-xs ${statutColors[prospect.statut]}`}>{statutTexts[prospect.statut]}</span>
        </div>
        <div className="space-y-2 mb-4 text-sm">
          <p className="text-gray-600">📍 {prospect.ville} • {prospect.secteur.charAt(0).toUpperCase() + prospect.secteur.slice(1)}</p>
          <p className="text-gray-600">👤 {prospect.contact}</p>
          <p className="text-gray-600">📞 {prospect.telephone}</p>
          <p className="text-gray-600">💰 Budget: {prospect.budget}</p>
          <div className="flex items-center">
            <span className="text-yellow-500 mr-2" aria-hidden>{stars}</span>
            <span className="text-xs text-gray-500">({prospect.score}/5)</span>
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mb-4">{prospect.notes}</div>
        <div className="flex gap-2">
          <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={onCall}>
            <Phone className="h-4 w-4 mr-2" /> Appeler
          </Button>
          <Button className="flex-1" onClick={onRdv}>
            <CalendarPlus className="h-4 w-4 mr-2" /> RDV
          </Button>
          <Button variant="secondary" onClick={onEdit}>
            Éditer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AddProspectDialog({ onAdd = (_p: Omit<Prospect, "id">) => {} }: { onAdd?: (p: Omit<Prospect, "id">) => void }) {
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState<Omit<Prospect, "id">>({
    nom: "",
    secteur: "clinique",
    ville: "",
    statut: "nouveau",
    region: "ile-de-france",
    contact: "",
    telephone: "",
    email: "",
    score: 3,
    budget: "",
    notes: "",
  })

  function submit() {
    if (!form.nom || !form.ville) return
    onAdd(form)
    setOpen(false)
    setForm({ ...form, nom: "", ville: "", contact: "", telephone: "", email: "", budget: "", notes: "" })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Ajouter un prospect
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nouveau Prospect</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input placeholder="Nom de l'entreprise *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <Input placeholder="Ville *" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
          <select className="border rounded-md px-3 py-2" value={form.secteur} onChange={(e) => setForm({ ...form, secteur: e.target.value as Prospect["secteur"] })}>
            <option value="clinique">Clinique</option>
            <option value="ehpad">EHPAD</option>
            <option value="medecin">Médecin</option>
            <option value="hopital">Hôpital</option>
            <option value="maison-retraite">Maison de Retraite</option>
          </select>
          <select className="border rounded-md px-3 py-2" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value as Prospect["region"] })}>
            <option value="ile-de-france">Île-de-France</option>
            <option value="paca">PACA</option>
            <option value="aura">Auvergne-Rhône-Alpes</option>
            <option value="grand-est">Grand Est</option>
            <option value="occitanie">Occitanie</option>
          </select>
          <Input placeholder="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <Input placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select className="border rounded-md px-3 py-2" value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) as Prospect["score"] })}>
            <option value={5}>★★★★★ (5/5)</option>
            <option value={4}>★★★★☆ (4/5)</option>
            <option value={3}>★★★☆☆ (3/5)</option>
            <option value={2}>★★☆☆☆ (2/5)</option>
            <option value={1}>★☆☆☆☆ (1/5)</option>
          </select>
          <select className="border rounded-md px-3 py-2" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as Prospect["statut"] })}>
            <option value="nouveau">Nouveau</option>
            <option value="qualifie">Qualifié</option>
            <option value="rdv-planifie">RDV Planifié</option>
            <option value="en-negociation">En Négociation</option>
            <option value="signe">Signé</option>
          </select>
          <Input className="sm:col-span-2" placeholder="Budget" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          <Textarea className="sm:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit}>Enregistrer</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
