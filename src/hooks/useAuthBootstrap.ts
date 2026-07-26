import { useEffect } from 'react';
import { authAdapter } from '@/services/auth';
import { socialAdapter } from '@/services/social';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * On first mount, restore any existing session and make sure the signed-in user
 * has a social profile. Until this resolves the store status stays 'idle', so
 * the app can show a splash instead of flashing the login screen.
 */
export function useAuthBootstrap(): void {
  const setUser = useAuthStore((state) => state.setUser);
  const clear = useAuthStore((state) => state.clear);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await authAdapter.getCurrentUser();
        if (!active) return;
        if (user) {
          await socialAdapter.ensureProfile(user);
          if (active) setUser(user);
        } else {
          clear();
        }
      } catch {
        if (active) clear();
      }
    })();
    return () => {
      active = false;
    };
  }, [setUser, clear]);
}
