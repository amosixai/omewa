import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Splash } from '@/components/Splash';

/** Gate for signed-in areas: wait for bootstrap, then require a session. */
export function ProtectedRoute() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === 'idle') return <Splash />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

/** Gate for auth pages: signed-in users skip straight to the feed. */
export function PublicOnlyRoute() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  if (status === 'idle') return <Splash />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
