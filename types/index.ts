// Central TypeScript types for LeetArena.
// All types are derived from the database schema.

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Player {
  id: string;
  display_name: string;
  leetcode_username: string;
  xp: number;
  solved: number;
  streak: number;
  last_solved_at: string | null;
  h2h_wins: number;
  h2h_losses: number;
  created_at: string;
}

export interface ArenaProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  leetcode_url: string;
  xp: number;
  created_at: string;
  topics?: string[];
}

export interface ArenaAttempt {
  id: string;
  player_id: string;
  problem_id: string;
  started_at: string;
  completed_at: string | null;
  status: "active" | "completed" | "expired";
}

/** Atomic challenge object — problem and attempt always travel together */
export interface ActiveArenaChallenge {
  problem: ArenaProblem;
  attempt: {
    id: string;
    startedAt: string;
  };
}

export interface ProblemSolve {
  id: string;
  player_id: string;
  problem_slug: string;
  problem_title: string;
  difficulty: Difficulty;
  xp_awarded: number;
  solved_at: string;
  arena_problem_id: string | null;
}

export interface XpTransaction {
  id: string;
  player_id: string;
  amount: number;
  reason: string;
  source_id: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
}

export interface PlayerAchievement {
  player_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface H2HMatch {
  id: string;
  player_one_id: string;
  player_two_id: string;
  problem_id: string;
  status: "pending" | "active" | "completed";
  created_at: string;
  started_at: string | null;
  player_one_completed_at: string | null;
  player_two_completed_at: string | null;
  winner_id: string | null;
  completed_at: string | null;
  problem?: ArenaProblem;
  player_one?: Player;
  player_two?: Player;
}

export interface League {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
}

export interface LeagueMember {
  league_id: string;
  player_id: string;
  joined_at: string;
  player?: Player;
}

// API response types
export interface ApiError {
  error: string;
  message: string;
}

export interface ArenaStartResponse {
  problem: ArenaProblem;
  attempt: {
    id: string;
    startedAt: string;
  };
}

export interface ArenaVerifyResponse {
  verified: boolean;
  alreadySolved?: boolean;
  xpAwarded?: number;
  newTotalXp?: number;
  newStreak?: number;
  submission?: {
    id: string;
    title: string;
    titleSlug: string;
    timestamp: string;
  };
  message: string;
}
