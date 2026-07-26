import {
  seedComments,
  seedConversations,
  seedNotifications,
  seedPosts,
  seedProfiles,
} from './seed';
import type {
  Comment,
  CommentView,
  Conversation,
  ConversationView,
  FeedPage,
  MessageView,
  Notification,
  NotificationView,
  Post,
  PostView,
  Profile,
  SearchResults,
  SocialAdapter,
} from './types';

const DB_KEY = 'amosix.social.v1';
const PAGE_SIZE = 4;
const NETWORK_DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 350;

interface Db {
  profiles: Profile[];
  posts: Post[];
  comments: Comment[];
  conversations: Conversation[];
  notifications: Notification[];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSeed(): Db {
  const profiles = seedProfiles();
  const posts = seedPosts(profiles);
  // Wire up a follow graph and post counts so profiles look inhabited.
  profiles.forEach((profile, i) => {
    profile.following = profiles
      .filter((_, j) => j !== i && (i + j) % 2 === 0)
      .map((p) => p.id);
    profile.postCount = posts.filter((p) => p.authorId === profile.id).length;
  });
  profiles.forEach((profile) => {
    profile.followers = profiles
      .filter((p) => p.following.includes(profile.id))
      .map((p) => p.id);
  });
  return {
    profiles,
    posts,
    comments: seedComments(posts, profiles),
    conversations: seedConversations(profiles),
    notifications: seedNotifications(),
  };
}

/**
 * localStorage-backed social backend. Fully functional with no account, no
 * network, no keys — same philosophy as MockAuthAdapter. Delete once Supabase
 * (or any real API) is wired behind the SocialAdapter interface.
 */
export class MockSocialAdapter implements SocialAdapter {
  private db: Db;

  constructor() {
    this.db = this.load();
  }

  private load(): Db {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw) as Db;
    } catch {
      /* fall through to fresh seed */
    }
    const seeded = buildSeed();
    this.persist(seeded);
    return seeded;
  }

  private persist(db: Db = this.db): void {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch {
      /* storage full or unavailable — keep working in-memory */
    }
  }

  private profile(id: string): Profile | undefined {
    return this.db.profiles.find((p) => p.id === id);
  }

  private toPostView(post: Post, currentUserId: string): PostView | null {
    const author = this.profile(post.authorId);
    if (!author) return null;
    return {
      id: post.id,
      author,
      caption: post.caption,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      likeCount: post.likes.length,
      commentCount: this.db.comments.filter((c) => c.postId === post.id).length,
      likedByMe: post.likes.includes(currentUserId),
    };
  }

  private sortedPosts(): Post[] {
    return [...this.db.posts].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async ensureProfile(user: { id: string; email: string }): Promise<Profile> {
    const existing = this.profile(user.id);
    if (existing) return existing;

    const local = user.email.split('@')[0] ?? user.email;
    const handle = local.replace(/[^a-z0-9_.]/gi, '') || 'you';
    let username = handle.toLowerCase();
    let n = 1;
    while (this.db.profiles.some((p) => p.username === username)) {
      username = `${handle.toLowerCase()}${n++}`;
    }

    const profile: Profile = {
      id: user.id,
      username,
      displayName: handle,
      bio: 'New to Amosix 👋',
      avatarColors: ['oklch(0.68 0.2 264)', 'oklch(0.62 0.2 320)'],
      followers: [],
      // Follow the seeded creators so the new user's feed isn't empty.
      following: this.db.profiles.slice(0, 4).map((p) => p.id),
      postCount: 0,
      verified: false,
    };
    this.db.profiles.forEach((p) => {
      if (profile.following.includes(p.id)) p.followers.push(profile.id);
    });
    this.db.profiles.push(profile);
    this.persist();
    return profile;
  }

  async getProfileById(id: string): Promise<Profile | null> {
    await delay(NETWORK_DELAY_MS);
    return this.profile(id) ?? null;
  }

  async getProfileByUsername(username: string): Promise<Profile | null> {
    await delay(NETWORK_DELAY_MS);
    return (
      this.db.profiles.find(
        (p) => p.username.toLowerCase() === username.toLowerCase(),
      ) ?? null
    );
  }

  async updateProfile(
    id: string,
    patch: Partial<Pick<Profile, 'displayName' | 'bio' | 'username'>>,
  ): Promise<Profile> {
    const profile = this.profile(id);
    if (!profile) throw new Error('Profile not found');
    if (patch.username) {
      const taken = this.db.profiles.some(
        (p) => p.id !== id && p.username === patch.username,
      );
      if (taken) throw new Error('That username is taken.');
    }
    Object.assign(profile, patch);
    this.persist();
    return profile;
  }

  async toggleFollow(
    targetId: string,
    currentUserId: string,
  ): Promise<Profile> {
    const target = this.profile(targetId);
    const me = this.profile(currentUserId);
    if (!target || !me || targetId === currentUserId) {
      throw new Error('Cannot follow this user.');
    }
    const isFollowing = me.following.includes(targetId);
    if (isFollowing) {
      me.following = me.following.filter((id) => id !== targetId);
      target.followers = target.followers.filter((id) => id !== currentUserId);
    } else {
      me.following.push(targetId);
      target.followers.push(currentUserId);
    }
    this.persist();
    return target;
  }

  async getFeed(
    cursor: number | null,
    currentUserId: string,
  ): Promise<FeedPage> {
    await delay(NETWORK_DELAY_MS);
    const start = cursor ?? 0;
    const all = this.sortedPosts();
    const slice = all.slice(start, start + PAGE_SIZE);
    const posts = slice
      .map((p) => this.toPostView(p, currentUserId))
      .filter((p): p is PostView => p !== null);
    const next = start + PAGE_SIZE;
    return { posts, nextCursor: next < all.length ? next : null };
  }

  async getExplore(currentUserId: string): Promise<PostView[]> {
    await delay(NETWORK_DELAY_MS);
    // "Trending" = most liked + commented, a naive engagement score.
    return this.sortedPosts()
      .map((p) => this.toPostView(p, currentUserId))
      .filter((p): p is PostView => p !== null)
      .sort(
        (a, b) =>
          b.likeCount + b.commentCount * 3 - (a.likeCount + a.commentCount * 3),
      );
  }

  async getUserPosts(
    userId: string,
    currentUserId: string,
  ): Promise<PostView[]> {
    await delay(NETWORK_DELAY_MS);
    return this.sortedPosts()
      .filter((p) => p.authorId === userId)
      .map((p) => this.toPostView(p, currentUserId))
      .filter((p): p is PostView => p !== null);
  }

  async getPost(id: string, currentUserId: string): Promise<PostView | null> {
    await delay(NETWORK_DELAY_MS);
    const post = this.db.posts.find((p) => p.id === id);
    return post ? this.toPostView(post, currentUserId) : null;
  }

  async createPost(input: {
    authorId: string;
    caption: string;
    imageUrl: string;
  }): Promise<PostView> {
    await delay(NETWORK_DELAY_MS);
    const post: Post = {
      id: `p_${crypto.randomUUID()}`,
      authorId: input.authorId,
      caption: input.caption,
      imageUrl: input.imageUrl,
      createdAt: new Date().toISOString(),
      likes: [],
    };
    this.db.posts.push(post);
    const author = this.profile(input.authorId);
    if (author) author.postCount += 1;
    this.persist();
    const view = this.toPostView(post, input.authorId);
    if (!view) throw new Error('Failed to create post');
    return view;
  }

  async toggleLike(postId: string, currentUserId: string): Promise<PostView> {
    const post = this.db.posts.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');
    if (post.likes.includes(currentUserId)) {
      post.likes = post.likes.filter((id) => id !== currentUserId);
    } else {
      post.likes.push(currentUserId);
    }
    this.persist();
    const view = this.toPostView(post, currentUserId);
    if (!view) throw new Error('Post author missing');
    return view;
  }

  async getComments(postId: string): Promise<CommentView[]> {
    await delay(NETWORK_DELAY_MS);
    return this.db.comments
      .filter((c) => c.postId === postId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((c) => {
        const author = this.profile(c.authorId);
        return author
          ? { id: c.id, author, text: c.text, createdAt: c.createdAt }
          : null;
      })
      .filter((c): c is CommentView => c !== null);
  }

  async addComment(
    postId: string,
    authorId: string,
    text: string,
  ): Promise<CommentView> {
    await delay(NETWORK_DELAY_MS);
    const author = this.profile(authorId);
    if (!author) throw new Error('Profile not found');
    const comment: Comment = {
      id: `c_${crypto.randomUUID()}`,
      postId,
      authorId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    this.db.comments.push(comment);
    this.persist();
    return {
      id: comment.id,
      author,
      text: comment.text,
      createdAt: comment.createdAt,
    };
  }

  async getConversations(currentUserId: string): Promise<ConversationView[]> {
    await delay(NETWORK_DELAY_MS);
    return this.db.conversations
      .filter((c) => c.participantIds.includes(currentUserId))
      .map((conv) => {
        const otherId = conv.participantIds.find((id) => id !== currentUserId);
        const other = otherId ? this.profile(otherId) : undefined;
        const last = conv.messages[conv.messages.length - 1];
        if (!other) return null;
        return {
          id: conv.id,
          otherUser: other,
          lastMessage: last?.text ?? 'Say hi 👋',
          lastAt: last?.createdAt ?? new Date(0).toISOString(),
        };
      })
      .filter((c): c is ConversationView => c !== null)
      .sort(
        (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
      );
  }

  async getMessages(
    conversationId: string,
    currentUserId: string,
  ): Promise<MessageView[]> {
    await delay(NETWORK_DELAY_MS);
    const conv = this.db.conversations.find((c) => c.id === conversationId);
    if (!conv) return [];
    return conv.messages.map((m) => ({
      id: m.id,
      text: m.text,
      createdAt: m.createdAt,
      mine: m.senderId === currentUserId,
    }));
  }

  async getConversationPartner(
    conversationId: string,
    currentUserId: string,
  ): Promise<Profile | null> {
    await delay(NETWORK_DELAY_MS);
    const conv = this.db.conversations.find((c) => c.id === conversationId);
    if (!conv) return null;
    const otherId = conv.participantIds.find((id) => id !== currentUserId);
    return otherId ? (this.profile(otherId) ?? null) : null;
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
  ): Promise<MessageView> {
    await delay(NETWORK_DELAY_MS);
    const conv = this.db.conversations.find((c) => c.id === conversationId);
    if (!conv) throw new Error('Conversation not found');
    const message = {
      id: `m_${crypto.randomUUID()}`,
      conversationId,
      senderId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    conv.messages.push(message);
    this.persist();
    return {
      id: message.id,
      text: message.text,
      createdAt: message.createdAt,
      mine: true,
    };
  }

  async startConversation(
    currentUserId: string,
    otherId: string,
  ): Promise<string> {
    const existing = this.db.conversations.find(
      (c) =>
        c.participantIds.includes(currentUserId) &&
        c.participantIds.includes(otherId),
    );
    if (existing) return existing.id;
    const conv: Conversation = {
      id: `conv_${crypto.randomUUID()}`,
      participantIds: [currentUserId, otherId],
      messages: [],
    };
    this.db.conversations.push(conv);
    this.persist();
    return conv.id;
  }

  async getNotifications(currentUserId: string): Promise<NotificationView[]> {
    await delay(NETWORK_DELAY_MS);
    // Synthesize notifications from real engagement on the user's posts so the
    // screen is meaningful without a separate write path.
    const myPostIds = new Set(
      this.db.posts
        .filter((p) => p.authorId === currentUserId)
        .map((p) => p.id),
    );
    const notifs: NotificationView[] = [];

    this.db.posts
      .filter((p) => myPostIds.has(p.id))
      .forEach((post) => {
        post.likes
          .filter((id) => !id.startsWith('ghost') && id !== currentUserId)
          .slice(0, 3)
          .forEach((likerId) => {
            const actor = this.profile(likerId);
            if (actor) {
              notifs.push({
                id: `n_like_${post.id}_${likerId}`,
                type: 'like',
                actor,
                postId: post.id,
                createdAt: post.createdAt,
                read: false,
              });
            }
          });
      });

    this.db.profiles
      .find((p) => p.id === currentUserId)
      ?.followers.slice(0, 5)
      .forEach((followerId) => {
        const actor = this.profile(followerId);
        if (actor) {
          notifs.push({
            id: `n_follow_${followerId}`,
            type: 'follow',
            actor,
            createdAt: new Date(Date.now() - 3600_000).toISOString(),
            read: false,
          });
        }
      });

    return notifs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async search(query: string, currentUserId: string): Promise<SearchResults> {
    await delay(NETWORK_DELAY_MS);
    const q = query.trim().toLowerCase();
    if (!q) return { users: [], posts: [] };
    const users = this.db.profiles.filter(
      (p) =>
        p.id !== currentUserId &&
        (p.username.toLowerCase().includes(q) ||
          p.displayName.toLowerCase().includes(q)),
    );
    const posts = this.sortedPosts()
      .filter((p) => p.caption.toLowerCase().includes(q))
      .map((p) => this.toPostView(p, currentUserId))
      .filter((p): p is PostView => p !== null);
    return { users, posts };
  }
}
