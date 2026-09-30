// POST /api/arena/verify
//
// Verifies that the authenticated user actually solved the Arena problem.
// The client sends ONLY the attemptId.
// The server derives: user identity, player's LeetCode username, problem slug
// — all from the database. The client cannot fake any of these.
//
// Verification steps:
//  A. Authenticate user
//  B. Load arena_attempt by attemptId
//  C. Verify attempt.player_id === auth user
//  D. Load problem from attempt.problem_id (never trust client-provided problem)
//  E. Load player's LeetCode username
//  F. Verify attempt is still active (not completed)
//  G. Query LeetCode recentAcSubmissionList
//  H. Find submission matching problem.slug
//  I. Verify submission.timestamp >= attempt.started_at
//  J. Call complete_verified_arena_solve() via admin client
//  K. Mark attempt completed
//  L. Return result

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { fetchRecentAcSubmissions } from "@/lib/leetcode/client";

interface VerifyRequestBody {
  attemptId: string;
}

export async function POST(req: NextRequest) {
  // ── A: Authenticate ────────────────────────────────────────
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

  // ── Parse body ─────────────────────────────────────────────
  let body: VerifyRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const { attemptId } = body;

  if (!attemptId || typeof attemptId !== "string") {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Missing attemptId." },
      { status: 400 }
    );
  }

  console.log(`[arena/verify] User ${user.id} verifying attempt ${attemptId}`);

  // ── B: Load the arena attempt ───────────────────────────────
  const { data: attempt, error: attemptError } = await adminSupabase
    .from("arena_attempts")
    .select("id, player_id, problem_id, started_at, completed_at, status")
    .eq("id", attemptId)
    .single();

  if (attemptError || !attempt) {
    console.error("[arena/verify] Attempt not found:", attemptId);
    return NextResponse.json(
      { error: "ARENA_ATTEMPT_NOT_FOUND", message: "Arena attempt not found." },
      { status: 404 }
    );
  }

  // ── C: Verify ownership ─────────────────────────────────────
  if (attempt.player_id !== user.id) {
    return NextResponse.json(
      { error: "ATTEMPT_NOT_OWNED", message: "This attempt does not belong to you." },
      { status: 403 }
    );
  }

  // ── F: Check attempt is still active ───────────────────────
  if (attempt.status === "completed" || attempt.completed_at !== null) {
    return NextResponse.json(
      {
        error: "ATTEMPT_ALREADY_COMPLETED",
        message: "This Arena attempt has already been completed.",
        verified: false,
        alreadySolved: true,
      },
      { status: 200 }
    );
  }

  // ── D: Load the problem from attempt.problem_id ────────────
  // We read problem_id FROM THE ATTEMPT — client never provides the problem ID.
  const { data: problem, error: problemError } = await adminSupabase
    .from("arena_problems")
    .select("id, slug, title, difficulty, xp")
    .eq("id", attempt.problem_id)
    .single();

  if (problemError || !problem) {
    console.error("[arena/verify] Problem not found:", attempt.problem_id);
    return NextResponse.json(
      { error: "ARENA_PROBLEM_NOT_FOUND", message: "Arena problem not found." },
      { status: 404 }
    );
  }

  // ── E: Load player's LeetCode username ─────────────────────
  const { data: player, error: playerError } = await adminSupabase
    .from("players")
    .select("leetcode_username")
    .eq("id", user.id)
    .single();

  if (playerError || !player) {
    return NextResponse.json(
      {
        error: "PLAYER_PROFILE_NOT_FOUND",
        message: "Player profile not found. Please complete your setup.",
      },
      { status: 404 }
    );
  }

  // ── G: Query LeetCode ───────────────────────────────────────
  const { submissions, error: lcError } = await fetchRecentAcSubmissions(
    player.leetcode_username,
    20
  );

  if (lcError === "UNAVAILABLE") {
    return NextResponse.json(
      {
        error: "LEETCODE_UNAVAILABLE",
        message:
          "LeetCode could not be reached right now. Please try again in a moment.",
        verified: false,
      },
      { status: 503 }
    );
  }

  if (lcError === "PROFILE_NOT_FOUND") {
    return NextResponse.json(
      {
        error: "LEETCODE_PROFILE_UNAVAILABLE",
        message: `LeetCode profile "${player.leetcode_username}" not found or is private.`,
        verified: false,
      },
      { status: 404 }
    );
  }

  // ── H: Find submission matching problem slug ────────────────
  const matchingSubmission = submissions.find(
    (s) => s.titleSlug === problem.slug
  );

  if (!matchingSubmission) {
    return NextResponse.json(
      {
        error: "SUBMISSION_NOT_FOUND",
        message: `No recent Accepted submission for "${problem.title}" found on LeetCode. Make sure you submitted on LeetCode and try again. (Note: only recent submissions appear in this list.)`,
        verified: false,
      },
      { status: 200 }
    );
  }

  // ── I: Verify timestamp — submission must be AFTER attempt started ──
  // LeetCode timestamps are Unix seconds (string). Convert to ms.
  const submissionTime = Number(matchingSubmission.timestamp) * 1000;
  const attemptStartTime = new Date(attempt.started_at).getTime();

  if (submissionTime < attemptStartTime) {
    const submissionDate = new Date(submissionTime).toISOString();
    const attemptDate = new Date(attemptStartTime).toISOString();
    console.log(
      `[arena/verify] Stale submission rejected. Submission: ${submissionDate}, Attempt started: ${attemptDate}`
    );
    return NextResponse.json(
      {
        error: "SUBMISSION_BEFORE_ATTEMPT",
        message:
          "That Accepted submission was made before this Arena challenge started. Please solve the problem after receiving the challenge.",
        verified: false,
      },
      { status: 200 }
    );
  }

  // ── J: Award XP via trusted server-side function ───────────
  // Only the admin (service_role) client can execute this function.
  // Authenticated users cannot call it directly.
  const { data: completionResult, error: completionError } =
    await adminSupabase.rpc("complete_verified_arena_solve", {
      target_player_id: user.id,
      arena_problem_id: problem.id,
    });

  if (completionError) {
    console.error("[arena/verify] Completion error:", completionError.message);
    return NextResponse.json(
      {
        error: "XP_AWARD_FAILED",
        message:
          "LeetCode was verified, but XP could not be recorded. Please contact support.",
        verified: false,
      },
      { status: 500 }
    );
  }

  const result = completionResult as {
    success: boolean;
    alreadySolved: boolean;
    xpAwarded: number;
    newTotalXp: number;
    newStreak: number;
    message: string;
  };

  // ── K: Mark attempt completed ───────────────────────────────
  if (!result.alreadySolved) {
    const { error: updateError } = await adminSupabase
      .from("arena_attempts")
      .update({ completed_at: new Date().toISOString(), status: "completed" })
      .eq("id", attemptId)
      .eq("player_id", user.id); // extra safety: only update own attempt

    if (updateError) {
      // Non-fatal — XP was already awarded. Log but don't fail.
      console.error("[arena/verify] Failed to mark attempt completed:", updateError.message);
    }
  }

  // ── L: Return result ────────────────────────────────────────
  return NextResponse.json({
    verified: true,
    alreadySolved: result.alreadySolved,
    xpAwarded: result.xpAwarded,
    newTotalXp: result.newTotalXp,
    newStreak: result.newStreak,
    submission: {
      id: matchingSubmission.id,
      title: matchingSubmission.title,
      titleSlug: matchingSubmission.titleSlug,
      timestamp: matchingSubmission.timestamp,
    },
    message: result.message,
  });
}
