# Amosix

A professional account/signup starter built for correctness, speed, and change.
React 19 + Vite + TypeScript (strict), with a swappable auth backend.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

The app runs immediately against a **mock auth backend** (localStorage) — no
account, no keys, no network required.

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
│  ├─ ui/            Button, Input, Label, Checkbox, Spinner (shadcn-style)
│  └─ auth/          SignupForm, PasswordStrengthMeter
├─ pages/            SignupPage, DashboardPage
├─ services/auth/    AuthAdapter interface + Mock & Supabase adapters
├─ store/            Zustand auth store
├─ hooks/            useSignup (TanStack Query mutation)
├─ lib/              validation (Zod), passwordStrength, env, cn util
└─ tests/            Vitest unit + component tests
```

**The one seam that matters:** every backend implements `AuthAdapter`
(`src/services/auth/types.ts`). UI, state, and hooks depend on that interface —
never a concrete class — so swapping backends touches exactly one file.

## Switching to Supabase

1. `npm install @supabase/supabase-js`
2. Copy `.env.example` → `.env` and set:
   ```
   VITE_AUTH_PROVIDER=supabase
   VITE_SUPABASE_URL=<your project URL>
   VITE_SUPABASE_ANON_KEY=<your anon/public key>
   ```
   The anon key is safe for the browser. **Never** put the `service_role` key
   in a `VITE_*` variable — it would ship to every visitor.
3. Implement the method bodies in `src/services/auth/supabaseAdapter.ts`
   (each is a documented one-liner today). Nothing else changes.

## What this starter deliberately does NOT include

The original brief listed ~60 packages. These were left out on purpose:

- **SonarQube, Sentry, LogRocket, Mixpanel, Hotjar, GA4** — external SaaS that
  need accounts and secret keys. The error boundary has a marked spot to wire
  Sentry/LogRocket once you have keys.
- **Jotai** — overlaps Zustand; one client-state library is enough.
- **Cypress** — Playwright already covers E2E.
- **dotenv** — Vite has built-in env handling (`import.meta.env`).
- **compression / rate-limiter-flexible** — server middleware; no-ops in a SPA.
- **crypto-js** — client-side "encryption" of secrets is not security.

Add any of them when a real need appears, not before.
