"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle2, FileSpreadsheet, Import, Loader2, ShieldAlert, Upload } from 'lucide-react'
import * as XLSX from "xlsx"

type NormalizedRow = {
  nom_entite: string
  secteur: "clinique" | "ehpad" | "medecin" | "hopital" | "maison_retraite"
  ville?: string | null
  statut?: "nouveau" | "qualifie" | "rdv_planifie" | "en_negociation" | "signe"
  region?: string | null
  contact_nom?: string | null
  telephone?: string | null
  email?: string | null
  site_web?: string | null
  adresse?: string | null
  code_postal?: string | null
  score_interet?: number | null
  commercial_email?: string | null
  commercial_name?: string | null
  metadata?: any
}

type MappedRow = NormalizedRow & {
  _errors: string[]
  _warnings: string[]
  _duplicate?: boolean
  _resolved_commercial_id?: string | null
}

const targetFields: {
  key: keyof NormalizedRow
  label: string
  required?: boolean
  description?: string
}[] = [
  { key: "nom_entite", label: "Nom de l'entité", required: true },
  { key: "secteur", label: "Secteur (enum)", required: true },
  { key: "ville", label: "Ville" },
  { key: "statut", label: "Statut (enum)" },
  { key: "region", label: "Région (code)" },
  { key: "contact_nom", label: "Contact" },
  { key: "telephone", label: "Téléphone" },
  { key: "email", label: "Email" },
  { key: "site_web", label: "Site web" },
  { key: "adresse", label: "Adresse" },
  { key: "code_postal", label: "Code postal" },
  { key: "score_interet", label: "Score Intérêt (1-5)" },
  { key: "commercial_email", label: "Email commercial (mapping)" },
  { key: "commercial_name", label: "Nom commercial (fallback mapping)" },
]

const secteurMap: Record<string, NormalizedRow["secteur"]> = {
  clinique: "clinique",
  cliniques: "clinique",
  "clinique privee": "clinique",
  "clinique privée": "clinique",
  ehpad: "ehpad",
  "maison de retraite": "maison_retraite",
  "maison retraite": "maison_retraite",
  medecin: "medecin",
  médecin: "medecin",
  "cabinet medical": "medecin",
  "cabinet médical": "medecin",
  hopital: "hopital",
  hôpital: "hopital",
  hopitaux: "hopital",
  hôpitaux: "hopital",
  "maisons de retraite": "maison_retraite",
  "maison_retraite": "maison_retraite",
}

const statutMap: Record<string, NonNullable<NormalizedRow["statut"]>> = {
  nouveau: "nouveau",
  "a qualifier": "nouveau",
  "à qualifier": "nouveau",
  qualifie: "qualifie",
  "qualifié": "qualifie",
  "rdv planifie": "rdv_planifie",
  "rdv planifié": "rdv_planifie",
  "en negociation": "en_negociation",
  "en négociation": "en_negociation",
  signe: "signe",
  signé: "signe",
}

const regionMap: Record<string, string> = {
  "ile-de-france": "ile-de-france",
  "Île-de-France": "ile-de-france",
  idf: "ile-de-france",
  "ile de france": "ile-de-france",
  paca: "paca",
  "provence-alpes-cote d'azur": "paca",
  "provence-alpes-côte d'azur": "paca",
  "auvergne-rhone-alpes": "aura",
  "auvergne-rhône-alpes": "aura",
  aura: "aura",
  "grand est": "grand-est",
  "grand-est": "grand-est",
  occitanie: "occitanie",
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function normalizeSecteur(val: any): NormalizedRow["secteur"] | undefined {
  if (val == null) return undefined
  const s = slugify(String(val))
  return secteurMap[s] || undefined
}

function normalizeStatut(val: any): NormalizedRow["statut"] | undefined {
  if (val == null) return undefined
  const s = slugify(String(val))
  return statutMap[s] || undefined
}

function normalizeRegion(val: any): string | undefined {
  if (val == null) return undefined
  const s = slugify(String(val))
  return regionMap[s] || undefined
}

function normalizeScore(val: any): number | undefined {
  if (val == null || val === "") return undefined
  if (typeof val === "number" && !isNaN(val)) {
    const clamped = Math.max(1, Math.min(5, Math.round(val)))
    return clamped
  }
  const s = String(val)
  const stars = (s.match(/★/g) || []).length
  if (stars > 0) return Math.max(1, Math.min(5, stars))
  const n = parseInt(s, 10)
  if (!isNaN(n)) {
    return Math.max(1, Math.min(5, n))
  }
  return undefined
}

function normalizePhone(p: any): string | undefined {
  if (!p) return undefined
  const s = String(p).replace(/[^\d+]/g, "")
  return s || undefined
}

function normalizeEmail(e: any): string | undefined {
  if (!e) return undefined
  const s = String(e).trim().toLowerCase()
  if (!s.includes("@")) return undefined
  return s
}

function pick<T extends object>(obj: T, keys: (keyof T)[]) {
  const out: Partial<T> = {}
  keys.forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k]
  })
  return out
}

function autoMap(headers: string[]) {
  const map: Record<string, string | ""> = {}
  const H = headers.map((h) => [h, slugify(h)] as const)

  const tryFind = (cands: string[]) => {
    for (const cand of cands) {
      const hit = H.find(([, s]) => s === cand || s.includes(cand))
      if (hit) return hit[0]
    }
    return ""
  }

  map["nom_entite"] = tryFind(["nom entite", "nom", "etablissement", "raison sociale", "entreprise"])
  map["secteur"] = tryFind(["secteur", "type", "categorie", "segment"])
  map["ville"] = tryFind(["ville", "localite"])
  map["statut"] = tryFind(["statut", "etat"])
  map["region"] = tryFind(["region"])
  map["contact_nom"] = tryFind(["contact", "contact principal", "nom contact"])
  map["telephone"] = tryFind(["telephone", "tel", "phone"])
  map["email"] = tryFind(["email", "mail", "e mail"])
  map["site_web"] = tryFind(["site", "site web", "url"])
  map["adresse"] = tryFind(["adresse", "addresse"])
  map["code_postal"] = tryFind(["code postal", "cp", "postal"])
  map["score_interet"] = tryFind(["score", "score interet", "interet"])
  map["commercial_email"] = tryFind(["commercial email", "email commercial", "account manager email"])
  map["commercial_name"] = tryFind(["commercial", "account manager", "vendeur"])

  return map
}

export function ExcelImporter({ onCompleted = () => {} }: { onCompleted?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [fileName, setFileName] = React.useState<string>("")
  const [headers, setHeaders] = React.useState<string[]>([])
  const [rows, setRows] = React.useState<Record<string, any>[]>([])
  const [mapping, setMapping] = React.useState<Record<string, string | "">>({})
  const [mapped, setMapped] = React.useState<MappedRow[]>([])
  const [dryRunResult, setDryRunResult] = React.useState<{ stats?: any } | null>(null)
  const [skipDuplicates, setSkipDuplicates] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const { toast } = useToast()

  function resetAll() {
    setFileName("")
    setHeaders([])
    setRows([])
    setMapping({})
    setMapped([])
    setDryRunResult(null)
    setSkipDuplicates(true)
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    try {
      const buf = await f.arrayBuffer()
      const wb = XLSX.read(buf, { type: "array" })
      const wsName = wb.SheetNames[0]
      const ws = wb.Sheets[wsName]
      const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true })
      if (!aoa || aoa.length === 0) throw new Error("Feuille vide")
      const head = (aoa[0] || []).map((h) => String(h || "").trim())
      const data = aoa
        .slice(1)
        .filter((row) => row.some((cell) => cell != null && cell !== ""))
        .map((row) => {
          const o: Record<string, any> = {}
          head.forEach((h, i) => {
            o[h] = row[i]
          })
          return o
        })
      setHeaders(head)
      setRows(data)
      setMapping(autoMap(head))
      setMapped([])
      setDryRunResult(null)
    } catch (err: any) {
      toast({ title: "Erreur de lecture", description: err?.message || "Fichier invalide" })
      resetAll()
    }
  }

  function computeMapped(): MappedRow[] {
    const out: MappedRow[] = rows.map((r) => {
      const m: any = {}
      for (const tf of targetFields) {
        const src = mapping[tf.key]
        const v = src ? r[src] : undefined
        if (tf.key === "nom_entite") m.nom_entite = String(v ?? "").trim()
        else if (tf.key === "secteur") m.secteur = normalizeSecteur(v)
        else if (tf.key === "statut") m.statut = normalizeStatut(v) || "nouveau"
        else if (tf.key === "region") m.region = normalizeRegion(v) || null
        else if (tf.key === "score_interet") m.score_interet = normalizeScore(v) ?? 3
        else if (tf.key === "telephone") m.telephone = normalizePhone(v) || null
        else if (tf.key === "email") m.email = normalizeEmail(v) || null
        else if (tf.key === "commercial_email") m.commercial_email = normalizeEmail(v) || null
        else if (tf.key === "commercial_name") m.commercial_name = v ? String(v).trim() : null
        else {
          const s = v == null ? null : String(v).trim()
          m[tf.key] = s || null
        }
      }
      const errors: string[] = []
      const warnings: string[] = []
      if (!m.nom_entite) errors.push("nom_entite requis")
      if (!m.secteur) errors.push("secteur invalide (clinique|ehpad|medecin|hopital|maison_retraite)")
      if (m.email && !m.email.includes("@")) errors.push("email invalide")
      if (m.score_interet != null && (m.score_interet < 1 || m.score_interet > 5)) {
        warnings.push("score_interet hors plage, corrigé (1-5)")
        m.score_interet = Math.max(1, Math.min(5, Number(m.score_interet)))
      }
      const meta = pick(m, ["commercial_email", "commercial_name"])
      const final: MappedRow = {
        ...m,
        metadata: Object.keys(meta).length ? meta : undefined,
        _errors: errors,
        _warnings: warnings,
      }
      return final
    })
    return out
  }

  async function runDryRun() {
    setBusy(true)
    try {
      const computed = computeMapped()
      setMapped(computed)
      const payload = { rows: computed.map(stripTech), dryRun: true }
      const res = await fetch("/api/imports/prospects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Erreur d'analyse")
      }
      const enriched: MappedRow[] = (json?.rows || []).map((row: any, i: number) => ({
        ...computed[i],
        _duplicate: !!row._duplicate,
        _resolved_commercial_id: row._resolved_commercial_id ?? null,
        _warnings: [...computed[i]._warnings, ...(row._warnings || [])],
      }))
      setMapped(enriched)
      setDryRunResult({ stats: json.stats })
      toast({ title: "Analyse terminée", description: `Aperçu: ${enriched.length} lignes` })
    } catch (e: any) {
      toast({ title: "Erreur analyse", description: e?.message || "Inconnue" })
    } finally {
      setBusy(false)
    }
  }

  async function runImport() {
    if (mapped.length === 0) return
    setBusy(true)
    try {
      const res = await fetch("/api/imports/prospects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rows: mapped.map(stripTech),
          dryRun: false,
          skipDuplicates,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Import échoué")
      toast({ title: "Import terminé", description: `Importés: ${json.stats?.inserted || 0} / ${mapped.length}` })
      setOpen(false)
      resetAll()
      onCompleted()
    } catch (e: any) {
      toast({ title: "Erreur import", description: e?.message || "Inconnue" })
    } finally {
      setBusy(false)
    }
  }

  const mappedErrors = React.useMemo(() => mapped.filter((r) => r._errors.length > 0).length, [mapped])
  const mappedDups = React.useMemo(() => mapped.filter((r) => r._duplicate).length, [mapped])

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetAll() }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Import className="h-4 w-4 mr-2" />
          Importer Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importer des Prospects (Excel / CSV)</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded border p-3">
            <div className="flex items-center gap-3">
              <Input type="file" accept=".xlsx,.xls,.csv" onChange={onPickFile} />
              <Button variant="secondary" disabled>
                <Upload className="h-4 w-4 mr-2" />
                Sélectionner
              </Button>
            </div>
            {fileName && (
              <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span>{fileName}</span>
                <span className="text-gray-400">•</span>
                <span>{rows.length} lignes détectées</span>
              </div>
            )}
          </div>

          {headers.length > 0 && (
            <div className="space-y-3">
              <div className="font-medium">Mapping des colonnes</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {targetFields.map((tf) => (
                  <div key={tf.key} className="space-y-1">
                    <label className="text-sm font-medium">
                      {tf.label} {tf.required && <span className="text-red-600">*</span>}
                    </label>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      value={mapping[tf.key] ?? ""}
                      onChange={(e) => setMapping((m) => ({ ...m, [tf.key]: e.target.value }))}
                    >
                      <option value="">— Ne pas mapper —</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={runDryRun} disabled={busy || rows.length === 0}>
                  {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldAlert className="h-4 w-4 mr-2" />}
                  Analyser
                </Button>
              </div>
            </div>
          )}

          {mapped.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">Aperçu & validations</div>
                <div className="text-sm text-gray-600">
                  {mappedErrors > 0 && (
                    <span className="text-red-600 mr-3">{mappedErrors} erreurs</span>
                  )}
                  {mappedDups > 0 && <span className="text-yellow-700">{mappedDups} doublons potentiels</span>}
                </div>
              </div>

              <div className="max-h-64 overflow-auto rounded border">
                <ul className="divide-y">
                  {mapped.slice(0, 50).map((r, idx) => (
                    <li key={idx} className="p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {r.nom_entite} • <span className="uppercase">{r.secteur}</span> • {r.ville || "—"}
                        </div>
                        <div className="flex items-center gap-2">
                          {r._duplicate ? (
                            <span className="text-yellow-700 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" /> Doublon possible
                            </span>
                          ) : (
                            <span className="text-green-700 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" /> OK
                            </span>
                          )}
                        </div>
                      </div>
                      {(r._errors.length > 0 || r._warnings.length > 0) && (
                        <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {r._errors.length > 0 && (
                            <Textarea
                              value={`Erreurs: ${r._errors.join("; ")}`}
                              readOnly
                              className="text-red-700 bg-red-50 h-12"
                            />
                          )}
                          {r._warnings.length > 0 && (
                            <Textarea
                              value={`Avertissements: ${r._warnings.join("; ")}`}
                              readOnly
                              className="text-yellow-700 bg-yellow-50 h-12"
                            />
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                  />
                  Ignorer les doublons détectés
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMapped([])
                      setDryRunResult(null)
                    }}
                  >
                    Revenir au mapping
                  </Button>
                  <Button
                    onClick={runImport}
                    disabled={busy || mappedErrors > 0 || mapped.length === 0}
                  >
                    {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Importer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function stripTech(r: MappedRow): NormalizedRow {
  // remove internal fields, keep metadata
  const { _errors, _warnings, _duplicate, _resolved_commercial_id, ...rest } = r as any
  return rest
}

export default ExcelImporter
