# Amosix

A mobile-first social app — think Instagram/TikTok — built for correctness,
speed, and change. React 19 + Vite + TypeScript (strict), with swappable auth
**and** social backends.

## User flow

Signup / Login → **home feed immediately** (no landing page, no dashboard).
From the feed you scroll, like, comment, share, follow, upload posts, DM other
users, explore/search, and manage your profile — all from a bottom nav bar.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

The app runs immediately against **mock backends** (localStorage) — no account,
no keys, no network required. It ships with seeded creators, posts, and
comments so the feed is alive the moment you sign up.

## Scripts

| Command                 | What it does                                        |
| ----------------------- | --------------------------------------------------- |
| `npm run dev`           | Start the Vite dev server                           |
| `npm run build`         | Type-check (`tsc --noEmit`) then production build   |
| `npm run preview`       | Serve the production build locally                  |
| `npm run lint`          | ESLint (flat config, `no-explicit-any` is an error) |
| `npm run format`        | Prettier write                                      |
| `npm run typecheck`     | TypeScript, no emit                                 |
| `npm run test`          | Unit + component tests (Vitest)                     |
| `npm run test:coverage` | Tests with a V8 coverage report                     |
| `npm run test:e2e`      | Playwright E2E (run `npx playwright install` first) |

A Husky pre-commit hook runs `lint-staged` (ESLint + Prettier on staged files).

## Architecture

```
src/
├─ components/
│  ├─ ui/            Button, Input, Textarea, Label, Checkbox, Spinner
│  ├─ auth/          SignupForm, LoginForm, PasswordStrengthMeter
│  ├─ social/        Avatar, PostCard, PostGrid
│  ├─ layout/        AppShell (top bar), BottomNav
│  └─ RouteGuards    ProtectedRoute / PublicOnlyRoute + Splash
├─ pages/            Feed, Explore, Upload, Messages, Conversation,
│                    Profile, EditProfile, Post, Notifications, Login, Signup
├─ services/
│  ├─ auth/          AuthAdapter interface + Mock & Supabase adapters
│  └─ social/        SocialAdapter interface + Mock adapter + seed data
├─ store/            Zustand auth store
├─ hooks/            useSignup/useLogin + useSocial (TanStack Query hooks)
├─ lib/              validation (Zod), time/format, passwordStrength, env, cn
└─ tests/            Vitest unit + component tests
```

**The two seams that matter:** every backend implements `AuthAdapter`
(`src/services/auth/types.ts`) or `SocialAdapter`
(`src/services/social/types.ts`). UI, state, and hooks depend on those
interfaces — never a concrete class — so swapping to a real backend touches only
those adapter files, no components.

## Going live with Supabase

1. `npm install @supabase/supabase-js`
2. Copy `.env.example` → `.env` and set:
   ```
   VITE_AUTH_PROVIDER=supabase
   VITE_SUPABASE_URL=<your project URL>
   VITE_SUPABASE_ANON_KEY=<your anon/public key>
   ```
   The anon key is safe for the browser. **Never** put the `service_role` key in
   a `VITE_*` variable — it would ship to every visitor.
3. Implement `src/services/auth/supabaseAdapter.ts`, then write a
   `SupabaseSocialAdapter` implementing `SocialAdapter` and swap the one line in
   `src/services/social/index.ts`. Nothing in the UI changes.

## Deliberately not included (yet)

External SaaS that needs accounts/keys (Sentry, LogRocket, analytics), redundant
libraries, and server-only middleware are left out on purpose — add them when a
real need appears. Payments, real-time via Supabase Realtime, and push
notifications slot in behind the same adapter pattern.
