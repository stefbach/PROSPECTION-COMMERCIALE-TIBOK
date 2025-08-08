import { supabaseAdmin } from "@/lib/supabase/server"

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

function norm(s: string | null | undefined) {
  if (!s) return ""
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    let rows: NormalizedRow[] = Array.isArray(body?.rows) ? body.rows : []
    const dryRun = !!body?.dryRun
    const skipDuplicates = !!body?.skipDuplicates

    if (!rows || rows.length === 0) {
      return Response.json({ error: "rows requis" }, { status: 400 })
    }
    if (rows.length > 1000) {
      rows = rows.slice(0, 1000)
    }

    // Prefetch commerciaux for mapping
    const { data: commerciaux, error: comErr } = await supabaseAdmin
      .from("commerciaux")
      .select("id, full_name, email")
    if (comErr) return Response.json({ error: comErr.message }, { status: 500 })

    // Helper maps
    const byEmail = new Map<string, string>()
    const byName = new Map<string, string>()
    for (const c of commerciaux || []) {
      if (c.email) byEmail.set(norm(c.email), c.id)
      if (c.full_name) byName.set(norm(c.full_name), c.id)
    }

    // Detect duplicates one by one (acceptable for <=1000)
    const results: { _duplicate: boolean; _resolved_commercial_id: string | null; _warnings?: string[] }[] = []
    const payloads: any[] = []

    for (const r of rows) {
      const nameKey = norm(r.nom_entite)
      const cityKey = norm(r.ville || "")
      let duplicate = false

      if (nameKey) {
        const { data: existing, error: exErr } = await supabaseAdmin
          .from("prospects")
          .select("id, nom_entite, ville")
          .ilike("nom_entite", r.nom_entite)
          .limit(50)

        if (exErr) {
          return Response.json({ error: exErr.message }, { status: 500 })
        }
        if ((existing || []).some((e) => norm(e.nom_entite) === nameKey && norm(e.ville || "") === cityKey)) {
          duplicate = true
        }
      }

      // Resolve commercial id
      let resolved: string | null = null
      if (r.commercial_email) {
        resolved = byEmail.get(norm(r.commercial_email)) || null
      }
      if (!resolved && r.commercial_name) {
        resolved = byName.get(norm(r.commercial_name)) || null
      }

      const warnings: string[] = []
      if ((r.commercial_email || r.commercial_name) && !resolved) {
        warnings.push("Commercial introuvable (email/nom)")
      }

      results.push({ _duplicate: duplicate, _resolved_commercial_id: resolved, _warnings: warnings })

      const insertRow = {
        nom_entite: r.nom_entite,
        secteur: r.secteur,
        ville: r.ville ?? null,
        statut: r.statut ?? "nouveau",
        region: r.region ?? null,
        contact_nom: r.contact_nom ?? null,
        telephone: r.telephone ?? null,
        email: r.email ?? null,
        site_web: r.site_web ?? null,
        adresse: r.adresse ?? null,
        code_postal: r.code_postal ?? null,
        score_interet: typeof r.score_interet === "number" ? r.score_interet : 3,
        suivi_statut: "a_suivre",
        suivi_score: 50,
        commercial_id: resolved,
        metadata: r.metadata ?? {},
      }

      if (!duplicate || (duplicate && !skipDuplicates && !dryRun)) {
        payloads.push({ insertRow, duplicate })
      } else {
        // duplicate with skip → not added
      }
    }

    if (dryRun) {
      const stats = {
        total: rows.length,
        duplicates: results.filter((r) => r._duplicate).length,
        resolvableCommercials: results.filter((r) => r._resolved_commercial_id).length,
      }
      // return rows enriched only with technical fields, the client merges warnings
      return Response.json({
        rows: results,
        stats,
      })
    }

    // Perform inserts in chunks
    let inserted = 0
    const chunkSize = 100
    for (let i = 0; i < payloads.length; i += chunkSize) {
      const batch = payloads.slice(i, i + chunkSize).map((p) => p.insertRow)
      if (batch.length === 0) continue
      const { error } = await supabaseAdmin.from("prospects").insert(batch)
      if (error) {
        return Response.json({ error: error.message, stats: { inserted } }, { status: 500 })
      }
      inserted += batch.length
    }

    return Response.json({
      ok: true,
      stats: { total: rows.length, toInsert: payloads.length, inserted },
    })
  } catch (e: any) {
    return Response.json({ error: e?.message || "Erreur serveur" }, { status: 500 })
  }
}
