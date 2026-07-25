import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { evaluatePasswordStrength } from '@/lib/passwordStrength';
import { cn } from '@/lib/utils';

const BAR_COLORS = [
  'bg-destructive',
  'bg-destructive',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
] as const;

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label, percent } = useMemo(
    () => evaluatePasswordStrength(password),
    [password],
  );

  if (!password) return null;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn('h-full rounded-full', BAR_COLORS[score])}
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Password strength:{' '}
        <span className="font-medium text-foreground">{label}</span>
      </p>
    </div>
  );
}
