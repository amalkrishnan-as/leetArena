// POST /api/h2h/create
// Creates a new H2H match. Player one is derived from auth.
// Player two is passed in the request body.
// Both players receive the same randomly selected problem.

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import type { Difficulty } from "@/types";

interface CreateH2HBody {
  playerTwoId: string;
  difficulty?: Difficulty;
}

export async function POST(req: NextRequest) {
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

  let body: CreateH2HBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const { playerTwoId, difficulty } = body;

  if (!playerTwoId) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Missing playerTwoId." },
      { status: 400 }
    );
  }

  if (playerTwoId === user.id) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "You cannot challenge yourself." },
      { status: 400 }
    );
  }

  // Verify player two exists
  const { data: playerTwo } = await adminSupabase
    .from("players")
    .select("id")
    .eq("id", playerTwoId)
    .single();

  if (!playerTwo) {
    return NextResponse.json(
      { error: "PLAYER_NOT_FOUND", message: "Opponent player not found." },
      { status: 404 }
    );
  }

  // Select a random problem for the match
  const { data: problems } = await adminSupabase.rpc(
    "get_random_arena_problem",
    { difficulty_filter: difficulty ?? null, topic_filter: null }
  );

  if (!problems || problems.length === 0) {
    return NextResponse.json(
      { error: "ARENA_PROBLEM_NOT_FOUND", message: "No problems available." },
      { status: 404 }
    );
  }

  const problem = problems[0];

  // Create the match
  const { data: match, error: matchError } = await adminSupabase
    .from("h2h_matches")
    .insert({
      player_one_id: user.id,
      player_two_id: playerTwoId,
      problem_id: problem.id,
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select("id, started_at")
    .single();

  if (matchError || !match) {
    console.error("[h2h/create] Match creation error:", matchError?.message);
    return NextResponse.json(
      { error: "MATCH_CREATE_FAILED", message: "Could not create H2H match." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    matchId: match.id,
    startedAt: match.started_at,
    problem: {
      id: problem.id,
      slug: problem.slug,
      title: problem.title,
      difficulty: problem.difficulty,
      leetcode_url: problem.leetcode_url,
      xp: problem.xp,
      topics: problem.topics ?? [],
    },
  });
}
