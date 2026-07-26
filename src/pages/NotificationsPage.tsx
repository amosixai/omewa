import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { Avatar } from '@/components/social/Avatar';
import { Spinner } from '@/components/ui/spinner';
import { useNotifications } from '@/hooks/useSocial';
import { timeAgo } from '@/lib/time';
import type { NotificationType } from '@/services/social/types';

const ACTION: Record<NotificationType, string> = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'started following you',
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications();

  return (
    <div>
      <header className="sticky top-[57px] z-10 flex items-center gap-3 border-b border-border bg-card/90 px-3 py-2.5 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="rounded-full p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <h1 className="text-base font-semibold text-foreground">
          Notifications
        </h1>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Bell className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            No notifications yet. Post something to get noticed ✨
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {data?.map((notif) => (
            <li key={notif.id}>
              <div className="flex items-center gap-3 px-4 py-3">
                <Link to={`/u/${notif.actor.username}`}>
                  <Avatar profile={notif.actor} size="md" />
                </Link>
                <p className="flex-1 text-sm text-foreground">
                  <Link
                    to={`/u/${notif.actor.username}`}
                    className="font-semibold hover:underline"
                  >
                    {notif.actor.username}
                  </Link>{' '}
                  <span className="text-foreground/90">
                    {ACTION[notif.type]}
                  </span>{' '}
                  <span className="text-muted-foreground">
                    · {timeAgo(notif.createdAt)}
                  </span>
                </p>
                {notif.postId && (
                  <Link
                    to={`/post/${notif.postId}`}
                    className="text-xs font-medium text-primary"
                  >
                    View
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
