import { supabaseAdmin } from "@/lib/supabase/server"

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("commerciaux")
    .select("id, full_name, email, phone, region")
    .order("full_name", { ascending: true })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}
