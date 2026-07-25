import { describe, expect, it } from 'vitest';
import { signupSchema } from '@/lib/validation';

const valid = {
  email: 'user@example.com',
  password: 'Str0ngPass',
  confirmPassword: 'Str0ngPass',
  acceptTerms: true,
};

describe('signupSchema', () => {
  it('accepts a valid signup', () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = signupSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a password missing an uppercase letter and digit', () => {
    const result = signupSchema.safeParse({
      ...valid,
      password: 'weakpassword',
      confirmPassword: 'weakpassword',
    });
    expect(result.success).toBe(false);
  });

  it('flags mismatched passwords on the confirmPassword field', () => {
    const result = signupSchema.safeParse({
      ...valid,
      confirmPassword: 'Different1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const onConfirm = result.error.issues.some((issue) =>
        issue.path.includes('confirmPassword'),
      );
      expect(onConfirm).toBe(true);
    }
  });

  it('requires accepting the terms', () => {
    const result = signupSchema.safeParse({ ...valid, acceptTerms: false });
    expect(result.success).toBe(false);
  });
});
