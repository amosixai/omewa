import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * One browser Supabase client for the whole app. Created lazily so that when
 * the mock provider is active (the default), a missing URL/key never throws —
 * only the Supabase adapters call this.
 *
 * The anon key is safe to expose in the browser; RLS policies (see
 * `supabase/schema.sql`) are what actually protect the data. NEVER put the
 * service_role key in a VITE_* variable.
 */
let client: SupabaseClient | null = null;

/** True only when both Supabase env vars are present and non-empty. */
export function isSupabaseConfigured(): boolean {
  return Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);
}

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;
  const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = env;
  if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase is selected but VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing. Set them in .env.',
    );
  }
  client = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
  return client;
}
