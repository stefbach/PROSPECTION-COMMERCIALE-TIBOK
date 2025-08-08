"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { CalendarPlus, Phone, Plus, Search } from 'lucide-react'
import { ContractDialog } from "@/components/contracts/contract-dialog"
import { useToast } from "@/hooks/use-toast"
import { ExcelImporter } from "@/components/imports/excel-importer"

type DBProspect = {
  id: string
  created_at: string
  updated_at: string
  nom_entite: string
  secteur: "clinique" | "ehpad" | "medecin" | "hopital" | "maison_retraite"
  contact_nom: string | null
  telephone: string | null
  email: string | null
  site_web: string | null
  adresse: string | null
  ville: string | null
  code_postal: string | null
  region: string | null
  statut: "nouveau" | "qualifie" | "rdv_planifie" | "en_negociation" | "signe"
  score_interet: number | null
  suivi_statut: string | null
  suivi_score: number | null
  commercial_id: string | null
  metadata: any
}

type Props = {
  onPlanifierRdv?: (prospectId?: string) => void
}

export default function ProspectsSection({ onPlanifierRdv = () => {} }: Props) {
  const [secteur, setSecteur] = React.useState<string>("")
  const [statut, setStatut] = React.useState<string>("")
  const [region, setRegion] = React.useState<string>("")
  const [search, setSearch] = React.useState<string>("")
  const [items, setItems] = React.useState<DBProspect[]>([])
  const [loading, setLoading] = React.useState<boolean>(false)
  const { toast } = useToast()

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (secteur) params.set("secteur", secteur)
    if (statut) params.set("statut", statut)
    if (region) params.set("region", region)
    if (search) params.set("q", search)
    const res = await fetch(`/api/prospects?${params.toString()}`)
    const json = await res.json()
    if (!res.ok) {
      toast({ title: "Erreur", description: json.error || "Échec du chargement" })
      setLoading(false)
      return
    }
    setItems(json.data || [])
    setLoading(false)
  }

  React.useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
                <option value="maison_retraite">Maisons de Retraite</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Statut</label>
              <select value={statut} onChange={(e) => setStatut(e.target.value)} className="w-full border rounded-md px-3 py-2">
                <option value="">Tous les statuts</option>
                <option value="nouveau">Nouveau</option>
                <option value="qualifie">Qualifié</option>
                <option value="rdv_planifie">RDV Planifié</option>
                <option value="en_negociation">En Négociation</option>
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
                <Button variant="secondary" onClick={load}>
                  <Search className="h-4 w-4 mr-2" />
                  Filtrer
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => { setSecteur(""); setStatut(""); setRegion(""); setSearch(""); load() }}>
              Réinitialiser
            </Button>
            <div className="flex items-center gap-2">
              <ExcelImporter onCompleted={load} />
              <AddProspectDialog onCreated={load} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((p) => (
          <ProspectCard
            key={p.id}
            prospect={p}
            onRdv={() => onPlanifierRdv(p.id)}
          />
        ))}
        {items.length === 0 && !loading && (
          <div className="text-sm text-gray-600">Aucun prospect ne correspond aux filtres.</div>
        )}
        {loading && <div className="text-sm text-gray-600">Chargement...</div>}
      </div>
    </div>
  )
}

function ProspectCard({
  prospect,
  onRdv = () => {},
}: {
  prospect: DBProspect
  onRdv?: () => void
}) {
  const statutColors: Record<DBProspect["statut"], string> = {
    nouveau: "bg-gray-100 text-gray-800",
    qualifie: "bg-green-100 text-green-800",
    rdv_planifie: "bg-blue-100 text-blue-800",
    en_negociation: "bg-yellow-100 text-yellow-800",
    signe: "bg-purple-100 text-purple-800",
  }
  const statutTexts: Record<DBProspect["statut"], string> = {
    nouveau: "Nouveau",
    qualifie: "Qualifié",
    rdv_planifie: "RDV Planifié",
    en_negociation: "En Négociation",
    signe: "Contrat Signé",
  }
  const stars = "★".repeat(Math.max(1, prospect.score_interet ?? 3)) + "☆".repeat(5 - Math.max(1, prospect.score_interet ?? 3))

  return (
    <Card className="transition-transform hover:-translate-y-0.5">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{prospect.nom_entite}</h3>
          <span className={`px-2 py-1 rounded text-xs ${statutColors[prospect.statut]}`}>{statutTexts[prospect.statut]}</span>
        </div>
        <div className="space-y-2 mb-4 text-sm">
          <p className="text-gray-600">📍 {prospect.ville || "—"} • {prospect.secteur.charAt(0).toUpperCase() + prospect.secteur.slice(1)}</p>
          <p className="text-gray-600">👤 {prospect.contact_nom || "—"}</p>
          <p className="text-gray-600">📞 {prospect.telephone || "—"}</p>
          <p className="text-gray-600">💌 {prospect.email || "—"}</p>
          {prospect.site_web && <p className="text-gray-600 truncate">🌐 {prospect.site_web}</p>}
          <div className="flex items-center">
            <span className="text-yellow-500 mr-2" aria-hidden>{stars}</span>
            <span className="text-xs text-gray-500">({prospect.score_interet ?? 3}/5)</span>
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mb-4">
          {prospect.suivi_statut ? `Suivi: ${prospect.suivi_statut}` : "—"}
        </div>
        <div className="flex gap-2">
          <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { window.alert(`Appel vers ${prospect.telephone || "prospect"}`) }}>
            <Phone className="h-4 w-4 mr-2" /> Appeler
          </Button>
          <Button className="flex-1" onClick={onRdv}>
            <CalendarPlus className="h-4 w-4 mr-2" /> RDV
          </Button>
          <ContractDialog prospectId={prospect.id} />
        </div>
      </CardContent>
    </Card>
  )
}

function AddProspectDialog({ onCreated = () => {} }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    nom_entite: "",
    secteur: "clinique",
    ville: "",
    statut: "nouveau",
    region: "ile-de-france",
    contact_nom: "",
    telephone: "",
    email: "",
    site_web: "",
    adresse: "",
    code_postal: "",
    score_interet: 3,
  })
  const { toast } = useToast()

  async function submit() {
    if (!form.nom_entite || !form.secteur) return
    setSaving(true)
    const res = await fetch("/api/prospects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) {
      toast({ title: "Erreur", description: json.error || "Création échouée" })
      return
    }
    toast({ title: "Prospect ajouté", description: json.data?.nom_entite })
    setOpen(false)
    setForm({ ...form, nom_entite: "", ville: "", contact_nom: "", telephone: "", email: "", site_web: "", adresse: "", code_postal: "" })
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Ajouter un prospect
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouveau Prospect</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input placeholder="Nom de l'entité *" value={form.nom_entite} onChange={(e) => setForm({ ...form, nom_entite: e.target.value })} />
          <select className="border rounded-md px-3 py-2" value={form.secteur} onChange={(e) => setForm({ ...form, secteur: e.target.value })}>
            <option value="clinique">Clinique</option>
            <option value="ehpad">EHPAD</option>
            <option value="medecin">Médecin</option>
            <option value="hopital">Hôpital</option>
            <option value="maison_retraite">Maison de Retraite</option>
          </select>
          <Input placeholder="Ville" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
          <select className="border rounded-md px-3 py-2" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
            <option value="ile-de-france">Île-de-France</option>
            <option value="paca">PACA</option>
            <option value="aura">Auvergne-Rhône-Alpes</option>
            <option value="grand-est">Grand Est</option>
            <option value="occitanie">Occitanie</option>
          </select>
          <Input placeholder="Contact" value={form.contact_nom} onChange={(e) => setForm({ ...form, contact_nom: e.target.value })} />
          <Input placeholder="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Site internet" value={form.site_web} onChange={(e) => setForm({ ...form, site_web: e.target.value })} />
          <Input placeholder="Adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          <Input placeholder="Code postal" value={form.code_postal} onChange={(e) => setForm({ ...form, code_postal: e.target.value })} />
          <select className="border rounded-md px-3 py-2" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
            <option value="nouveau">Nouveau</option>
            <option value="qualifie">Qualifié</option>
            <option value="rdv_planifie">RDV Planifié</option>
            <option value="en_negociation">En Négociation</option>
            <option value="signe">Signé</option>
          </select>
          <select className="border rounded-md px-3 py-2" value={form.score_interet} onChange={(e) => setForm({ ...form, score_interet: Number(e.target.value) })}>
            <option value={5}>★★★★★ (5/5)</option>
            <option value={4}>★★★★☆ (4/5)</option>
            <option value={3}>★★★☆☆ (3/5)</option>
            <option value={2}>★★☆☆☆ (2/5)</option>
            <option value={1}>★☆☆☆☆ (1/5)</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
