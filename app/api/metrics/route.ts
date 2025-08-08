import { supabaseAdmin } from "@/lib/supabase/server"

export async function GET() {
  try {
    // total revenue in MUR (active contracts)
    const { data: revRows, error: revErr } = await supabaseAdmin
      .from("total_revenue_mur")
      .select("total_mur")
      .single()
    if (revErr) return Response.json({ error: revErr.message }, { status: 500 })

    // other simple metrics (optional)
    const [{ count: prospectsCount }, { count: activeContractsCount }] = await Promise.all([
      supabaseAdmin.from("prospects").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("prospect_contracts")
        .select("*", { count: "exact", head: true })
        .eq("status", "actif"),
    ])

    return Response.json({
      data: {
        revenueMur: Number(revRows?.total_mur ?? 0),
        prospects: prospectsCount ?? 0,
        activeContracts: activeContractsCount ?? 0,
      },
    })
  } catch (e: any) {
    return Response.json({ error: e?.message || "Server error" }, { status: 500 })
  }
}
