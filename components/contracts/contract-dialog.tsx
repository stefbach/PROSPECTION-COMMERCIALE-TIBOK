"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

type ContractRow = {
  id: string
  file_name: string
  file_type: string | null
  storage_bucket: string
  storage_path: string
  created_at: string
  status: string
  signedUrl?: string | null
  // pricing + computed
  fee_per_consultation_mur?: number | null
  revenueMur?: number
  consultationsCount?: number
}

function formatMUR(v: number) {
  try {
    return new Intl.NumberFormat("fr-MU", { style: "currency", currency: "MUR", maximumFractionDigits: 2 }).format(v)
  } catch {
    return `MUR ${v.toFixed(2)}`
  }
}

export function ContractDialog({ prospectId }: { prospectId: string }) {
  const [open, setOpen] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [rows, setRows] = React.useState<ContractRow[]>([])
  const fileRef = React.useRef<HTMLInputElement | null>(null)
  const [feeMur, setFeeMur] = React.useState<string>("0")
  const { toast } = useToast()

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/contracts?prospectId=${encodeURIComponent(prospectId)}`)
    const json = await res.json()
    setRows(json.data || [])
    setLoading(false)
  }

  React.useEffect(() => {
    if (open) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function upload() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("prospect_id", prospectId)
    fd.append("fee_per_consultation_mur", feeMur || "0")
    const res = await fetch("/api/contracts", { method: "POST", body: fd })
    const json = await res.json()
    setUploading(false)
    if (!res.ok) {
      toast({ title: "Échec du téléversement", description: json.error || "Erreur inconnue" })
      return
    }
    toast({ title: "Contrat ajouté", description: json.data?.file_name })
    if (fileRef.current) fileRef.current.value = ""
    load()
  }

  async function remove(id: string) {
    const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const j = await res.json()
      toast({ title: "Suppression échouée", description: j.error || "Erreur" })
      return
    }
    toast({ title: "Contrat supprimé" })
    load()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Contrats</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Contrats du prospect</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input type="file" ref={fileRef} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Tarif/consult. (MUR)</label>
              <Input
                type="number"
                step="0.01"
                value={feeMur}
                onChange={(e) => setFeeMur(e.target.value)}
                className="w-32"
              />
              <Button onClick={upload} disabled={uploading}>
                {uploading ? "Envoi..." : "Uploader"}
              </Button>
            </div>
          </div>

          <div className="border rounded">
            <div className="p-2 text-sm text-gray-600 border-b flex items-center justify-between">
              <span>Fichiers</span>
              <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
                {loading ? "Actualisation..." : "Rafraîchir"}
              </Button>
            </div>
            <ul className="max-h-64 overflow-auto divide-y">
              {rows.map((r) => (
                <li key={r.id} className="p-3 text-sm flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.file_name}</p>
                    <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString("fr-FR")}</p>
                    <p className="text-xs text-gray-600">
                      Tarif: {formatMUR(r.fee_per_consultation_mur ?? 0)} • Consultations: {r.consultationsCount ?? 0} •
                      Recette: {formatMUR(r.revenueMur ?? 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.signedUrl ? (
                      <a href={r.signedUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">Télécharger</Button>
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">Lien indisponible</span>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => remove(r.id)}>
                      Supprimer
                    </Button>
                  </div>
                </li>
              ))}
              {rows.length === 0 && !loading && (
                <li className="p-3 text-sm text-gray-500">Aucun contrat pour ce prospect.</li>
              )}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
