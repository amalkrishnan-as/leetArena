-- ============================================================
-- LeetArena Initial Schema
-- ============================================================
-- Run this in your Supabase SQL Editor (or via supabase db push).
-- Tables use UUIDs and have RLS enabled by default.
-- ============================================================

-- ============================================================
-- PLAYERS
-- ============================================================

create table if not exists public.players (
  id            uuid        primary key references auth.users(id) on delete cascade,
  display_name  text        not null,
  leetcode_username text    unique not null,
  xp            integer     not null default 0,
  solved        integer     not null default 0,
  streak        integer     not null default 0,
  last_solved_at timestamptz,
  h2h_wins      integer     not null default 0,
  h2h_losses    integer     not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.players enable row level security;

-- Anyone authenticated can read any player profile (public leaderboard, profiles)
create policy "players_read_authenticated"
  on public.players for select
  to authenticated
  using (true);

-- Players can only insert their own row
create policy "players_insert_own"
  on public.players for insert
  to authenticated
  with check (id = auth.uid());

-- Players can only update their own row
create policy "players_update_own"
  on public.players for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());


-- ============================================================
-- ARENA PROBLEMS
-- ============================================================

create table if not exists public.arena_problems (
  id           uuid        primary key default gen_random_uuid(),
  slug         text        unique not null,
  title        text        not null,
  difficulty   text        not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  leetcode_url text        not null,
  xp           integer     not null,
  created_at   timestamptz not null default now()
);

alter table public.arena_problems enable row level security;

-- All authenticated users can read problems
create policy "arena_problems_read_authenticated"
  on public.arena_problems for select
  to authenticated
  using (true);

-- Only service role can write problems (via sync script)
-- No insert/update policy for authenticated → only service_role can write


-- ============================================================
-- ARENA PROBLEM TOPICS
-- ============================================================

create table if not exists public.arena_problem_topics (
  problem_id   uuid   not null references public.arena_problems(id) on delete cascade,
  topic        text   not null,
  primary key (problem_id, topic)
);

alter table public.arena_problem_topics enable row level security;

create policy "arena_problem_topics_read_authenticated"
  on public.arena_problem_topics for select
  to authenticated
  using (true);


-- ============================================================
-- ARENA ATTEMPTS
-- ============================================================

create table if not exists public.arena_attempts (
  id           uuid        primary key default gen_random_uuid(),
  player_id    uuid        not null references public.players(id) on delete cascade,
  problem_id   uuid        not null references public.arena_problems(id) on delete cascade,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  status       text        not null default 'active' check (status in ('active', 'completed', 'expired'))
);

alter table public.arena_attempts enable row level security;

-- Players can only see their own attempts
create policy "arena_attempts_read_own"
  on public.arena_attempts for select
  to authenticated
  using (player_id = auth.uid());

-- Players can insert attempts for themselves
create policy "arena_attempts_insert_own"
  on public.arena_attempts for insert
  to authenticated
  with check (player_id = auth.uid());

-- Players cannot directly update attempts (server-side only via service role)
-- No update/delete policy for authenticated

create index if not exists idx_arena_attempts_player_id on public.arena_attempts(player_id);
create index if not exists idx_arena_attempts_player_problem on public.arena_attempts(player_id, problem_id);


-- ============================================================
-- PROBLEM SOLVES
-- ============================================================

create table if not exists public.problem_solves (
  id               uuid        primary key default gen_random_uuid(),
  player_id        uuid        not null references public.players(id) on delete cascade,
  problem_slug     text        not null,
  problem_title    text        not null,
  difficulty       text        not null,
  xp_awarded       integer     not null,
  solved_at        timestamptz not null default now(),
  arena_problem_id uuid        references public.arena_problems(id),
  unique (player_id, problem_slug)
);

alter table public.problem_solves enable row level security;

-- Players can see all solves (for leaderboard / public profiles)
create policy "problem_solves_read_authenticated"
  on public.problem_solves for select
  to authenticated
  using (true);

-- Service role inserts solves. Authenticated users cannot directly insert.
-- This is enforced by the server-side trusted completion function.

create index if not exists idx_problem_solves_player on public.problem_solves(player_id);
create index if not exists idx_problem_solves_player_slug on public.problem_solves(player_id, problem_slug);


-- ============================================================
-- XP TRANSACTIONS
-- ============================================================

create table if not exists public.xp_transactions (
  id         uuid        primary key default gen_random_uuid(),
  player_id  uuid        not null references public.players(id) on delete cascade,
  amount     integer     not null,
  reason     text        not null,
  source_id  uuid,
  created_at timestamptz not null default now()
);

alter table public.xp_transactions enable row level security;

-- Players can see all XP transactions (for leaderboard / public stats)
create policy "xp_transactions_read_authenticated"
  on public.xp_transactions for select
  to authenticated
  using (true);

create index if not exists idx_xp_transactions_player on public.xp_transactions(player_id);
create index if not exists idx_xp_transactions_created_at on public.xp_transactions(created_at);


-- ============================================================
-- ACHIEVEMENTS
-- ============================================================

create table if not exists public.achievements (
  id          uuid        primary key default gen_random_uuid(),
  name        text        unique not null,
  description text        not null,
  icon        text        not null,
  created_at  timestamptz not null default now()
);

alter table public.achievements enable row level security;

create policy "achievements_read_authenticated"
  on public.achievements for select
  to authenticated
  using (true);


-- ============================================================
-- PLAYER ACHIEVEMENTS
-- ============================================================

create table if not exists public.player_achievements (
  player_id      uuid        not null references public.players(id) on delete cascade,
  achievement_id uuid        not null references public.achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (player_id, achievement_id)
);

alter table public.player_achievements enable row level security;

create policy "player_achievements_read_authenticated"
  on public.player_achievements for select
  to authenticated
  using (true);


-- ============================================================
-- H2H MATCHES
-- ============================================================

create table if not exists public.h2h_matches (
  id                       uuid        primary key default gen_random_uuid(),
  player_one_id            uuid        not null references public.players(id) on delete cascade,
  player_two_id            uuid        not null references public.players(id) on delete cascade,
  problem_id               uuid        not null references public.arena_problems(id),
  status                   text        not null default 'pending' check (status in ('pending', 'active', 'completed', 'cancelled')),
  created_at               timestamptz not null default now(),
  started_at               timestamptz,
  player_one_completed_at  timestamptz,
  player_two_completed_at  timestamptz,
  winner_id                uuid        references public.players(id),
  completed_at             timestamptz
);

alter table public.h2h_matches enable row level security;

-- Players can see matches they participate in
create policy "h2h_matches_read_participants"
  on public.h2h_matches for select
  to authenticated
  using (player_one_id = auth.uid() or player_two_id = auth.uid());

-- Players can create matches (they must be player_one)
create policy "h2h_matches_insert_own"
  on public.h2h_matches for insert
  to authenticated
  with check (player_one_id = auth.uid());

-- Server-side updates via service role
-- No update policy for authenticated

create index if not exists idx_h2h_matches_player_one on public.h2h_matches(player_one_id);
create index if not exists idx_h2h_matches_player_two on public.h2h_matches(player_two_id);


-- ============================================================
-- LEAGUES
-- ============================================================

create table if not exists public.leagues (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  invite_code text        unique not null default upper(substring(md5(random()::text), 1, 8)),
  owner_id    uuid        not null references public.players(id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.leagues enable row level security;

-- All authenticated users can read leagues (to search by invite code)
create policy "leagues_read_authenticated"
  on public.leagues for select
  to authenticated
  using (true);

-- Players can create leagues
create policy "leagues_insert_own"
  on public.leagues for insert
  to authenticated
  with check (owner_id = auth.uid());

-- Only owners can update their league
create policy "leagues_update_own"
  on public.leagues for update
  to authenticated
  using (owner_id = auth.uid());


-- ============================================================
-- LEAGUE MEMBERS
-- ============================================================

create table if not exists public.league_members (
  league_id  uuid        not null references public.leagues(id) on delete cascade,
  player_id  uuid        not null references public.players(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (league_id, player_id)
);

alter table public.league_members enable row level security;

create policy "league_members_read_authenticated"
  on public.league_members for select
  to authenticated
  using (true);

create policy "league_members_insert_own"
  on public.league_members for insert
  to authenticated
  with check (player_id = auth.uid());

create policy "league_members_delete_own"
  on public.league_members for delete
  to authenticated
  using (player_id = auth.uid());


-- ============================================================
-- DATABASE FUNCTIONS
-- ============================================================

-- ----------------------------------------------------------
-- get_random_arena_problem
-- Selects a random problem, optionally filtered by difficulty
-- and/or topic. Called by the /api/arena/start route.
-- ----------------------------------------------------------

create or replace function public.get_random_arena_problem(
  difficulty_filter text default null,
  topic_filter      text default null
)
returns table (
  id           uuid,
  slug         text,
  title        text,
  difficulty   text,
  leetcode_url text,
  xp           integer,
  topics       text[]
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    p.id,
    p.slug,
    p.title,
    p.difficulty,
    p.leetcode_url,
    p.xp,
    coalesce(
      array_agg(t.topic order by t.topic) filter (where t.topic is not null),
      '{}'::text[]
    ) as topics
  from public.arena_problems p
  left join public.arena_problem_topics t on t.problem_id = p.id
  where
    (difficulty_filter is null or p.difficulty = difficulty_filter)
    and (
      topic_filter is null
      or exists (
        select 1
        from public.arena_problem_topics pt
        where pt.problem_id = p.id
          and pt.topic = topic_filter
      )
    )
  group by p.id
  order by random()
  limit 1;
end;
$$;

grant execute on function public.get_random_arena_problem(text, text) to authenticated;


-- ----------------------------------------------------------
-- check_achievements
-- Evaluates unlocked achievements for a player and inserts
-- any newly earned ones. Called inside complete_verified_arena_solve.
-- ----------------------------------------------------------

create or replace function public.check_achievements(target_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.players%rowtype;
  hard_count integer;
begin
  select * into p from public.players where id = target_player_id;
  if not found then return; end if;

  select count(*) into hard_count
  from public.problem_solves
  where player_id = target_player_id and difficulty = 'Hard';

  -- First Blood: first Arena solve
  if p.solved >= 1 then
    insert into public.player_achievements(player_id, achievement_id)
    select target_player_id, a.id
    from public.achievements a
    where a.name = 'First Blood'
    on conflict (player_id, achievement_id) do nothing;
  end if;

  -- Hot Start: 3-day streak
  if p.streak >= 3 then
    insert into public.player_achievements(player_id, achievement_id)
    select target_player_id, a.id
    from public.achievements a
    where a.name = 'Hot Start'
    on conflict (player_id, achievement_id) do nothing;
  end if;

  -- Week Warrior: 7-day streak
  if p.streak >= 7 then
    insert into public.player_achievements(player_id, achievement_id)
    select target_player_id, a.id
    from public.achievements a
    where a.name = 'Week Warrior'
    on conflict (player_id, achievement_id) do nothing;
  end if;

  -- Problem Hunter: 10 total solves
  if p.solved >= 10 then
    insert into public.player_achievements(player_id, achievement_id)
    select target_player_id, a.id
    from public.achievements a
    where a.name = 'Problem Hunter'
    on conflict (player_id, achievement_id) do nothing;
  end if;

  -- Hard Mode: 5 Hard problems
  if hard_count >= 5 then
    insert into public.player_achievements(player_id, achievement_id)
    select target_player_id, a.id
    from public.achievements a
    where a.name = 'Hard Mode'
    on conflict (player_id, achievement_id) do nothing;
  end if;
end;
$$;

-- Only called internally by complete_verified_arena_solve
-- Not granted to authenticated users directly


-- ----------------------------------------------------------
-- complete_verified_arena_solve
-- Trusted server-side function. Called ONLY by the admin
-- (service_role) client from /api/arena/verify.
-- Atomically:
--   1. Inserts problem_solves (prevents duplicates)
--   2. Calculates and updates streak
--   3. Updates players (xp, solved, streak, last_solved_at)
--   4. Inserts xp_transactions
--   5. Checks achievements
-- Returns result JSON so the API can return meaningful data.
-- ----------------------------------------------------------

create or replace function public.complete_verified_arena_solve(
  target_player_id uuid,
  arena_problem_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  problem_rec   public.arena_problems%rowtype;
  player_rec    public.players%rowtype;
  new_streak    integer;
  last_date     date;
  today         date := current_date;
  already_solved boolean := false;
begin
  -- Validate problem
  select * into problem_rec
  from public.arena_problems
  where id = arena_problem_id;

  if not found then
    raise exception 'ARENA_PROBLEM_NOT_FOUND';
  end if;

  -- Lock the player row for update
  select * into player_rec
  from public.players
  where id = target_player_id
  for update;

  if not found then
    raise exception 'PLAYER_NOT_FOUND';
  end if;

  -- Attempt to insert problem_solves (unique constraint on player_id, problem_slug)
  begin
    insert into public.problem_solves (
      player_id,
      problem_slug,
      problem_title,
      difficulty,
      xp_awarded,
      arena_problem_id
    ) values (
      target_player_id,
      problem_rec.slug,
      problem_rec.title,
      problem_rec.difficulty,
      problem_rec.xp,
      arena_problem_id
    );
  exception
    when unique_violation then
      -- Already solved this problem — return early without awarding XP again
      return json_build_object(
        'success', true,
        'alreadySolved', true,
        'xpAwarded', 0,
        'newTotalXp', player_rec.xp,
        'newStreak', player_rec.streak,
        'message', 'You have already completed this problem.'
      );
  end;

  -- Calculate new streak
  if player_rec.last_solved_at is null then
    new_streak := 1;
  else
    last_date := player_rec.last_solved_at::date;
    if last_date = today then
      -- Already solved something today — streak stays the same
      new_streak := player_rec.streak;
    elsif last_date = today - interval '1 day' then
      -- Solved yesterday — extend streak
      new_streak := player_rec.streak + 1;
    else
      -- Gap of more than one day — reset
      new_streak := 1;
    end if;
  end if;

  -- Update player stats
  update public.players set
    xp            = xp + problem_rec.xp,
    solved        = solved + 1,
    streak        = new_streak,
    last_solved_at = now()
  where id = target_player_id;

  -- Insert XP transaction
  insert into public.xp_transactions (player_id, amount, reason, source_id)
  values (target_player_id, problem_rec.xp, 'Verified Arena solve', arena_problem_id);

  -- Check achievements
  perform public.check_achievements(target_player_id);

  -- Return success data
  return json_build_object(
    'success', true,
    'alreadySolved', false,
    'xpAwarded', problem_rec.xp,
    'newTotalXp', player_rec.xp + problem_rec.xp,
    'newStreak', new_streak,
    'message', format('Verified! +%s XP', problem_rec.xp)
  );
end;
$$;

-- IMPORTANT: Do NOT grant this to authenticated or anon.
-- Only service_role (server-side admin client) can execute it.
revoke execute on function public.complete_verified_arena_solve(uuid, uuid) from public, anon, authenticated;


-- ============================================================
-- SEED: ACHIEVEMENTS
-- ============================================================

insert into public.achievements (name, description, icon) values
  ('First Blood',    'Complete your first Arena challenge',   '🏆'),
  ('Hot Start',      'Reach a 3 day solving streak',          '🔥'),
  ('Week Warrior',   'Reach a 7 day solving streak',          '⚔️'),
  ('Problem Hunter', 'Complete 10 Arena challenges',          '🎯'),
  ('Hard Mode',      'Complete 5 Hard problems',              '💀')
on conflict (name) do nothing;


-- ============================================================
-- SEED: SAMPLE PROBLEMS (for development/testing)
-- Add a few real LeetCode problems so the Arena works immediately.
-- Your sync script will add thousands more.
-- ============================================================

insert into public.arena_problems (slug, title, difficulty, leetcode_url, xp) values
  ('two-sum',                    'Two Sum',                    'Easy',   'https://leetcode.com/problems/two-sum/',                    10),
  ('add-two-numbers',            'Add Two Numbers',            'Medium', 'https://leetcode.com/problems/add-two-numbers/',            25),
  ('longest-substring-without-repeating-characters', 'Longest Substring Without Repeating Characters', 'Medium', 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', 25),
  ('median-of-two-sorted-arrays','Median of Two Sorted Arrays','Hard',   'https://leetcode.com/problems/median-of-two-sorted-arrays/',50),
  ('valid-parentheses',          'Valid Parentheses',          'Easy',   'https://leetcode.com/problems/valid-parentheses/',          10),
  ('merge-two-sorted-lists',     'Merge Two Sorted Lists',     'Easy',   'https://leetcode.com/problems/merge-two-sorted-lists/',     10),
  ('climbing-stairs',            'Climbing Stairs',            'Easy',   'https://leetcode.com/problems/climbing-stairs/',            10),
  ('binary-search',              'Binary Search',              'Easy',   'https://leetcode.com/problems/binary-search/',              10),
  ('maximum-subarray',           'Maximum Subarray',           'Medium', 'https://leetcode.com/problems/maximum-subarray/',           25),
  ('number-of-islands',          'Number of Islands',          'Medium', 'https://leetcode.com/problems/number-of-islands/',          25),
  ('coin-change',                'Coin Change',                'Medium', 'https://leetcode.com/problems/coin-change/',                25),
  ('word-search',                'Word Search',                'Medium', 'https://leetcode.com/problems/word-search/',                25),
  ('trapping-rain-water',        'Trapping Rain Water',        'Hard',   'https://leetcode.com/problems/trapping-rain-water/',        50),
  ('merge-k-sorted-lists',       'Merge k Sorted Lists',       'Hard',   'https://leetcode.com/problems/merge-k-sorted-lists/',       50),
  ('n-queens',                   'N-Queens',                   'Hard',   'https://leetcode.com/problems/n-queens/',                   50)
on conflict (slug) do nothing;

-- Topics for sample problems
insert into public.arena_problem_topics (problem_id, topic)
select p.id, t.topic
from public.arena_problems p
cross join (values
  ('two-sum',             'Array'),
  ('two-sum',             'Hash Table'),
  ('add-two-numbers',     'Linked List'),
  ('add-two-numbers',     'Math'),
  ('longest-substring-without-repeating-characters', 'String'),
  ('longest-substring-without-repeating-characters', 'Hash Table'),
  ('longest-substring-without-repeating-characters', 'Sliding Window'),
  ('median-of-two-sorted-arrays', 'Array'),
  ('median-of-two-sorted-arrays', 'Binary Search'),
  ('valid-parentheses',   'String'),
  ('valid-parentheses',   'Stack'),
  ('merge-two-sorted-lists', 'Linked List'),
  ('climbing-stairs',     'Dynamic Programming'),
  ('binary-search',       'Array'),
  ('binary-search',       'Binary Search'),
  ('maximum-subarray',    'Array'),
  ('maximum-subarray',    'Dynamic Programming'),
  ('number-of-islands',   'Array'),
  ('number-of-islands',   'DFS'),
  ('number-of-islands',   'BFS'),
  ('coin-change',         'Dynamic Programming'),
  ('word-search',         'Array'),
  ('word-search',         'Backtracking'),
  ('trapping-rain-water', 'Array'),
  ('trapping-rain-water', 'Two Pointers'),
  ('merge-k-sorted-lists','Linked List'),
  ('merge-k-sorted-lists','Heap'),
  ('n-queens',            'Backtracking')
) as t(slug, topic)
where p.slug = t.slug
on conflict (problem_id, topic) do nothing;


-- ============================================================
-- GRANTS & PRIVILEGES
-- ============================================================
-- Ensure authenticated, anon, and service_role have proper access
-- to the public schema and its tables/sequences.
-- Row Level Security (RLS) policies enforce actual row access.

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to postgres, anon, authenticated, service_role;

