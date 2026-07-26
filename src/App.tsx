import { Link, Route, Routes } from 'react-router-dom';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/RouteGuards';
import { AppShell } from '@/components/layout/AppShell';
import { SignupPage } from '@/pages/SignupPage';
import { LoginPage } from '@/pages/LoginPage';
import { FeedPage } from '@/pages/FeedPage';
import { ExplorePage } from '@/pages/ExplorePage';
import { UploadPage } from '@/pages/UploadPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { ConversationPage } from '@/pages/ConversationPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { EditProfilePage } from '@/pages/EditProfilePage';
import { PostPage } from '@/pages/PostPage';
import { NotificationsPage } from '@/pages/NotificationsPage';

function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      <p className="text-5xl font-bold text-foreground">404</p>
      <p className="text-sm text-muted-foreground">This page doesn’t exist.</p>
      <Link
        to="/"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Back to feed
      </Link>
    </main>
  );
}

export function App() {
  useAuthBootstrap();

  return (
    <Routes>
      {/* Auth pages — signed-in users are bounced to the feed. */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Everything below requires a session. */}
      <Route element={<ProtectedRoute />}>
        {/* Full-screen DM thread — no bottom nav, like a chat app. */}
        <Route
          path="/messages/:conversationId"
          element={<ConversationPage />}
        />

        {/* The main app: feed-first, with bottom navigation. */}
        <Route element={<AppShell />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/u/:username" element={<ProfilePage />} />
          <Route path="/post/:postId" element={<PostPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
