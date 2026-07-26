import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Avatar } from '@/components/social/Avatar';
import { Spinner } from '@/components/ui/spinner';
import { useConversations } from '@/hooks/useSocial';
import { timeAgo } from '@/lib/time';

export function MessagesPage() {
  const { data, isLoading } = useConversations();

  return (
    <div>
      <h1 className="border-b border-border px-4 py-3 text-lg font-semibold text-foreground">
        Messages
      </h1>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <MessageCircle
            className="h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            No conversations yet. Visit a profile and say hi 👋
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {data?.map((conv) => (
            <li key={conv.id}>
              <Link
                to={`/messages/${conv.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <Avatar profile={conv.otherUser} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {conv.otherUser.username}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {conv.lastMessage}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(conv.lastAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
