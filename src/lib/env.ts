import { z } from 'zod';

/**
 * Validated, typed access to the browser-exposed environment. Only VITE_*
 * variables exist in the bundle; anything else is undefined by design.
 */
const envSchema = z.object({
  VITE_AUTH_PROVIDER: z.enum(['mock', 'supabase']).default('mock'),
  VITE_SUPABASE_URL: z.string().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const result = envSchema.safeParse(import.meta.env);

if (!result.success) {
  // Surface config problems loudly in the console rather than failing silently.
  console.error(
    'Invalid environment configuration:',
    result.error.flatten().fieldErrors,
  );
}

export const env: Env = result.success
  ? result.data
  : { VITE_AUTH_PROVIDER: 'mock' };
