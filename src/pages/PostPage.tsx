import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Avatar } from '@/components/social/Avatar';
import { PostCard } from '@/components/social/PostCard';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useAddComment, useComments, usePost } from '@/hooks/useSocial';
import { timeAgo } from '@/lib/time';

export function PostPage() {
  const { postId = '' } = useParams();
  const navigate = useNavigate();
  const { data: post, isLoading } = usePost(postId);
  const { data: comments } = useComments(postId);
  const addComment = useAddComment(postId);
  const [text, setText] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || addComment.isPending) return;
    addComment.mutate(trimmed);
    setText('');
  };

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
        <h1 className="text-base font-semibold text-foreground">Post</h1>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : !post ? (
        <p className="px-6 py-16 text-center text-sm text-muted-foreground">
          This post is no longer available.
        </p>
      ) : (
        <>
          <PostCard post={post} />

          <section className="px-4 py-3">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Comments
            </h2>
            {(comments?.length ?? 0) === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No comments yet. Be the first.
              </p>
            ) : (
              <ul className="space-y-3">
                {comments?.map((comment) => (
                  <li key={comment.id} className="flex items-start gap-3">
                    <Link to={`/u/${comment.author.username}`}>
                      <Avatar profile={comment.author} size="sm" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        <Link
                          to={`/u/${comment.author.username}`}
                          className="font-semibold hover:underline"
                        >
                          {comment.author.username}
                        </Link>{' '}
                        <span className="text-foreground/90">
                          {comment.text}
                        </span>
                      </p>
                      <time className="text-xs text-muted-foreground">
                        {timeAgo(comment.createdAt)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form
            onSubmit={submit}
            className="flex items-center gap-2 border-t border-border bg-card px-3 py-2.5"
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment…"
              aria-label="Add a comment"
              className="rounded-full"
            />
            <button
              type="submit"
              disabled={!text.trim() || addComment.isPending}
              className="shrink-0 px-2 text-sm font-semibold text-primary disabled:opacity-40"
            >
              Post
            </button>
          </form>
        </>
      )}
    </div>
  );
}
