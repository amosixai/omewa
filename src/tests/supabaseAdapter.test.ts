import { describe, expect, it } from 'vitest';
import { SupabaseAuthAdapter } from '@/services/auth/supabaseAdapter';

describe('SupabaseAuthAdapter', () => {
  it('constructs without env (client is created lazily)', () => {
    expect(() => new SupabaseAuthAdapter()).not.toThrow();
  });

  it('fails loudly on use when Supabase env vars are missing', async () => {
    // Default (mock) test env sets no Supabase URL/key, so the first real call
    // must surface a clear configuration error rather than a vague crash.
    const adapter = new SupabaseAuthAdapter();
    await expect(
      adapter.login({ email: 'a@b.com', password: 'x' }),
    ).rejects.toThrow(/missing/i);
  });
});
