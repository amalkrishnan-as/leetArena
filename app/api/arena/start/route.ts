// POST /api/arena/start
//
// Atomically selects a random Arena problem and creates an arena_attempts
// row. Returns both the problem and the attempt ID together so the client
// can never hold a mismatched problem/attempt pair.
//
// Request body (optional):
//   { difficulty?: "Easy" | "Medium" | "Hard", topic?: string }
//
// Authorization: Bearer <Supabase access token>

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import type { Difficulty } from "@/types";

interface StartRequestBody {
  difficulty?: Difficulty;
  topic?: string;
}

export async function POST(req: NextRequest) {
  // ── Step 1: Authenticate the user ──────────────────────────
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "AUTH_REQUIRED", message: "You must be logged in." },
      { status: 401 }
    );
  }

  // ── Step 2: Parse optional filters ─────────────────────────
  let body: StartRequestBody = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    // Filters are optional — proceed with no filters
  }

  const { difficulty, topic } = body;

  // ── Step 3: Select a random problem ────────────────────────
  const { data: problems, error: problemError } = await adminSupabase.rpc(
    "get_random_arena_problem",
    {
      difficulty_filter: difficulty ?? null,
      topic_filter: topic ?? null,
    }
  );

  if (problemError) {
    console.error("[arena/start] Problem selection error:", problemError.message);
    return NextResponse.json(
      { error: "ARENA_PROBLEM_NOT_FOUND", message: "Could not select a problem." },
      { status: 500 }
    );
  }

  if (!problems || problems.length === 0) {
    return NextResponse.json(
      {
        error: "ARENA_PROBLEM_NOT_FOUND",
        message:
          difficulty || topic
            ? "No problems found with the selected filters."
            : "No Arena problems are available. Please run the problem sync script.",
      },
      { status: 404 }
    );
  }

  const problem = problems[0];

  // ── Step 4: Create an arena attempt (server owns the attempt) ─
  // We insert directly via adminSupabase so we get the DB-generated UUID.
  // player_id comes from the authenticated session — client cannot fake this.
  const { data: attempt, error: attemptError } = await adminSupabase
    .from("arena_attempts")
    .insert({
      player_id: user.id,
      problem_id: problem.id,
      status: "active",
    })
    .select("id, started_at")
    .single();

  if (attemptError || !attempt) {
    console.error("[arena/start] Attempt creation error:", attemptError?.message);
    return NextResponse.json(
      { error: "ATTEMPT_CREATE_FAILED", message: "Could not create Arena attempt." },
      { status: 500 }
    );
  }

  // ── Step 5: Return problem + attempt together ───────────────
  // The client stores these as ONE ActiveArenaChallenge object.
  // This prevents any mismatch between problem and attempt.
  return NextResponse.json({
    problem: {
      id: problem.id,
      slug: problem.slug,
      title: problem.title,
      difficulty: problem.difficulty,
      leetcode_url: problem.leetcode_url,
      xp: problem.xp,
      topics: problem.topics ?? [],
    },
    attempt: {
      id: attempt.id,
      startedAt: attempt.started_at,
    },
  });
}
