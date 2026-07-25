import { useMutation } from '@tanstack/react-query';
import { authAdapter } from '@/services/auth';
import type { AuthUser, Credentials } from '@/services/auth';

/**
 * Signup mutation. TanStack Query owns the async lifecycle (isPending, error,
 * retry policy); the component decides what to do onSuccess/onError.
 */
export function useSignup() {
  return useMutation<AuthUser, Error, Credentials>({
    mutationFn: (credentials) => authAdapter.signup(credentials),
  });
}
