import { supabaseAdmin } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const secteur = searchParams.get("secteur") || ""
  const statut = searchParams.get("statut") || ""
  const region = searchParams.get("region") || ""
  const q = searchParams.get("q") || ""

  let query = supabaseAdmin.from("prospects").select("*").order("created_at", { ascending: false })

  if (secteur) query = query.eq("secteur", secteur)
  if (statut) query = query.eq("statut", statut)
  if (region) query = query.eq("region", region)
  if (q) query = query.or(`nom_entite.ilike.%${q}%,ville.ilike.%${q}%`)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

export async function POST(req: Request) {
  const body = await req.json()
  // Minimal validation
  const payload = {
    nom_entite: body.nom_entite as string,
    secteur: body.secteur as string,
    ville: (body.ville as string) || null,
    statut: (body.statut as string) || "nouveau",
    region: (body.region as string) || null,
    contact_nom: (body.contact_nom as string) || null,
    telephone: (body.telephone as string) || null,
    email: (body.email as string) || null,
    site_web: (body.site_web as string) || null,
    adresse: (body.adresse as string) || null,
    code_postal: (body.code_postal as string) || null,
    score_interet: typeof body.score_interet === "number" ? body.score_interet : 3,
    suivi_statut: (body.suivi_statut as string) || "a_suivre",
    suivi_score: typeof body.suivi_score === "number" ? body.suivi_score : 50,
    commercial_id: (body.commercial_id as string) || null,
    metadata: body.metadata ?? {},
  }

  if (!payload.nom_entite || !payload.secteur) {
    return Response.json({ error: "nom_entite et secteur sont requis" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from("prospects").insert(payload).select("*").single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data }, { status: 201 })
}
