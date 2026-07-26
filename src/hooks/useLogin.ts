import { useMutation } from '@tanstack/react-query';
import { authAdapter } from '@/services/auth';
import type { AuthUser, Credentials } from '@/services/auth';

/**
 * Login mutation. Mirrors useSignup — TanStack Query owns the async lifecycle;
 * the component decides what to do onSuccess/onError.
 */
export function useLogin() {
  return useMutation<AuthUser, Error, Credentials>({
    mutationFn: (credentials) => authAdapter.login(credentials),
  });
}
