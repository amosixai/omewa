import { AuthError } from './types';
import type { AuthAdapter, AuthUser, Credentials } from './types';
import { getSupabaseClient } from '@/services/supabase/client';

/**
 * Supabase-backed auth. Activate by setting in .env:
 *
 *   VITE_AUTH_PROVIDER=supabase
 *   VITE_SUPABASE_URL=<your project URL>
 *   VITE_SUPABASE_ANON_KEY=<your anon/public key>
 *
 * A DB trigger (see supabase/schema.sql) creates the matching profile row on
 * signup, so no extra call is needed here. NOTE: written against the Supabase
 * JS API but not yet run against a live project — review before production.
 */
function toAuthUser(user: {
  id: string;
  email?: string;
  created_at?: string;
}): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

export class SupabaseAuthAdapter implements AuthAdapter {
  async signup({ email, password }: Credentials): Promise<AuthUser> {
    const { data, error } = await getSupabaseClient().auth.signUp({
      email,
      password,
    });
    if (error) throw new AuthError(error.message, 'unknown');
    if (!data.user) {
      // Email-confirmation projects return no session until the link is clicked.
      throw new AuthError(
        'Check your email to confirm your account, then log in.',
        'unknown',
      );
    }
    return toAuthUser(data.user);
  }

  async login({ email, password }: Credentials): Promise<AuthUser> {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      throw new AuthError('Invalid email or password.', 'invalid_credentials');
    }
    return toAuthUser(data.user);
  }

  async logout(): Promise<void> {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw new AuthError(error.message, 'unknown');
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data } = await getSupabaseClient().auth.getUser();
    return data.user ? toAuthUser(data.user) : null;
  }
}
