import { supabaseAdmin } from "@/lib/supabase/server"

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  if (!id) return Response.json({ error: "id requis" }, { status: 400 })

  const { data: row, error: selErr } = await supabaseAdmin
    .from("prospect_contracts")
    .select("*")
    .eq("id", id)
    .single()

  if (selErr) return Response.json({ error: selErr.message }, { status: 500 })
  if (!row) return Response.json({ error: "Contrat introuvable" }, { status: 404 })

  // Delete file first (best-effort)
  await supabaseAdmin.storage.from(row.storage_bucket || "contracts").remove([row.storage_path])

  const { error: delErr } = await supabaseAdmin.from("prospect_contracts").delete().eq("id", id)
  if (delErr) return Response.json({ error: delErr.message }, { status: 500 })

  return Response.json({ ok: true })
}
