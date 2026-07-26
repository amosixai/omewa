import { cn } from '@/lib/utils';
import type { Profile } from '@/services/social';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
} as const;

interface AvatarProps {
  profile: Pick<Profile, 'displayName' | 'avatarColors'>;
  size?: keyof typeof SIZES;
  ring?: boolean;
  className?: string;
}

/**
 * Network-free avatar: a deterministic gradient with the user's initial. Looks
 * intentional everywhere and never 404s the way a broken image would.
 */
export function Avatar({
  profile,
  size = 'md',
  ring = false,
  className,
}: AvatarProps) {
  const initial = profile.displayName.trim().charAt(0).toUpperCase() || '?';
  const [from, to] = profile.avatarColors;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white',
        ring && 'ring-2 ring-offset-2 ring-offset-background ring-primary',
        SIZES[size],
        className,
      )}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
