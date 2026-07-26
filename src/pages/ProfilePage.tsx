import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Grid3x3, LogOut, Settings } from 'lucide-react';
import { Avatar } from '@/components/social/Avatar';
import { PostGrid } from '@/components/social/PostGrid';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  useProfileById,
  useProfileByUsername,
  useToggleFollow,
  useUserPosts,
} from '@/hooks/useSocial';
import { authAdapter } from '@/services/auth';
import { socialAdapter } from '@/services/social';
import { useAuthStore } from '@/store/useAuthStore';
import { formatCount } from '@/lib/time';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-base font-semibold text-foreground">
        {formatCount(value)}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const toggleFollow = useToggleFollow();
  const [starting, setStarting] = useState(false);

  // Own profile (/profile) resolves by id; others (/u/:username) by handle.
  const byUsername = useProfileByUsername(username ?? '');
  const byId = useProfileById(username ? '' : (currentUser?.id ?? ''));
  const profileQuery = username ? byUsername : byId;
  const profile = profileQuery.data;

  const posts = useUserPosts(profile?.id ?? '');

  if (profileQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <p className="px-6 py-16 text-center text-sm text-muted-foreground">
        This account doesn’t exist.
      </p>
    );
  }

  const isOwn = profile.id === currentUser?.id;
  const isFollowing = Boolean(
    currentUser && profile.followers.includes(currentUser.id),
  );

  const handleLogout = async () => {
    await authAdapter.logout();
    clear();
    navigate('/login', { replace: true });
  };

  const handleMessage = async () => {
    if (!currentUser) return;
    setStarting(true);
    try {
      const id = await socialAdapter.startConversation(
        currentUser.id,
        profile.id,
      );
      navigate(`/messages/${id}`);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div>
      <header className="flex items-center justify-between px-4 pb-1 pt-3">
        <h1 className="flex items-center gap-1 text-lg font-semibold text-foreground">
          {profile.username}
        </h1>
        {isOwn && (
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="rounded-full p-1.5 text-foreground hover:bg-muted"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </header>

      <div className="flex items-center gap-5 px-4 py-3">
        <Avatar profile={profile} size="xl" />
        <div className="flex flex-1 justify-around">
          <Stat label="posts" value={profile.postCount} />
          <Stat label="followers" value={profile.followers.length} />
          <Stat label="following" value={profile.following.length} />
        </div>
      </div>

      <div className="px-4">
        <p className="text-sm font-semibold text-foreground">
          {profile.displayName}
        </p>
        {profile.bio && (
          <p className="mt-0.5 whitespace-pre-line text-sm text-foreground/90">
            {profile.bio}
          </p>
        )}
      </div>

      <div className="flex gap-2 px-4 py-4">
        {isOwn ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate('/profile/edit')}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Edit profile
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant={isFollowing ? 'outline' : 'default'}
              className="flex-1"
              disabled={toggleFollow.isPending}
              onClick={() => toggleFollow.mutate(profile.id)}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={starting}
              onClick={handleMessage}
            >
              Message
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center justify-center border-y border-border py-2 text-foreground">
        <Grid3x3 className="h-5 w-5" aria-hidden="true" />
      </div>

      {posts.isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <PostGrid
          posts={posts.data ?? []}
          empty={isOwn ? 'Share your first post ✨' : 'No posts yet.'}
        />
      )}

      {isOwn && (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">
          Signed in as{' '}
          <Link to="/profile/edit" className="underline">
            {currentUser?.email}
          </Link>
        </p>
      )}
    </div>
  );
}
