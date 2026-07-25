import { AuthError } from './types';
import type { AuthAdapter, AuthUser, Credentials } from './types';

const USERS_KEY = 'amosix.users';
const SESSION_KEY = 'amosix.session';

// Zero delay under test for determinism; a small delay in the running app so
// loading states are real and visible.
const NETWORK_DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 600;

interface StoredUser extends AuthUser {
  passwordHash: string;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * djb2 — deliberately NOT real password hashing. Real hashing (bcrypt/argon2)
 * belongs on a server. This only keeps plaintext out of localStorage so the
 * demo doesn't model a terrible habit.
 */
function weakHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toPublicUser(user: StoredUser): AuthUser {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

/**
 * localStorage-backed auth. Fully functional and testable with no account,
 * no network, and no keys. Delete this file once a real backend is wired.
 */
export class MockAuthAdapter implements AuthAdapter {
  async signup({ email, password }: Credentials): Promise<AuthUser> {
    await delay(NETWORK_DELAY_MS);
    const normalized = email.trim().toLowerCase();
    const users = readUsers();

    if (users.some((user) => user.email === normalized)) {
      throw new AuthError(
        'An account with this email already exists.',
        'email_taken',
      );
    }

    const user: StoredUser = {
      id: crypto.randomUUID(),
      email: normalized,
      createdAt: new Date().toISOString(),
      passwordHash: weakHash(password),
    };
    writeUsers([...users, user]);
    localStorage.setItem(SESSION_KEY, user.id);
    return toPublicUser(user);
  }

  async login({ email, password }: Credentials): Promise<AuthUser> {
    await delay(NETWORK_DELAY_MS);
    const normalized = email.trim().toLowerCase();
    const user = readUsers().find(
      (candidate) => candidate.email === normalized,
    );
    if (!user || user.passwordHash !== weakHash(password)) {
      throw new AuthError('Invalid email or password.', 'invalid_credentials');
    }
    localStorage.setItem(SESSION_KEY, user.id);
    return toPublicUser(user);
  }

  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    const user = readUsers().find((candidate) => candidate.id === id);
    return user ? toPublicUser(user) : null;
  }
}
