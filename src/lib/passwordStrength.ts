export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  score: StrengthLevel;
  /** Human-readable label; empty string for an empty password. */
  label: string;
  /** 0–100, for driving the meter width. */
  percent: number;
}

const LABELS: Record<StrengthLevel, string> = {
  0: 'Too weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
};

/**
 * Lightweight, dependency-free strength heuristic. Not a substitute for a
 * breached-password check on the server, but good enough to guide the user.
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: '', percent: 0 };
  }

  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/[0-9]/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;

  // Penalize obvious weaknesses.
  if (/(.)\1{2,}/.test(password)) points -= 1; // 3+ repeated chars
  if (/^[a-z]+$/i.test(password) || /^\d+$/.test(password)) points -= 1;

  let score = Math.max(0, Math.min(4, points)) as StrengthLevel;

  // A short password can never rate above "Weak", regardless of variety.
  if (password.length < 8 && score > 1) {
    score = 1;
  }

  return {
    score,
    label: LABELS[score],
    percent: (score / 4) * 100,
  };
}
