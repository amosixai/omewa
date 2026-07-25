import { beforeEach, describe, expect, it } from 'vitest';
import { MockAuthAdapter } from '@/services/auth/mockAdapter';
import { AuthError } from '@/services/auth/types';

const adapter = new MockAuthAdapter();
const creds = { email: 'Person@Example.com', password: 'Str0ngPass' };

describe('MockAuthAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('signs up a new user, normalizes email, and hides the password hash', async () => {
    const user = await adapter.signup(creds);
    expect(user.email).toBe('person@example.com');
    expect(user.id).toBeTruthy();
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('rejects a duplicate signup with an email_taken AuthError', async () => {
    await adapter.signup(creds);
    await expect(adapter.signup(creds)).rejects.toMatchObject({
      code: 'email_taken',
    });
    await expect(adapter.signup(creds)).rejects.toBeInstanceOf(AuthError);
  });

  it('logs in with correct credentials', async () => {
    await adapter.signup(creds);
    await adapter.logout();
    const user = await adapter.login(creds);
    expect(user.email).toBe('person@example.com');
  });

  it('rejects login with a wrong password', async () => {
    await adapter.signup(creds);
    await expect(
      adapter.login({ ...creds, password: 'WrongPass9' }),
    ).rejects.toMatchObject({ code: 'invalid_credentials' });
  });

  it('tracks the current session across signup, logout, and login', async () => {
    expect(await adapter.getCurrentUser()).toBeNull();
    await adapter.signup(creds);
    expect((await adapter.getCurrentUser())?.email).toBe('person@example.com');
    await adapter.logout();
    expect(await adapter.getCurrentUser()).toBeNull();
  });
});
