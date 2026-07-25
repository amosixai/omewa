import { Navigate, Route, Routes } from 'react-router-dom';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';

function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <p className="text-5xl font-bold text-foreground">404</p>
      <p className="text-sm text-muted-foreground">This page doesn’t exist.</p>
      <a
        href="/signup"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Go to sign up
      </a>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signup" replace />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
