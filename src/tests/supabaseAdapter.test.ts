import { describe, expect, it } from 'vitest';
import { SupabaseAuthAdapter } from '@/services/auth/supabaseAdapter';

describe('SupabaseAuthAdapter', () => {
  it('refuses to construct when Supabase env vars are missing', () => {
    // Default (mock) env sets no Supabase URL/key, so the guard must fire.
    expect(() => new SupabaseAuthAdapter()).toThrowError(/missing/i);
  });
});
