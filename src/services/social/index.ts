import { MockSocialAdapter } from './mockAdapter';
import type { SocialAdapter } from './types';

/**
 * The one social backend the whole app talks to. Today it's localStorage-backed
 * so the app is fully functional with no account or keys. To go live, implement
 * `SocialAdapter` against Supabase and swap the line below — no UI changes.
 */
export const socialAdapter: SocialAdapter = new MockSocialAdapter();

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
