import { beforeEach, describe, expect, it } from 'vitest';
import { MockSocialAdapter } from '@/services/social/mockAdapter';

const NEW_USER = { id: 'u_test', email: 'tester@example.com' };

function freshAdapter() {
  localStorage.clear();
  return new MockSocialAdapter();
}

describe('MockSocialAdapter', () => {
  let adapter: MockSocialAdapter;

  beforeEach(() => {
    adapter = freshAdapter();
  });

  it('creates a profile for a new user and is idempotent', async () => {
    const profile = await adapter.ensureProfile(NEW_USER);
    expect(profile.username).toBe('tester');
    expect(profile.following.length).toBeGreaterThan(0);

    const again = await adapter.ensureProfile(NEW_USER);
    expect(again.id).toBe(profile.id);
    const found = await adapter.getProfileByUsername('tester');
    expect(found?.id).toBe(profile.id);
  });

  it('paginates the feed with a cursor', async () => {
    await adapter.ensureProfile(NEW_USER);
    const first = await adapter.getFeed(null, NEW_USER.id);
    expect(first.posts.length).toBeGreaterThan(0);
    expect(first.nextCursor).not.toBeNull();

    const second = await adapter.getFeed(first.nextCursor, NEW_USER.id);
    const firstIds = new Set(first.posts.map((p) => p.id));
    expect(second.posts.every((p) => !firstIds.has(p.id))).toBe(true);
  });

  it('toggles a like on and off', async () => {
    await adapter.ensureProfile(NEW_USER);
    const { posts } = await adapter.getFeed(null, NEW_USER.id);
    const target = posts[0]!;

    const liked = await adapter.toggleLike(target.id, NEW_USER.id);
    expect(liked.likedByMe).toBe(true);
    expect(liked.likeCount).toBe(target.likeCount + 1);

    const unliked = await adapter.toggleLike(target.id, NEW_USER.id);
    expect(unliked.likedByMe).toBe(false);
    expect(unliked.likeCount).toBe(target.likeCount);
  });

  it('adds a comment and bumps the count', async () => {
    await adapter.ensureProfile(NEW_USER);
    const { posts } = await adapter.getFeed(null, NEW_USER.id);
    const target = posts[0]!;

    await adapter.addComment(target.id, NEW_USER.id, 'Nice one!');
    const comments = await adapter.getComments(target.id);
    expect(comments.some((c) => c.text === 'Nice one!')).toBe(true);

    const updated = await adapter.getPost(target.id, NEW_USER.id);
    expect(updated?.commentCount).toBe(target.commentCount + 1);
  });

  it('creates a post that shows up in the author feed', async () => {
    await adapter.ensureProfile(NEW_USER);
    const created = await adapter.createPost({
      authorId: NEW_USER.id,
      caption: 'my first post',
      imageUrl: 'https://example.com/x.jpg',
    });
    const mine = await adapter.getUserPosts(NEW_USER.id, NEW_USER.id);
    expect(mine.some((p) => p.id === created.id)).toBe(true);
  });

  it('follows and unfollows another user', async () => {
    await adapter.ensureProfile(NEW_USER);
    // A fresh user auto-follows the first creators, so pick one they don't.
    const other = await adapter.getProfileByUsername('tunde');
    expect(other).not.toBeNull();

    const followed = await adapter.toggleFollow(other!.id, NEW_USER.id);
    expect(followed.followers).toContain(NEW_USER.id);

    const unfollowed = await adapter.toggleFollow(other!.id, NEW_USER.id);
    expect(unfollowed.followers).not.toContain(NEW_USER.id);
  });

  it('searches users by handle', async () => {
    await adapter.ensureProfile(NEW_USER);
    const results = await adapter.search('kwa', NEW_USER.id);
    expect(results.users.some((u) => u.username === 'kwame')).toBe(true);
  });
});
