-- ============================================================================
-- Amosix — ONE-SHOT reset + schema for a project that has leftover/mismatched
-- tables from earlier attempts. Paste the WHOLE file into the Supabase SQL
-- editor and Run once. It wipes the public schema (destroys any data there —
-- fine for a scratch project) and rebuilds exactly what the app needs.
--
-- Does NOT touch auth.users, so existing accounts survive; their profile row
-- is recreated by the trigger on next login.
-- ============================================================================

-- ---- 1. Wipe and recreate the public schema (clears trust_events, old tables) ----
drop schema if exists public cascade;
create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;

-- Make tables/functions/sequences created below reachable by the API roles
-- (RLS still governs row access). Mirrors a fresh Supabase project's defaults.
alter default privileges in schema public
  grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to postgres, anon, authenticated, service_role;

-- ---- 2. Schema ----
create extension if not exists pgcrypto;

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text unique not null,
  display_name  text not null default '',
  bio           text not null default '',
  avatar_from   text not null default 'oklch(0.68 0.2 264)',
  avatar_to     text not null default 'oklch(0.62 0.2 320)',
  verified      boolean not null default false,
  created_at    timestamptz not null default now()
);

create table public.follows (
  follower_id   uuid not null references public.profiles (id) on delete cascade,
  following_id  uuid not null references public.profiles (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles (id) on delete cascade,
  caption     text not null,
  image_url   text not null,
  created_at  timestamptz not null default now()
);
create index posts_author_created_idx on public.posts (author_id, created_at desc);
create index posts_created_idx on public.posts (created_at desc);

create table public.likes (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  text        text not null,
  created_at  timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  text            text not null,
  created_at      timestamptz not null default now()
);
create index messages_conversation_idx on public.messages (conversation_id, created_at);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  actor_id    uuid not null references public.profiles (id) on delete cascade,
  type        text not null check (type in ('like', 'comment', 'follow')),
  post_id     uuid references public.posts (id) on delete cascade,
  created_at  timestamptz not null default now(),
  read        boolean not null default false
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---- 3. Auto-create a profile on signup ----
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_handle text := regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_.]', '', 'g');
  candidate   text := lower(coalesce(nullif(base_handle, ''), 'user'));
  suffix      int  := 0;
begin
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := lower(coalesce(nullif(base_handle, ''), 'user')) || suffix::text;
  end loop;

  insert into public.profiles (id, username, display_name, bio)
  values (new.id, candidate, coalesce(nullif(base_handle, ''), 'user'), 'New to Amosix 👋');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Membership check for conversation/message policies. SECURITY DEFINER so it
-- bypasses RLS on conversation_participants — prevents infinite recursion.
create or replace function public.is_conversation_member(cid uuid, uid uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = cid and user_id = uid
  );
$$;

-- ---- 4. Row Level Security ----
alter table public.profiles                  enable row level security;
alter table public.follows                   enable row level security;
alter table public.posts                     enable row level security;
alter table public.likes                     enable row level security;
alter table public.comments                  enable row level security;
alter table public.conversations             enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages                  enable row level security;
alter table public.notifications             enable row level security;

create policy "profiles are readable" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "follows are readable" on public.follows
  for select using (auth.role() = 'authenticated');
create policy "follow as self" on public.follows
  for insert with check (auth.uid() = follower_id);
create policy "unfollow as self" on public.follows
  for delete using (auth.uid() = follower_id);

create policy "posts are readable" on public.posts
  for select using (auth.role() = 'authenticated');
create policy "insert own post" on public.posts
  for insert with check (auth.uid() = author_id);
create policy "delete own post" on public.posts
  for delete using (auth.uid() = author_id);

create policy "likes are readable" on public.likes
  for select using (auth.role() = 'authenticated');
create policy "like as self" on public.likes
  for insert with check (auth.uid() = user_id);
create policy "unlike as self" on public.likes
  for delete using (auth.uid() = user_id);

create policy "comments are readable" on public.comments
  for select using (auth.role() = 'authenticated');
create policy "comment as self" on public.comments
  for insert with check (auth.uid() = author_id);
create policy "delete own comment" on public.comments
  for delete using (auth.uid() = author_id);

create policy "read own conversations" on public.conversations
  for select using (public.is_conversation_member(id, auth.uid()));
create policy "create conversations" on public.conversations
  for insert with check (auth.role() = 'authenticated');

create policy "read own participation" on public.conversation_participants
  for select using (public.is_conversation_member(conversation_id, auth.uid()));
create policy "add participants" on public.conversation_participants
  for insert with check (auth.role() = 'authenticated');

create policy "read messages in own conversations" on public.messages
  for select using (public.is_conversation_member(conversation_id, auth.uid()));
create policy "send as self in own conversations" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and public.is_conversation_member(conversation_id, auth.uid())
  );

create policy "read own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "update own notifications" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
