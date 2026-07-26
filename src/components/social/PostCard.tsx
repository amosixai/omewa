import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, Heart, MessageCircle, Send } from 'lucide-react';
import { Avatar } from '@/components/social/Avatar';
import { useToggleLike } from '@/hooks/useSocial';
import { formatCount, timeAgo } from '@/lib/time';
import { cn } from '@/lib/utils';
import type { PostView } from '@/services/social';

function VerifiedBadge() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 text-primary"
      aria-label="Verified"
    >
      <path
        fill="currentColor"
        d="M12 1.5l2.6 1.9 3.2-.2 1 3 2.7 1.7-1 3 1 3-2.7 1.7-1 3-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3L2.5 16l1-3-1-3 2.7-1.7 1-3 3.2.2L12 1.5z"
      />
      <path
        fill="var(--color-card)"
        d="M10.6 14.6l-2.2-2.2 1.1-1.1 1.1 1.1 3-3 1.1 1.1-4.1 4.1z"
      />
    </svg>
  );
}

export function PostCard({ post }: { post: PostView }) {
  const toggleLike = useToggleLike();
  const [burst, setBurst] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [shared, setShared] = useState(false);

  const gradient = `linear-gradient(135deg, ${post.author.avatarColors[0]}, ${post.author.avatarColors[1]})`;

  const like = () => toggleLike.mutate(post.id);

  const doubleTapLike = () => {
    if (!post.likedByMe) like();
    setBurst(true);
    window.setTimeout(() => setBurst(false), 650);
  };

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Amosix', url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
    setShared(true);
    window.setTimeout(() => setShared(false), 1500);
  };

  return (
    <article className="border-b border-border pb-2">
      <header className="flex items-center gap-3 px-4 py-3">
        <Link to={`/u/${post.author.username}`}>
          <Avatar profile={post.author} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/u/${post.author.username}`}
            className="flex items-center gap-1 text-sm font-semibold text-foreground hover:underline"
          >
            <span className="truncate">{post.author.username}</span>
            {post.author.verified && <VerifiedBadge />}
          </Link>
        </div>
        <time className="text-xs text-muted-foreground">
          {timeAgo(post.createdAt)}
        </time>
      </header>

      <div
        className="relative aspect-[4/5] w-full overflow-hidden bg-muted"
        style={{ backgroundImage: gradient }}
        onDoubleClick={doubleTapLike}
      >
        {!imgFailed && (
          <img
            src={post.imageUrl}
            alt={`Post by ${post.author.displayName}`}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
            draggable={false}
          />
        )}
        <AnimatePresence>
          {burst && (
            <motion.div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.3 }}
            >
              <Heart className="h-24 w-24 fill-white text-white drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4 px-4 pt-3">
        <button
          type="button"
          onClick={like}
          aria-pressed={post.likedByMe}
          aria-label={post.likedByMe ? 'Unlike' : 'Like'}
          className="transition-transform active:scale-90"
        >
          <Heart
            className={cn(
              'h-7 w-7',
              post.likedByMe
                ? 'fill-rose-500 text-rose-500'
                : 'text-foreground',
            )}
          />
        </button>
        <Link to={`/post/${post.id}`} aria-label="Comments">
          <MessageCircle className="h-7 w-7 text-foreground" />
        </Link>
        <button
          type="button"
          onClick={share}
          aria-label="Share"
          className="transition-transform active:scale-90"
        >
          <Send className="h-7 w-7 text-foreground" />
        </button>
        <div
          className="ml-auto text-xs text-muted-foreground"
          aria-live="polite"
        >
          {shared && 'Link copied'}
        </div>
        <Bookmark className="h-7 w-7 text-foreground" aria-hidden="true" />
      </div>

      <div className="space-y-1 px-4 pt-2">
        <p className="text-sm font-semibold text-foreground">
          {formatCount(post.likeCount)}{' '}
          {post.likeCount === 1 ? 'like' : 'likes'}
        </p>
        <p className="text-sm text-foreground">
          <Link
            to={`/u/${post.author.username}`}
            className="font-semibold hover:underline"
          >
            {post.author.username}
          </Link>{' '}
          <span className="text-foreground/90">{post.caption}</span>
        </p>
        {post.commentCount > 0 && (
          <Link
            to={`/post/${post.id}`}
            className="block text-sm text-muted-foreground hover:underline"
          >
            View all {formatCount(post.commentCount)} comments
          </Link>
        )}
      </div>
    </article>
  );
}
