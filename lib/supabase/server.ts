import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase admin client using the Service Role (never expose to client).
 * Requires:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase admin credentials are not configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Ensure a storage bucket exists (idempotent).
 */
export async function ensureBucket(name: string) {
  const supabase = supabaseAdmin()
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets()
  if (listErr) throw listErr
  const exists = buckets?.some((b) => b.name === name)
  if (exists) return
  const { error: createErr } = await supabase.storage.createBucket(name, {
    public: false,
    fileSizeLimit: 50 * 1024 * 1024, // 50MB
  })
  if (createErr && !String(createErr.message).toLowerCase().includes('name already exists')) {
    throw createErr
  }
}
