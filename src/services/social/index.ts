import { env } from '@/lib/env';
import { MockSocialAdapter } from './mockAdapter';
import { SupabaseSocialAdapter } from './supabaseAdapter';
import type { SocialAdapter } from './types';

function createSocialAdapter(): SocialAdapter {
  switch (env.VITE_SOCIAL_PROVIDER) {
    case 'supabase':
      return new SupabaseSocialAdapter();
    case 'mock':
    default:
      return new MockSocialAdapter();
  }
}

/**
 * The one social backend the whole app talks to. Defaults to a localStorage
 * mock (no account/keys). Set `VITE_SOCIAL_PROVIDER=supabase` to use the
 * Supabase adapter once supabase/schema.sql is applied — no UI changes.
 */
export const socialAdapter: SocialAdapter = createSocialAdapter();

export type {
  Profile,
  PostView,
  CommentView,
  ConversationView,
  MessageView,
  NotificationView,
  FeedPage,
  SearchResults,
  SocialAdapter,
} from './types';
