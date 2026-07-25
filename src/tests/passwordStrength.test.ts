import { describe, expect, it } from 'vitest';
import { evaluatePasswordStrength } from '@/lib/passwordStrength';

describe('evaluatePasswordStrength', () => {
  it('returns an empty result for an empty string', () => {
    const result = evaluatePasswordStrength('');
    expect(result.score).toBe(0);
    expect(result.percent).toBe(0);
    expect(result.label).toBe('');
  });

  it('rates a short simple password as weak', () => {
    const result = evaluatePasswordStrength('abc');
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('caps a short-but-complex password at weak', () => {
    const result = evaluatePasswordStrength('Aa1!');
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('rates a long, varied password as strong', () => {
    const result = evaluatePasswordStrength('Str0ng!Pass99xy');
    expect(result.score).toBe(4);
    expect(result.percent).toBe(100);
  });

  it('always stays within the 0–4 range', () => {
    const result = evaluatePasswordStrength(`${'A'.repeat(40)}a1!`);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(4);
  });
});
