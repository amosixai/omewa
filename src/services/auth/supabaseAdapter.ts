import { AuthError } from './types';
import type { AuthAdapter, AuthUser, Credentials } from './types';
import { env } from '@/lib/env';

/**
 * Supabase-backed adapter — READY, not wired. Its shape already matches
 * AuthAdapter, so activating it changes nothing else in the app:
 *
 *   1. npm install @supabase/supabase-js
 *   2. In .env:  VITE_AUTH_PROVIDER=supabase
 *                VITE_SUPABASE_URL=<your project URL>
 *                VITE_SUPABASE_ANON_KEY=<your anon/public key>
 *   3. Replace each `notWired()` body below with a real Supabase call, e.g.
 *
 *        import { createClient } from '@supabase/supabase-js';
 *        const client = createClient(url, anonKey);
 *        const { data, error } = await client.auth.signUp({ email, password });
 *
 * The anon key is safe for the browser. NEVER put the service_role key here.
 */
export class SupabaseAuthAdapter implements AuthAdapter {
  constructor() {
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
      throw new AuthError(
        'Supabase is selected but VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing.',
        'not_configured',
      );
    }
  }

  private notWired(): never {
    throw new AuthError(
      'SupabaseAuthAdapter is a stub. Install @supabase/supabase-js and implement its methods.',
      'not_configured',
    );
  }

  async signup(_credentials: Credentials): Promise<AuthUser> {
    return this.notWired();
  }

  async login(_credentials: Credentials): Promise<AuthUser> {
    return this.notWired();
  }

  async logout(): Promise<void> {
    this.notWired();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.notWired();
  }
}
