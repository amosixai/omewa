import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, SendHorizontal } from 'lucide-react';
import { Avatar } from '@/components/social/Avatar';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
  useConversationPartner,
  useMessages,
  useSendMessage,
} from '@/hooks/useSocial';

export function ConversationPage() {
  const { conversationId = '' } = useParams();
  const { data: messages, isLoading } = useMessages(conversationId);
  const { data: partner } = useConversationPartner(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sendMessage.isPending) return;
    sendMessage.mutate(trimmed);
    setText('');
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col border-x border-border bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-card/90 px-3 py-2.5 backdrop-blur">
        <Link
          to="/messages"
          aria-label="Back to messages"
          className="rounded-full p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        {partner && (
          <Link
            to={`/u/${partner.username}`}
            className="flex items-center gap-2"
          >
            <Avatar profile={partner} size="sm" />
            <span className="text-sm font-semibold text-foreground">
              {partner.username}
            </span>
          </Link>
        )}
      </header>

      <div className="flex-1 space-y-2 px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          messages?.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.mine ? 'justify-end' : 'justify-start',
              )}
            >
              <p
                className={cn(
                  'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                  message.mine
                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-bl-sm bg-muted text-foreground',
                )}
              >
                {message.text}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={submit}
        className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-card px-3 py-2.5"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          aria-label="Message"
          className="rounded-full"
        />
        <button
          type="submit"
          disabled={!text.trim() || sendMessage.isPending}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <SendHorizontal className="h-5 w-5" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
