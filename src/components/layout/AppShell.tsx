import { Link, Outlet } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { BottomNav } from './BottomNav';

function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
      <Link to="/" className="flex items-center gap-2" aria-label="Amosix home">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          A
        </span>
        <span className="bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-xl font-bold tracking-tight text-transparent">
          Amosix
        </span>
      </Link>
      <Link
        to="/notifications"
        aria-label="Notifications"
        className="rounded-full p-1.5 text-foreground transition-colors hover:bg-muted"
      >
        <Heart className="h-6 w-6" aria-hidden="true" />
      </Link>
    </header>
  );
}

/**
 * Mobile-first shell: a centered app column with a sticky top bar and bottom
 * nav, à la Instagram/TikTok. Pages render into the Outlet.
 */
export function AppShell() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col border-x border-border bg-background">
      <TopBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
