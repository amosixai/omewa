import { getSupabaseClient } from '@/services/supabase/client';
import type {
  CommentView,
  ConversationView,
  FeedPage,
  MessageView,
  NotificationType,
  NotificationView,
  PostView,
  Profile,
  SearchResults,
  SocialAdapter,
} from './types';

/**
 * Supabase-backed social backend implementing the same SocialAdapter interface
 * as the mock. Activate with `VITE_SOCIAL_PROVIDER=supabase` once the schema in
 * supabase/schema.sql is applied.
 *
 * IMPORTANT: written against the Supabase JS API and the shipped schema, but
 * NOT yet run against a live project. Review/QA before production. Counts are
 * derived via embedded aggregates; `likedByMe` is resolved with a second query.
 */

const PAGE_SIZE = 4;

const POST_SELECT =
  'id, caption, image_url, created_at, author:profiles!posts_author_id_fkey(*), likes(count), comments(count)';

interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_from: string;
  avatar_to: string;
  verified: boolean;
  created_at: string;
}

interface PostRow {
  id: string;
  caption: string;
  image_url: string;
  created_at: string;
  author: ProfileRow;
  likes: { count: number }[];
  comments: { count: number }[];
}

interface CommentRow {
  id: string;
  text: string;
  created_at: string;
  author: ProfileRow;
}

function liteProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarColors: [row.avatar_from, row.avatar_to],
    verified: row.verified,
    followers: [],
    following: [],
    postCount: 0,
  };
}

export class SupabaseSocialAdapter implements SocialAdapter {
  private get db() {
    return getSupabaseClient();
  }

  private async hydrateProfile(row: ProfileRow): Promise<Profile> {
    const [followers, following, posts] = await Promise.all([
      this.db.from('follows').select('follower_id').eq('following_id', row.id),
      this.db.from('follows').select('following_id').eq('follower_id', row.id),
      this.db
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', row.id),
    ]);
    return {
      ...liteProfile(row),
      followers: ((followers.data ?? []) as { follower_id: string }[]).map(
        (r) => r.follower_id,
      ),
      following: ((following.data ?? []) as { following_id: string }[]).map(
        (r) => r.following_id,
      ),
      postCount: posts.count ?? 0,
    };
  }

  private async toPostViews(
    rows: PostRow[],
    currentUserId: string,
  ): Promise<PostView[]> {
    const ids = rows.map((r) => r.id);
    const liked = new Set<string>();
    if (ids.length) {
      const { data } = await this.db
        .from('likes')
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', ids);
      ((data ?? []) as { post_id: string }[]).forEach((l) =>
        liked.add(l.post_id),
      );
    }
    return rows.map((r) => ({
      id: r.id,
      author: liteProfile(r.author),
      caption: r.caption,
      imageUrl: r.image_url,
      createdAt: r.created_at,
      likeCount: r.likes?.[0]?.count ?? 0,
      commentCount: r.comments?.[0]?.count ?? 0,
      likedByMe: liked.has(r.id),
    }));
  }

  async ensureProfile(user: { id: string; email: string }): Promise<Profile> {
    const existing = await this.getProfileById(user.id);
    if (existing) return existing;
    // Fallback if the signup trigger hasn't populated the row yet.
    const handle = (user.email.split('@')[0] ?? 'user').toLowerCase();
    const { data } = await this.db
      .from('profiles')
      .insert({ id: user.id, username: handle, display_name: handle })
      .select('*')
      .single();
    return this.hydrateProfile(data as unknown as ProfileRow);
  }

  async getProfileById(id: string): Promise<Profile | null> {
    const { data } = await this.db
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return data ? this.hydrateProfile(data as unknown as ProfileRow) : null;
  }

  async getProfileByUsername(username: string): Promise<Profile | null> {
    const { data } = await this.db
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    return data ? this.hydrateProfile(data as unknown as ProfileRow) : null;
  }

  async updateProfile(
    id: string,
    patch: Partial<Pick<Profile, 'displayName' | 'bio' | 'username'>>,
  ): Promise<Profile> {
    const row: Record<string, string> = {};
    if (patch.displayName !== undefined) row.display_name = patch.displayName;
    if (patch.bio !== undefined) row.bio = patch.bio;
    if (patch.username !== undefined) row.username = patch.username;
    const { data, error } = await this.db
      .from('profiles')
      .update(row)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return this.hydrateProfile(data as unknown as ProfileRow);
  }

  async toggleFollow(
    targetId: string,
    currentUserId: string,
  ): Promise<Profile> {
    const { data: existing } = await this.db
      .from('follows')
      .select('follower_id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetId)
      .maybeSingle();
    if (existing) {
      await this.db
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetId);
    } else {
      await this.db
        .from('follows')
        .insert({ follower_id: currentUserId, following_id: targetId });
    }
    const target = await this.getProfileById(targetId);
    if (!target) throw new Error('Profile not found');
    return target;
  }

  async getFeed(
    cursor: number | null,
    currentUserId: string,
  ): Promise<FeedPage> {
    const start = cursor ?? 0;
    const { data } = await this.db
      .from('posts')
      .select(POST_SELECT)
      .order('created_at', { ascending: false })
      .range(start, start + PAGE_SIZE - 1);
    const rows = (data ?? []) as unknown as PostRow[];
    const posts = await this.toPostViews(rows, currentUserId);
    return {
      posts,
      nextCursor: rows.length < PAGE_SIZE ? null : start + PAGE_SIZE,
    };
  }

  async getExplore(currentUserId: string): Promise<PostView[]> {
    const { data } = await this.db
      .from('posts')
      .select(POST_SELECT)
      .order('created_at', { ascending: false })
      .limit(60);
    const rows = (data ?? []) as unknown as PostRow[];
    const views = await this.toPostViews(rows, currentUserId);
    return views.sort(
      (a, b) =>
        b.likeCount + b.commentCount * 3 - (a.likeCount + a.commentCount * 3),
    );
  }

  async getUserPosts(
    userId: string,
    currentUserId: string,
  ): Promise<PostView[]> {
    const { data } = await this.db
      .from('posts')
      .select(POST_SELECT)
      .eq('author_id', userId)
      .order('created_at', { ascending: false });
    return this.toPostViews(
      (data ?? []) as unknown as PostRow[],
      currentUserId,
    );
  }

  async getPost(id: string, currentUserId: string): Promise<PostView | null> {
    const { data } = await this.db
      .from('posts')
      .select(POST_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (!data) return null;
    const [view] = await this.toPostViews(
      [data as unknown as PostRow],
      currentUserId,
    );
    return view ?? null;
  }

  async createPost(input: {
    authorId: string;
    caption: string;
    imageUrl: string;
  }): Promise<PostView> {
    const { data, error } = await this.db
      .from('posts')
      .insert({
        author_id: input.authorId,
        caption: input.caption,
        image_url: input.imageUrl,
      })
      .select(POST_SELECT)
      .single();
    if (error) throw new Error(error.message);
    const [view] = await this.toPostViews(
      [data as unknown as PostRow],
      input.authorId,
    );
    if (!view) throw new Error('Failed to create post');
    return view;
  }

  async toggleLike(postId: string, currentUserId: string): Promise<PostView> {
    const { data: existing } = await this.db
      .from('likes')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', currentUserId)
      .maybeSingle();
    if (existing) {
      await this.db
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', currentUserId);
    } else {
      await this.db
        .from('likes')
        .insert({ post_id: postId, user_id: currentUserId });
    }
    const view = await this.getPost(postId, currentUserId);
    if (!view) throw new Error('Post not found');
    return view;
  }

  async getComments(postId: string): Promise<CommentView[]> {
    const { data } = await this.db
      .from('comments')
      .select(
        'id, text, created_at, author:profiles!comments_author_id_fkey(*)',
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    return ((data ?? []) as unknown as CommentRow[]).map((c) => ({
      id: c.id,
      author: liteProfile(c.author),
      text: c.text,
      createdAt: c.created_at,
    }));
  }

  async addComment(
    postId: string,
    authorId: string,
    text: string,
  ): Promise<CommentView> {
    const { data, error } = await this.db
      .from('comments')
      .insert({ post_id: postId, author_id: authorId, text })
      .select(
        'id, text, created_at, author:profiles!comments_author_id_fkey(*)',
      )
      .single();
    if (error) throw new Error(error.message);
    const row = data as unknown as CommentRow;
    return {
      id: row.id,
      author: liteProfile(row.author),
      text: row.text,
      createdAt: row.created_at,
    };
  }

  async getConversations(currentUserId: string): Promise<ConversationView[]> {
    const { data: parts } = await this.db
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);
    const convIds = ((parts ?? []) as { conversation_id: string }[]).map(
      (p) => p.conversation_id,
    );
    if (!convIds.length) return [];

    const [others, messages] = await Promise.all([
      this.db
        .from('conversation_participants')
        .select(
          'conversation_id, profiles!conversation_participants_user_id_fkey(*)',
        )
        .in('conversation_id', convIds)
        .neq('user_id', currentUserId),
      this.db
        .from('messages')
        .select('conversation_id, text, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false }),
    ]);

    const otherRows = (others.data ?? []) as unknown as {
      conversation_id: string;
      profiles: ProfileRow;
    }[];
    const msgRows = (messages.data ?? []) as {
      conversation_id: string;
      text: string;
      created_at: string;
    }[];

    const lastByConv = new Map<string, { text: string; created_at: string }>();
    msgRows.forEach((m) => {
      if (!lastByConv.has(m.conversation_id)) {
        lastByConv.set(m.conversation_id, {
          text: m.text,
          created_at: m.created_at,
        });
      }
    });

    return otherRows
      .map((row) => {
        const last = lastByConv.get(row.conversation_id);
        return {
          id: row.conversation_id,
          otherUser: liteProfile(row.profiles),
          lastMessage: last?.text ?? 'Say hi 👋',
          lastAt: last?.created_at ?? new Date(0).toISOString(),
        };
      })
      .sort(
        (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
      );
  }

  async getMessages(
    conversationId: string,
    currentUserId: string,
  ): Promise<MessageView[]> {
    const { data } = await this.db
      .from('messages')
      .select('id, sender_id, text, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    return (
      (data ?? []) as {
        id: string;
        sender_id: string;
        text: string;
        created_at: string;
      }[]
    ).map((m) => ({
      id: m.id,
      text: m.text,
      createdAt: m.created_at,
      mine: m.sender_id === currentUserId,
    }));
  }

  async getConversationPartner(
    conversationId: string,
    currentUserId: string,
  ): Promise<Profile | null> {
    const { data } = await this.db
      .from('conversation_participants')
      .select('profiles!conversation_participants_user_id_fkey(*)')
      .eq('conversation_id', conversationId)
      .neq('user_id', currentUserId)
      .maybeSingle();
    const row = data as unknown as { profiles: ProfileRow } | null;
    return row ? liteProfile(row.profiles) : null;
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
  ): Promise<MessageView> {
    const { data, error } = await this.db
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, text })
      .select('id, text, created_at')
      .single();
    if (error) throw new Error(error.message);
    const row = data as unknown as {
      id: string;
      text: string;
      created_at: string;
    };
    return {
      id: row.id,
      text: row.text,
      createdAt: row.created_at,
      mine: true,
    };
  }

  async startConversation(
    currentUserId: string,
    otherId: string,
  ): Promise<string> {
    const { data: mine } = await this.db
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);
    const myIds = ((mine ?? []) as { conversation_id: string }[]).map(
      (r) => r.conversation_id,
    );
    if (myIds.length) {
      const { data: shared } = await this.db
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherId)
        .in('conversation_id', myIds);
      const existing = (shared ?? []) as { conversation_id: string }[];
      if (existing[0]) return existing[0].conversation_id;
    }

    const { data: conv, error } = await this.db
      .from('conversations')
      .insert({})
      .select('id')
      .single();
    if (error || !conv) throw new Error(error?.message ?? 'Cannot start chat');
    const conversationId = (conv as { id: string }).id;
    await this.db.from('conversation_participants').insert([
      { conversation_id: conversationId, user_id: currentUserId },
      { conversation_id: conversationId, user_id: otherId },
    ]);
    return conversationId;
  }

  async getNotifications(currentUserId: string): Promise<NotificationView[]> {
    const { data } = await this.db
      .from('notifications')
      .select(
        'id, type, post_id, created_at, read, actor:profiles!notifications_actor_id_fkey(*)',
      )
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });
    return (
      (data ?? []) as unknown as {
        id: string;
        type: NotificationType;
        post_id: string | null;
        created_at: string;
        read: boolean;
        actor: ProfileRow;
      }[]
    ).map((n) => ({
      id: n.id,
      type: n.type,
      actor: liteProfile(n.actor),
      postId: n.post_id ?? undefined,
      createdAt: n.created_at,
      read: n.read,
    }));
  }

  async search(query: string, currentUserId: string): Promise<SearchResults> {
    const q = query.trim();
    if (!q) return { users: [], posts: [] };
    const [users, posts] = await Promise.all([
      this.db
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(20),
      this.db
        .from('posts')
        .select(POST_SELECT)
        .ilike('caption', `%${q}%`)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);
    const userProfiles = await Promise.all(
      ((users.data ?? []) as unknown as ProfileRow[]).map((row) =>
        this.hydrateProfile(row),
      ),
    );
    const postViews = await this.toPostViews(
      (posts.data ?? []) as unknown as PostRow[],
      currentUserId,
    );
    return { users: userProfiles, posts: postViews };
  }
}
