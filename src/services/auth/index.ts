import { env } from '@/lib/env';
import { isSupabaseConfigured } from '@/services/supabase/client';
import { MockAuthAdapter } from './mockAdapter';
import { SupabaseAuthAdapter } from './supabaseAdapter';
import type { AuthAdapter } from './types';

function createAuthAdapter(): AuthAdapter {
  if (env.VITE_AUTH_PROVIDER === 'supabase') {
    if (isSupabaseConfigured()) return new SupabaseAuthAdapter();
    // Env vars didn't reach the build: fall back to the mock so the site loads
    // instead of white-screening. Fix Vercel env vars + redeploy for real auth.
    console.warn(
      '[Amosix] VITE_AUTH_PROVIDER=supabase but Supabase env vars are missing — using the mock backend instead of failing.',
    );
  }
  return new MockAuthAdapter();
}

/** The one adapter instance the whole app talks to. */
export const authAdapter: AuthAdapter = createAuthAdapter();

export { AuthError } from './types';
export type {
  AuthAdapter,
  AuthUser,
  Credentials,
  AuthErrorCode,
} from './types';
