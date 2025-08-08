import { supabaseAdmin } from "@/lib/supabase/server"

async function ensureContractsBucket() {
  const { data: buckets, error: lbErr } = await supabaseAdmin.storage.listBuckets()
  if (lbErr) throw new Error(lbErr.message)
  const exists = (buckets || []).some((b) => b.name === "contracts")
  if (!exists) {
    const { error: cbErr } = await supabaseAdmin.storage.createBucket("contracts", {
      public: false,
      fileSizeLimit: "50mb",
    })
    if (cbErr && cbErr.message?.includes("already exists") === false) {
      throw new Error(cbErr.message)
    }
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const prospectId = searchParams.get("prospectId")
  if (!prospectId) return Response.json({ error: "prospectId requis" }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from("prospect_contracts")
    .select("*")
    .eq("prospect_id", prospectId)
    .order("created_at", { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Add signed URLs + revenue to date
  const enriched = await Promise.all(
    (data ?? []).map(async (row: any) => {
      const { data: urlData } = await supabaseAdmin.storage
        .from(row.storage_bucket || "contracts")
        .createSignedUrl(row.storage_path, 60 * 60)

      // compute teleconsultations since signed_at
      let consultationsCount = 0
      const { data: teleRows } = await supabaseAdmin
        .from("teleconsultations")
        .select("count, occurred_at")
        .eq("prospect_id", row.prospect_id)
        .gte("occurred_at", row.signed_at ?? "1970-01-01")
      consultationsCount = (teleRows || []).reduce((acc, r: any) => acc + (Number(r.count) || 0), 0)

      const fee = Number(row.fee_per_consultation_mur || 0)
      const revenueMur = Number((consultationsCount * fee).toFixed(2))

      return {
        ...row,
        signedUrl: urlData?.signedUrl ?? null,
        consultationsCount,
        revenueMur,
      }
    })
  )

  return Response.json({ data: enriched })
}

export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get("file") as File | null
  const prospectId = form.get("prospect_id") as string | null
  const fee = Number(form.get("fee_per_consultation_mur") || 0)
  if (!file || !prospectId) {
    return Response.json({ error: "file et prospect_id requis" }, { status: 400 })
  }

  await ensureContractsBucket()

  const safeName = file.name.replace(/[^\w.\-]+/g, "_")
  const path = `${prospectId}/${crypto.randomUUID()}-${safeName}`

  const { error: upErr } = await supabaseAdmin.storage.from("contracts").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  })
  if (upErr) return Response.json({ error: upErr.message }, { status: 500 })

  const insertPayload = {
    prospect_id: prospectId,
    file_name: safeName,
    file_type: file.type || null,
    storage_bucket: "contracts",
    storage_path: path,
    status: "actif",
    notes: null as string | null,
    fee_per_consultation_mur: isFinite(fee) ? fee : 0,
  }

  const { data, error } = await supabaseAdmin
    .from("prospect_contracts")
    .insert(insertPayload)
    .select("*")
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data: urlData } = await supabaseAdmin.storage.from("contracts").createSignedUrl(path, 60 * 60)

  return Response.json({ data: { ...data, signedUrl: urlData?.signedUrl ?? null } }, { status: 201 })
}
