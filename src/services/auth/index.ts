import { env } from '@/lib/env';
import { MockAuthAdapter } from './mockAdapter';
import { SupabaseAuthAdapter } from './supabaseAdapter';
import type { AuthAdapter } from './types';

function createAuthAdapter(): AuthAdapter {
  switch (env.VITE_AUTH_PROVIDER) {
    case 'supabase':
      return new SupabaseAuthAdapter();
    case 'mock':
    default:
      return new MockAuthAdapter();
  }
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
