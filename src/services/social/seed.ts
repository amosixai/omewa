import type {
  Comment,
  Conversation,
  Notification,
  Post,
  Profile,
} from './types';

/**
 * Deterministic seed so the app is alive the moment you log in. Post images use
 * picsum.photos (stable per seed); avatars are CSS gradients (no network), so
 * the UI never looks broken even offline.
 */

function daysAgo(days: number, hours = 0): string {
  return new Date(Date.now() - (days * 24 + hours) * 3600_000).toISOString();
}

/** Safe cyclic access that satisfies noUncheckedIndexedAccess. */
function at<T>(arr: readonly T[], i: number): T {
  const value = arr[((i % arr.length) + arr.length) % arr.length];
  if (value === undefined) throw new Error('at(): array is empty');
  return value;
}

export function seedProfiles(): Profile[] {
  const base: Array<
    Pick<Profile, 'id' | 'username' | 'displayName' | 'bio' | 'verified'> & {
      avatarColors: [string, string];
    }
  > = [
    {
      id: 'u_ada',
      username: 'ada',
      displayName: 'Ada Obi',
      bio: 'Lagos ✈️ everywhere. Building things that matter.',
      verified: true,
      avatarColors: ['oklch(0.7 0.19 20)', 'oklch(0.6 0.2 320)'],
    },
    {
      id: 'u_kwame',
      username: 'kwame',
      displayName: 'Kwame Mensah',
      bio: 'Producer 🎧 Accra. New tape dropping soon.',
      verified: true,
      avatarColors: ['oklch(0.72 0.17 150)', 'oklch(0.6 0.2 200)'],
    },
    {
      id: 'u_zola',
      username: 'zola',
      displayName: 'Zola Ndlovu',
      bio: 'Street style • Joburg 🇿🇦',
      verified: false,
      avatarColors: ['oklch(0.75 0.16 60)', 'oklch(0.62 0.2 30)'],
    },
    {
      id: 'u_amara',
      username: 'amara',
      displayName: 'Amara Diallo',
      bio: 'Chef & food creator. Jollof supremacist 🍚🔥',
      verified: false,
      avatarColors: ['oklch(0.74 0.18 100)', 'oklch(0.6 0.2 150)'],
    },
    {
      id: 'u_tunde',
      username: 'tunde',
      displayName: 'Tunde Bello',
      bio: 'Football edits ⚽ | Superstars only',
      verified: false,
      avatarColors: ['oklch(0.68 0.2 260)', 'oklch(0.62 0.2 300)'],
    },
    {
      id: 'u_naledi',
      username: 'naledi',
      displayName: 'Naledi Khumalo',
      bio: 'Dancer 💃 Afrobeats & amapiano',
      verified: true,
      avatarColors: ['oklch(0.72 0.19 350)', 'oklch(0.6 0.2 280)'],
    },
  ];

  return base.map((p) => ({
    ...p,
    followers: [],
    following: [],
    postCount: 0,
  })) as Profile[];
}

const CAPTIONS = [
  'Golden hour hits different here 🌅 #amosix',
  'New drop is live — link in bio 🛍️',
  'POV: you finally made the recipe work 🍛',
  'Behind the scenes of today’s shoot 📸',
  'This beat has been stuck in my head all week 🎶',
  'Sunday reset. Slow mornings only ☕',
  'We move. Big things loading 🚀',
  'Tell me your favourite in the comments 👇',
  'Practice makes progress, not perfect.',
  'Weekend vibes locked in ✨',
  'Made this with love. Rate it /10',
  'City never sleeps 🌃',
];

export function seedPosts(profiles: Profile[]): Post[] {
  const posts: Post[] = [];
  let n = 0;
  for (let round = 0; round < 3; round += 1) {
    profiles.forEach((profile, idx) => {
      const id = `p_${n}`;
      const likeCount = 42 + ((n * 137) % 3600);
      const likers = profiles
        .filter(
          (candidate, i) => (i + n) % 2 === 0 && candidate.id !== profile.id,
        )
        .map((p) => p.id);
      // Distinct filler ids so the count reads realistically (not collapsed).
      const filler = Array.from(
        { length: likeCount },
        (_, k) => `ghost_${n}_${k}`,
      );
      posts.push({
        id,
        authorId: profile.id,
        caption: at(CAPTIONS, n + idx),
        imageUrl: `https://picsum.photos/seed/amosix${n}/640/800`,
        createdAt: daysAgo(round, idx * 3 + 1),
        likes: [...likers, ...filler],
      });
      n += 1;
    });
  }
  return posts;
}

export function seedComments(posts: Post[], profiles: Profile[]): Comment[] {
  const texts = [
    'This is fire 🔥',
    'Obsessed with this!',
    'How?? Teach me 🙏',
    'Sending this to everyone I know',
    'Certified classic 💯',
    'Okay you ate that 👏',
  ];
  const comments: Comment[] = [];
  posts.slice(0, 10).forEach((post, i) => {
    const count = 1 + (i % 3);
    for (let c = 0; c < count; c += 1) {
      const author = at(profiles, i + c + 1);
      comments.push({
        id: `c_${i}_${c}`,
        postId: post.id,
        authorId: author.id,
        text: at(texts, i + c),
        createdAt: daysAgo(0, i + c),
      });
    }
  });
  return comments;
}

export function seedConversations(profiles: Profile[]): Conversation[] {
  // Conversations are seeded lazily against the logged-in user at runtime; we
  // keep a couple between demo users so the inbox isn't empty on first look.
  const a = at(profiles, 0);
  const b = at(profiles, 1);
  return [
    {
      id: 'conv_seed_1',
      participantIds: [a.id, b.id],
      messages: [
        {
          id: 'm1',
          conversationId: 'conv_seed_1',
          senderId: b.id,
          text: 'Yo the new track is insane 🔥',
          createdAt: daysAgo(0, 5),
        },
        {
          id: 'm2',
          conversationId: 'conv_seed_1',
          senderId: a.id,
          text: 'Thank you!! Dropping the video next week',
          createdAt: daysAgo(0, 4),
        },
      ],
    },
  ];
}

export function seedNotifications(): Notification[] {
  return [];
}
