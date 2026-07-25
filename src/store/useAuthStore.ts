import { create } from 'zustand';
import type { AuthUser } from '@/services/auth';

export type AuthStatus =
  'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  setUser: (user: AuthUser | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  setUser: (user) =>
    set({ user, status: user ? 'authenticated' : 'unauthenticated' }),
  clear: () => set({ user: null, status: 'unauthenticated' }),
}));
