import { Link } from 'react-router-dom';
import type { PostView } from '@/services/social';

/** Instagram-style 3-column thumbnail grid. */
export function PostGrid({
  posts,
  empty = 'Nothing here yet.',
}: {
  posts: PostView[];
  empty?: string;
}) {
  if (posts.length === 0) {
    return (
      <p className="px-6 py-16 text-center text-sm text-muted-foreground">
        {empty}
      </p>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post) => (
        <Link
          key={post.id}
          to={`/post/${post.id}`}
          className="relative aspect-square overflow-hidden bg-muted"
          style={{
            backgroundImage: `linear-gradient(135deg, ${post.author.avatarColors[0]}, ${post.author.avatarColors[1]})`,
          }}
        >
          <img
            src={post.imageUrl}
            alt={post.caption}
            loading="lazy"
            className="h-full w-full object-cover transition-opacity hover:opacity-90"
            onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
          />
        </Link>
      ))}
    </div>
  );
}
