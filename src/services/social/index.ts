import { env } from '@/lib/env';
import { isSupabaseConfigured } from '@/services/supabase/client';
import { MockSocialAdapter } from './mockAdapter';
import { SupabaseSocialAdapter } from './supabaseAdapter';
import type { SocialAdapter } from './types';

function createSocialAdapter(): SocialAdapter {
  if (env.VITE_SOCIAL_PROVIDER === 'supabase') {
    if (isSupabaseConfigured()) return new SupabaseSocialAdapter();
    // Misconfigured deploy (env vars didn't reach the build): don't crash the
    // whole site — run on the mock so the app still loads. Fix the Vercel env
    // vars + redeploy to switch to the real database.
    console.warn(
      '[Amosix] VITE_SOCIAL_PROVIDER=supabase but Supabase env vars are missing — using the mock backend instead of failing.',
    );
  }
  return new MockSocialAdapter();
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
