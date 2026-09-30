"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ActiveArenaChallenge, Difficulty, ArenaVerifyResponse } from "@/types";
import {
  Swords,
  ExternalLink,
  CheckCircle,
  RotateCcw,
  Loader2,
  Trophy,
  Flame,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

type ArenaState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "challenge"; challenge: ActiveArenaChallenge }
  | { phase: "verifying"; challenge: ActiveArenaChallenge }
  | { phase: "success"; challenge: ActiveArenaChallenge; result: ArenaVerifyResponse }
  | { phase: "error"; challenge: ActiveArenaChallenge | null; message: string };

const DIFFICULTY_OPTIONS: (Difficulty | "Any")[] = ["Any", "Easy", "Medium", "Hard"];

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const cls = `difficulty-badge-${difficulty.toLowerCase()}`;
  return (
    <span
      className={cls}
      style={{ padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.8125rem", fontWeight: 600 }}
    >
      {difficulty}
    </span>
  );
}

function XpBadge({ xp }: { xp: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b", fontSize: "0.875rem", fontWeight: 700 }}>
      <Trophy size={14} />
      +{xp} XP
    </span>
  );
}

export default function ArenaPage() {
  const [state, setState] = useState<ArenaState>({ phase: "idle" });
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "Any">("Any");

  // Fetch a new challenge from the server.
  // The server atomically picks a problem and creates the attempt.
  // We store problem + attemptId together as one ActiveArenaChallenge.
  const startChallenge = useCallback(async () => {
    setState({ phase: "loading" });

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setState({ phase: "error", challenge: null, message: "You must be logged in." });
      return;
    }

    const body: { difficulty?: Difficulty } = {};
    if (selectedDifficulty !== "Any") {
      body.difficulty = selectedDifficulty;
    }

    const res = await fetch("/api/arena/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setState({
        phase: "error",
        challenge: null,
        message: data.message ?? "Failed to start a challenge.",
      });
      return;
    }

    // Store problem + attempt as one atomic object.
    // This is the key invariant: they always travel together.
    const challenge: ActiveArenaChallenge = {
      problem: data.problem,
      attempt: data.attempt,
    };

    setState({ phase: "challenge", challenge });
  }, [selectedDifficulty]);

  // Submit verification. The server only needs the attemptId.
  // It derives the problem from the attempt, and the LeetCode username from the player profile.
  const verifySolve = useCallback(async () => {
    if (state.phase !== "challenge") return;
    const challenge = state.challenge;

    setState({ phase: "verifying", challenge });

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setState({ phase: "error", challenge, message: "Session expired. Please log in again." });
      return;
    }

    const res = await fetch("/api/arena/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        // The server only needs the attemptId — it derives everything else.
        attemptId: challenge.attempt.id,
      }),
    });

    const data: ArenaVerifyResponse & { error?: string; message?: string } = await res.json();

    if (!res.ok) {
      setState({
        phase: "error",
        challenge,
        message: data.message ?? "Verification failed.",
      });
      return;
    }

    if (data.verified || data.alreadySolved) {
      setState({ phase: "success", challenge, result: data });
    } else {
      // Not verified — show the message but keep the challenge active so they can retry
      setState({
        phase: "error",
        challenge,
        message: data.message ?? "Verification failed.",
      });
    }
  }, [state]);

  function dismissError() {
    const s = state;
    if (s.phase === "error" && s.challenge) {
      setState({ phase: "challenge", challenge: s.challenge });
    } else {
      setState({ phase: "idle" });
    }
  }

  const challenge =
    state.phase === "challenge" ||
    state.phase === "verifying" ||
    state.phase === "success"
      ? state.challenge
      : state.phase === "error"
      ? state.challenge
      : null;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.5rem",
          }}
        >
          <Swords size={28} style={{ color: "var(--accent-blue)" }} />
          Arena
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          Get a random challenge. Solve it on LeetCode. Earn XP.
        </p>
      </div>

      {/* Filters (only show when idle or between challenges) */}
      {(state.phase === "idle" || state.phase === "success") && (
        <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            Difficulty:
          </span>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDifficulty(d)}
                style={{
                  padding: "0.3rem 0.875rem",
                  borderRadius: "999px",
                  border: "1px solid",
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  transition: "all 0.15s",
                  borderColor: selectedDifficulty === d
                    ? d === "Easy" ? "var(--easy)"
                      : d === "Medium" ? "var(--medium)"
                      : d === "Hard" ? "var(--hard)"
                      : "var(--accent-blue)"
                    : "var(--bg-border)",
                  background: selectedDifficulty === d ? "rgba(59,130,246,0.1)" : "transparent",
                  color: selectedDifficulty === d
                    ? d === "Easy" ? "var(--easy)"
                      : d === "Medium" ? "var(--medium)"
                      : d === "Hard" ? "var(--hard)"
                      : "var(--accent-blue)"
                    : "var(--text-secondary)",
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* === IDLE STATE === */}
      {state.phase === "idle" && (
        <div
          className="card animate-fade-in"
          style={{
            padding: "3rem",
            textAlign: "center",
            border: "1px dashed var(--bg-border)",
          }}
        >
          <Swords size={48} style={{ color: "var(--text-muted)", margin: "0 auto 1.5rem" }} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            Ready for a Challenge?
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9375rem" }}>
            Press the button to receive a random LeetCode problem.
            <br />
            Solve it on LeetCode, then come back to claim your XP.
          </p>
          <button onClick={startChallenge} className="btn btn-primary" style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}>
            <Swords size={18} />
            Get a Challenge
          </button>
        </div>
      )}

      {/* === LOADING STATE === */}
      {state.phase === "loading" && (
        <div className="card animate-fade-in" style={{ padding: "3rem", textAlign: "center" }}>
          <Loader2 size={36} className="animate-spin" style={{ color: "var(--accent-blue)", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-secondary)" }}>Selecting a problem for you…</p>
        </div>
      )}

      {/* === ERROR STATE === */}
      {state.phase === "error" && (
        <div className="animate-fade-in">
          <div className="alert alert-error" style={{ marginBottom: "1rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Verification failed</div>
              <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>{state.message}</div>
            </div>
          </div>
          {state.challenge ? (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={dismissError} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
                Try Again
              </button>
              <button onClick={startChallenge} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
                <RotateCcw size={15} />
                New Challenge
              </button>
            </div>
          ) : (
            <button onClick={startChallenge} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Get a Challenge
            </button>
          )}
        </div>
      )}

      {/* === CHALLENGE CARD === */}
      {(state.phase === "challenge" || state.phase === "verifying") && challenge && (
        <div className="card animate-fade-in" style={{ padding: "2rem" }}>
          {/* Problem header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <DifficultyBadge difficulty={challenge.problem.difficulty} />
              <XpBadge xp={challenge.problem.xp} />
            </div>
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", letterSpacing: "-0.02em" }}>
            {challenge.problem.title}
          </h2>

          {/* Topics */}
          {challenge.problem.topics && challenge.problem.topics.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {challenge.problem.topics.map((t) => (
                <span key={t} className="topic-tag">{t}</span>
              ))}
            </div>
          )}

          <hr style={{ border: "none", borderTop: "1px solid var(--bg-border)", marginBottom: "1.5rem" }} />

          {/* Started at */}
          <div style={{ marginBottom: "1.5rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            Challenge started:{" "}
            <span style={{ color: "var(--text-secondary)" }}>
              {new Date(challenge.attempt.startedAt).toLocaleTimeString()}
            </span>
            {" "}· Only submissions after this time count.
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <a
              href={challenge.problem.leetcode_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ justifyContent: "center", fontSize: "1rem", padding: "0.875rem" }}
            >
              <ExternalLink size={17} />
              Solve on LeetCode
            </a>

            <button
              onClick={verifySolve}
              disabled={state.phase === "verifying"}
              className="btn btn-green"
              style={{ justifyContent: "center", fontSize: "1rem", padding: "0.875rem" }}
            >
              {state.phase === "verifying" ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <CheckCircle size={17} />
                  I Solved It
                </>
              )}
            </button>

            <button
              onClick={startChallenge}
              disabled={state.phase === "verifying"}
              className="btn btn-ghost"
              style={{ justifyContent: "center" }}
            >
              <RotateCcw size={15} />
              Give Me Another
            </button>
          </div>
        </div>
      )}

      {/* === SUCCESS STATE === */}
      {state.phase === "success" && challenge && (
        <div className="animate-fade-in">
          <div
            className="card"
            style={{
              padding: "2.5rem",
              textAlign: "center",
              borderColor: "rgba(16, 185, 129, 0.3)",
              background: "rgba(16, 185, 129, 0.04)",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--easy)" }}>
              {state.result.alreadySolved ? "Already Completed!" : "Verified!"}
            </h2>

            {!state.result.alreadySolved && (
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "#f59e0b",
                  margin: "0.75rem 0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <Trophy size={28} />
                +{state.result.xpAwarded} XP
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1rem" }}>
              {state.result.newTotalXp !== undefined && (
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Total XP</div>
                  <div style={{ fontWeight: 700, fontSize: "1.125rem" }}>{state.result.newTotalXp}</div>
                </div>
              )}
              {state.result.newStreak !== undefined && (
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Streak</div>
                  <div style={{ fontWeight: 700, fontSize: "1.125rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Flame size={16} style={{ color: "var(--accent-yellow)" }} />
                    {state.result.newStreak}
                  </div>
                </div>
              )}
            </div>

            <p style={{ color: "var(--text-secondary)", marginTop: "1rem", fontSize: "0.9rem" }}>
              {state.result.message}
            </p>
          </div>

          {/* Next challenge button */}
          <button onClick={startChallenge} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: "1rem", padding: "0.875rem" }}>
            <RotateCcw size={17} />
            Next Challenge
          </button>
        </div>
      )}
    </div>
  );
}
