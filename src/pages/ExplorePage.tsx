import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Avatar } from '@/components/social/Avatar';
import { PostGrid } from '@/components/social/PostGrid';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useExplore, useSearch } from '@/hooks/useSocial';
import { formatCount } from '@/lib/time';

export function ExplorePage() {
  const [query, setQuery] = useState('');
  const explore = useExplore();
  const search = useSearch(query);
  const searching = query.trim().length > 0;

  return (
    <div>
      <div className="sticky top-[57px] z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators and posts"
            aria-label="Search"
            className="pl-9"
          />
        </div>
      </div>

      {!searching && (
        <>
          {explore.isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <PostGrid posts={explore.data ?? []} />
          )}
        </>
      )}

      {searching && (
        <div>
          {search.isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : (
            <>
              {(search.data?.users.length ?? 0) > 0 && (
                <ul className="divide-y divide-border">
                  {search.data?.users.map((user) => (
                    <li key={user.id}>
                      <Link
                        to={`/u/${user.username}`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50"
                      >
                        <Avatar profile={user} size="md" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {user.username}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.displayName} ·{' '}
                            {formatCount(user.followers.length)} followers
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <PostGrid posts={search.data?.posts ?? []} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
