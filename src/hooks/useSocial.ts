import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { socialAdapter } from '@/services/social';
import type { FeedPage, PostView, Profile } from '@/services/social';
import { useAuthStore } from '@/store/useAuthStore';

/** The signed-in user's id, or '' when unauthenticated (queries stay disabled). */
function useCurrentUserId(): string {
  return useAuthStore((state) => state.user?.id ?? '');
}

export function useFeed() {
  const userId = useCurrentUserId();
  return useInfiniteQuery({
    queryKey: ['feed', userId],
    enabled: Boolean(userId),
    initialPageParam: null as number | null,
    queryFn: ({ pageParam }) => socialAdapter.getFeed(pageParam, userId),
    getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor,
  });
}

export function useExplore() {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: ['explore', userId],
    enabled: Boolean(userId),
    queryFn: () => socialAdapter.getExplore(userId),
  });
}

export function usePost(postId: string) {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: ['post', postId, userId],
    enabled: Boolean(userId && postId),
    queryFn: () => socialAdapter.getPost(postId, userId),
  });
}

export function useProfileByUsername(username: string) {
  return useQuery({
    queryKey: ['profile', 'username', username],
    enabled: Boolean(username),
    queryFn: () => socialAdapter.getProfileByUsername(username),
  });
}

export function useProfileById(id: string) {
  return useQuery({
    queryKey: ['profile', 'id', id],
    enabled: Boolean(id),
    queryFn: () => socialAdapter.getProfileById(id),
  });
}

export function useUserPosts(userId: string) {
  const currentUserId = useCurrentUserId();
  return useQuery({
    queryKey: ['userPosts', userId, currentUserId],
    enabled: Boolean(userId && currentUserId),
    queryFn: () => socialAdapter.getUserPosts(userId, currentUserId),
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    enabled: Boolean(postId),
    queryFn: () => socialAdapter.getComments(postId),
  });
}

export function useConversations() {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: ['conversations', userId],
    enabled: Boolean(userId),
    queryFn: () => socialAdapter.getConversations(userId),
  });
}

export function useMessages(conversationId: string) {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: ['messages', conversationId, userId],
    enabled: Boolean(userId && conversationId),
    queryFn: () => socialAdapter.getMessages(conversationId, userId),
  });
}

export function useConversationPartner(conversationId: string) {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: ['partner', conversationId, userId],
    enabled: Boolean(userId && conversationId),
    queryFn: () => socialAdapter.getConversationPartner(conversationId, userId),
  });
}

export function useNotifications() {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: ['notifications', userId],
    enabled: Boolean(userId),
    queryFn: () => socialAdapter.getNotifications(userId),
  });
}

export function useSearch(query: string) {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: ['search', query, userId],
    enabled: Boolean(userId && query.trim()),
    queryFn: () => socialAdapter.search(query, userId),
  });
}

/* ------------------------------- mutations ------------------------------- */

/** Patch a single post inside every cached feed page (optimistic like). */
function patchFeedPost(
  data: InfiniteData<FeedPage> | undefined,
  postId: string,
  update: (post: PostView) => PostView,
): InfiniteData<FeedPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      posts: page.posts.map((p) => (p.id === postId ? update(p) : p)),
    })),
  };
}

export function useToggleLike() {
  const userId = useCurrentUserId();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => socialAdapter.toggleLike(postId, userId),
    onMutate: async (postId: string) => {
      await qc.cancelQueries({ queryKey: ['feed', userId] });
      const previous = qc.getQueryData<InfiniteData<FeedPage>>([
        'feed',
        userId,
      ]);
      qc.setQueryData<InfiniteData<FeedPage>>(['feed', userId], (data) =>
        patchFeedPost(data, postId, (p) => ({
          ...p,
          likedByMe: !p.likedByMe,
          likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
        })),
      );
      return { previous };
    },
    onError: (_err, _postId, context) => {
      if (context?.previous) {
        qc.setQueryData(['feed', userId], context.previous);
      }
    },
    onSuccess: (updated) => {
      qc.setQueryData<InfiniteData<FeedPage>>(['feed', userId], (data) =>
        patchFeedPost(data, updated.id, () => updated),
      );
      qc.invalidateQueries({ queryKey: ['post', updated.id] });
      qc.invalidateQueries({ queryKey: ['explore'] });
    },
  });
}

export function useCreatePost() {
  const userId = useCurrentUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { caption: string; imageUrl: string }) =>
      socialAdapter.createPost({ authorId: userId, ...input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['explore'] });
      qc.invalidateQueries({ queryKey: ['userPosts', userId] });
      qc.invalidateQueries({ queryKey: ['profile', 'id', userId] });
    },
  });
}

export function useAddComment(postId: string) {
  const userId = useCurrentUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      socialAdapter.addComment(postId, userId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      qc.invalidateQueries({ queryKey: ['post', postId] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useToggleFollow() {
  const userId = useCurrentUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetId: string) =>
      socialAdapter.toggleFollow(targetId, userId),
    onSuccess: (target: Profile) => {
      qc.setQueryData(['profile', 'id', target.id], target);
      qc.setQueryData(['profile', 'username', target.username], target);
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUpdateProfile() {
  const userId = useCurrentUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: {
      displayName?: string;
      bio?: string;
      username?: string;
    }) => socialAdapter.updateProfile(userId, patch),
    onSuccess: (profile) => {
      qc.setQueryData(['profile', 'id', profile.id], profile);
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useSendMessage(conversationId: string) {
  const userId = useCurrentUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      socialAdapter.sendMessage(conversationId, userId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
