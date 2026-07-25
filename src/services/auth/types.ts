export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface Credentials {
  email: string;
  password: string;
}

/**
 * The single seam every backend implements. Swap MockAuthAdapter for
 * SupabaseAuthAdapter (or Firebase / a custom API) without touching any UI,
 * state, or hook — they all depend on this interface, never a concrete class.
 */
export interface AuthAdapter {
  signup(credentials: Credentials): Promise<AuthUser>;
  login(credentials: Credentials): Promise<AuthUser>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
}

export type AuthErrorCode =
  'email_taken' | 'invalid_credentials' | 'not_configured' | 'unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(message: string, code: AuthErrorCode = 'unknown') {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}
