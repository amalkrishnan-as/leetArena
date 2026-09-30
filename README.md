# ⚔ LeetArena

A private competitive coding arena for a group of friends. Solve LeetCode problems, earn XP, maintain streaks, and compete with your friends — all verified server-side.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (dark design system in `app/globals.css`)
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **Verification**: LeetCode public GraphQL API (no credentials required)

## How It Works

1. **Register** with your email and link your public LeetCode username
2. **Enter the Arena** — the server picks a random problem and records when you started
3. **Solve it** on [leetcode.com](https://leetcode.com) — no password sharing
4. **Verify** — the server queries your recent Accepted submissions, confirms the slug matches and the timestamp is *after* your challenge started, then awards XP
5. Compete on the **Leaderboard**, challenge friends in **H2H**, and unlock **Achievements**

The server owns all state. Clients can never fake XP — verification is always timestamp-checked against a server-recorded `started_at`.

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 2. Clone & install

```bash
git clone <your-repo-url>
cd leet-arena
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these from **Supabase Dashboard → Project Settings → API**.

### 4. Run the database migration

In **Supabase Dashboard → SQL Editor**, paste and run the entire contents of:

```
supabase/migrations/001_initial_schema.sql
```

This creates all tables, RLS policies, and server-side XP functions.

### 5. Seed problems

```bash
npm run seed
```

This inserts ~100 classic LeetCode problems into `arena_problems`.

### 6. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
app/
  page.tsx                  Dashboard (server component)
  layout.tsx                Root layout with sidebar nav
  globals.css               Dark design system
  login/page.tsx            Login + Register
  setup/page.tsx            LeetCode username setup
  reset-password/page.tsx   Password reset
  profile/                  Profile edit + stats
  arena/page.tsx            Arena challenge flow
  h2h/page.tsx              Head-to-Head battle flow
  leaderboard/page.tsx      XP leaderboard
  players/                  Player cards + individual profiles
  achievements/page.tsx     Achievement gallery
  league/page.tsx           XP tier groupings
  api/
    arena/start/route.ts    POST — create Arena attempt
    arena/verify/route.ts   POST — verify LeetCode submission
    h2h/create/route.ts     POST — create H2H match
    h2h/verify/route.ts     POST — verify H2H submission
    profile/route.ts        PUT — update player profile

lib/
  supabase/
    client.ts               Browser Supabase client (anon key)
    server.ts               Server Supabase client (SSR + cookies)
    admin.ts                Admin client (service role key, server only)
  leetcode/
    client.ts               LeetCode GraphQL scraper (recent submissions)

scripts/
  seed-problems.ts          Seed arena_problems table

supabase/
  migrations/
    001_initial_schema.sql  Full schema, RLS, XP functions
```

## Security Model

| What | How |
|---|---|
| XP is trusted | Only `complete_verified_arena_solve()` awards XP, callable only via service role |
| Submission verified | Timestamp check: `submission.timestamp >= arena_attempt.started_at` |
| Problem is server-chosen | Client never submits a problem ID — server picks and records it |
| H2H winner | Determined from verified LeetCode timestamps, not button clicks |
| Auth guard | `proxy.ts` (Next.js 16 middleware) redirects unauthenticated users |

## Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

## League Tiers

| Tier | XP Required |
|---|---|
| 💎 Diamond | 5,000+ |
| 🔷 Platinum | 2,500+ |
| 🥇 Gold | 1,000+ |
| 🥈 Silver | 400+ |
| 🥉 Bronze | 0+ |
