import { Spinner } from '@/components/ui/spinner';

/** Shown while the session is being restored, before we know where to route. */
export function Splash() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-sm">
        A
      </span>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Loading Amosix…
      </div>
    </main>
  );
}
