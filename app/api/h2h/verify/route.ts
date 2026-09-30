// POST /api/h2h/verify
// Verifies a player's H2H submission. Same timestamp architecture as Arena.
// After both players complete, determines the winner from LeetCode timestamps.

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { fetchRecentAcSubmissions } from "@/lib/leetcode/client";

interface H2HVerifyBody {
  matchId: string;
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

  let body: H2HVerifyBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const { matchId } = body;
  if (!matchId) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Missing matchId." },
      { status: 400 }
    );
  }

  // Load the match
  const { data: match, error: matchError } = await adminSupabase
    .from("h2h_matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    return NextResponse.json(
      { error: "MATCH_NOT_FOUND", message: "H2H match not found." },
      { status: 404 }
    );
  }

  const isPlayerOne = match.player_one_id === user.id;
  const isPlayerTwo = match.player_two_id === user.id;

  if (!isPlayerOne && !isPlayerTwo) {
    return NextResponse.json(
      { error: "NOT_A_PARTICIPANT", message: "You are not part of this match." },
      { status: 403 }
    );
  }

  if (match.status === "completed") {
    return NextResponse.json(
      { error: "MATCH_COMPLETED", message: "This match is already complete.", matchId },
      { status: 200 }
    );
  }

  // Load problem
  const { data: problem } = await adminSupabase
    .from("arena_problems")
    .select("id, slug, title")
    .eq("id", match.problem_id)
    .single();

  if (!problem) {
    return NextResponse.json(
      { error: "ARENA_PROBLEM_NOT_FOUND", message: "Problem not found." },
      { status: 404 }
    );
  }

  // Load current player profile
  const { data: player } = await adminSupabase
    .from("players")
    .select("leetcode_username")
    .eq("id", user.id)
    .single();

  if (!player) {
    return NextResponse.json(
      { error: "PLAYER_PROFILE_NOT_FOUND", message: "Player profile not found." },
      { status: 404 }
    );
  }

  // Fetch submissions
  const { submissions, error: lcError } = await fetchRecentAcSubmissions(
    player.leetcode_username,
    20
  );

  if (lcError) {
    return NextResponse.json(
      {
        error: "LEETCODE_UNAVAILABLE",
        message: "LeetCode could not be reached. Please try again.",
        verified: false,
      },
      { status: 503 }
    );
  }

  const matchingSubmission = submissions.find((s) => s.titleSlug === problem.slug);

  if (!matchingSubmission) {
    return NextResponse.json(
      {
        error: "SUBMISSION_NOT_FOUND",
        message: `No recent Accepted submission for "${problem.title}" found.`,
        verified: false,
      },
      { status: 200 }
    );
  }

  const submissionTime = Number(matchingSubmission.timestamp) * 1000;
  const matchStartTime = new Date(match.started_at).getTime();

  if (submissionTime < matchStartTime) {
    return NextResponse.json(
      {
        error: "SUBMISSION_BEFORE_MATCH",
        message: "That submission was made before the H2H match started.",
        verified: false,
      },
      { status: 200 }
    );
  }

  // Record this player's completion
  const updateData: Record<string, string> = {};
  if (isPlayerOne) {
    updateData.player_one_completed_at = new Date(submissionTime).toISOString();
  } else {
    updateData.player_two_completed_at = new Date(submissionTime).toISOString();
  }

  const { data: updatedMatch } = await adminSupabase
    .from("h2h_matches")
    .update(updateData)
    .eq("id", matchId)
    .select("player_one_completed_at, player_two_completed_at")
    .single();

  // Check if both players have completed
  const p1Time = updatedMatch?.player_one_completed_at;
  const p2Time = updatedMatch?.player_two_completed_at;

  if (p1Time && p2Time) {
    // Both completed — determine winner from verified LeetCode timestamps
    const p1Ms = new Date(p1Time).getTime();
    const p2Ms = new Date(p2Time).getTime();
    const winnerId = p1Ms <= p2Ms ? match.player_one_id : match.player_two_id;
    const loserId = winnerId === match.player_one_id ? match.player_two_id : match.player_one_id;

    // Update match result
    await adminSupabase
      .from("h2h_matches")
      .update({ status: "completed", winner_id: winnerId, completed_at: new Date().toISOString() })
      .eq("id", matchId);

    // Update H2H records
    await adminSupabase
      .from("players")
      .update({ h2h_wins: adminSupabase.rpc("h2h_wins + 1" as never) })
      .eq("id", winnerId);

    // Simple increment using raw SQL via RPC isn't available directly, so use select + update
    const { data: winnerPlayer } = await adminSupabase
      .from("players")
      .select("h2h_wins")
      .eq("id", winnerId)
      .single();
    const { data: loserPlayer } = await adminSupabase
      .from("players")
      .select("h2h_losses")
      .eq("id", loserId)
      .single();

    if (winnerPlayer) {
      await adminSupabase
        .from("players")
        .update({ h2h_wins: (winnerPlayer.h2h_wins ?? 0) + 1 })
        .eq("id", winnerId);
    }
    if (loserPlayer) {
      await adminSupabase
        .from("players")
        .update({ h2h_losses: (loserPlayer.h2h_losses ?? 0) + 1 })
        .eq("id", loserId);
    }

    return NextResponse.json({
      verified: true,
      matchComplete: true,
      winnerId,
      message: winnerId === user.id ? "You won! 🏆" : "Better luck next time.",
    });
  }

  return NextResponse.json({
    verified: true,
    matchComplete: false,
    message: "Your submission verified. Waiting for opponent.",
  });
}
