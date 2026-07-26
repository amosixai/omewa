/**
 * The social domain. Every screen talks to the `SocialAdapter` interface, never
 * a concrete class — mirroring the auth seam. Swap `MockSocialAdapter` for a
 * Supabase-backed one later without touching a single component.
 */

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  /** Two oklch stops for the avatar gradient — deterministic, no network. */
  avatarColors: [string, string];
  followers: string[];
  following: string[];
  postCount: number;
  verified: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  caption: string;
  imageUrl: string;
  createdAt: string;
  likes: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  messages: Message[];
}

export type NotificationType = 'like' | 'comment' | 'follow';

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: NotificationType;
  postId?: string;
  createdAt: string;
  read: boolean;
}

/* ---- View models the UI consumes (denormalized, ready to render) ---- */

export interface PostView {
  id: string;
  author: Profile;
  caption: string;
  imageUrl: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

export interface CommentView {
  id: string;
  author: Profile;
  text: string;
  createdAt: string;
}

export interface ConversationView {
  id: string;
  otherUser: Profile;
  lastMessage: string;
  lastAt: string;
}

export interface MessageView {
  id: string;
  text: string;
  createdAt: string;
  mine: boolean;
}

export interface NotificationView {
  id: string;
  type: NotificationType;
  actor: Profile;
  postId?: string;
  createdAt: string;
  read: boolean;
}

export interface FeedPage {
  posts: PostView[];
  nextCursor: number | null;
}

export interface SearchResults {
  users: Profile[];
  posts: PostView[];
}

/** The single seam every social backend implements. */
export interface SocialAdapter {
  /** Create a profile for a freshly authenticated user if none exists. */
  ensureProfile(user: { id: string; email: string }): Promise<Profile>;
  getProfileById(id: string): Promise<Profile | null>;
  getProfileByUsername(username: string): Promise<Profile | null>;
  updateProfile(
    id: string,
    patch: Partial<Pick<Profile, 'displayName' | 'bio' | 'username'>>,
  ): Promise<Profile>;
  toggleFollow(targetId: string, currentUserId: string): Promise<Profile>;

  getFeed(cursor: number | null, currentUserId: string): Promise<FeedPage>;
  getExplore(currentUserId: string): Promise<PostView[]>;
  getUserPosts(userId: string, currentUserId: string): Promise<PostView[]>;
  getPost(id: string, currentUserId: string): Promise<PostView | null>;
  createPost(input: {
    authorId: string;
    caption: string;
    imageUrl: string;
  }): Promise<PostView>;
  toggleLike(postId: string, currentUserId: string): Promise<PostView>;

  getComments(postId: string): Promise<CommentView[]>;
  addComment(
    postId: string,
    authorId: string,
    text: string,
  ): Promise<CommentView>;

  getConversations(currentUserId: string): Promise<ConversationView[]>;
  getMessages(
    conversationId: string,
    currentUserId: string,
  ): Promise<MessageView[]>;
  getConversationPartner(
    conversationId: string,
    currentUserId: string,
  ): Promise<Profile | null>;
  sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
  ): Promise<MessageView>;
  startConversation(currentUserId: string, otherId: string): Promise<string>;

  getNotifications(currentUserId: string): Promise<NotificationView[]>;

  search(query: string, currentUserId: string): Promise<SearchResults>;
}
