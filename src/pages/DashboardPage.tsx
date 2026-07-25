import { Navigate, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { authAdapter } from '@/services/auth';
import { Button } from '@/components/ui/button';

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);

  // Protected route: no session → back to signup.
  if (!user) {
    return <Navigate to="/signup" replace />;
  }

  const handleLogout = async () => {
    await authAdapter.logout();
    clear();
    navigate('/signup', { replace: true });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
        <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome, {user.email}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account is ready. This is a protected route.
        </p>
      </div>
      <Button variant="outline" onClick={handleLogout}>
        Sign out
      </Button>
    </main>
  );
}
