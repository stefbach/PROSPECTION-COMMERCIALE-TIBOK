"use client"

import { createClient } from '@supabase/supabase-js'

/**
 * Client-side Supabase (anon) if you later need it in the browser.
 * Requires:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
let client: ReturnType<typeof createClient> | null = null

export function supabaseBrowser() {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.')
  }
  client = createClient(url, key)
  return client
}
