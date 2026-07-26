import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { PostCard } from '@/components/social/PostCard';
import { Avatar } from '@/components/social/Avatar';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { useFeed } from '@/hooks/useSocial';
import type { Profile } from '@/services/social';

function StoriesBar({ authors }: { authors: Profile[] }) {
  if (authors.length === 0) return null;
  return (
    <div className="flex gap-4 overflow-x-auto border-b border-border px-4 py-3">
      {authors.map((author) => (
        <Link
          key={author.id}
          to={`/u/${author.username}`}
          className="flex w-16 shrink-0 flex-col items-center gap-1"
        >
          <span className="rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-500 p-[2px]">
            <span className="block rounded-full bg-background p-[2px]">
              <Avatar profile={author} size="lg" />
            </span>
          </span>
          <span className="w-full truncate text-center text-[11px] text-muted-foreground">
            {author.username}
          </span>
        </Link>
      ))}
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="animate-pulse border-b border-border pb-4">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="h-3 w-24 rounded bg-muted" />
      </div>
      <div className="aspect-[4/5] w-full bg-muted" />
      <div className="space-y-2 px-4 pt-3">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
      </div>
    </div>
  );
}

export function FeedPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed();

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) ?? [],
    [data],
  );

  const storyAuthors = useMemo(() => {
    const seen = new Map<string, Profile>();
    posts.forEach((post) => {
      if (!seen.has(post.author.id)) seen.set(post.author.id, post.author);
    });
    return [...seen.values()].slice(0, 12);
  }, [posts]);

  // Infinite scroll: fetch the next page when the sentinel scrolls into view.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observe = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node;
  }, []);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, posts.length]);

  if (isLoading) {
    return (
      <div>
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          We couldn’t load your feed.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Your feed is empty. Follow some creators to get started.
        </p>
        <Link
          to="/explore"
          className="inline-flex h-9 items-center rounded-md border border-input px-3 text-sm font-medium hover:bg-muted"
        >
          Explore
        </Link>
      </div>
    );
  }

  return (
    <div>
      <StoriesBar authors={storyAuthors} />
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      <div ref={observe} className="h-10" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}
      {!hasNextPage && (
        <p className="py-8 text-center text-xs text-muted-foreground">
          You’re all caught up ✨
        </p>
      )}
    </div>
  );
}
