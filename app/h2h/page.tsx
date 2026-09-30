"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Zap, ExternalLink, CheckCircle, Loader2, AlertCircle, Users, RefreshCw, Clock } from "lucide-react";
import type { Player, H2HMatch, ArenaProblem } from "@/types";

type MatchWithProblem = H2HMatch & { problem: ArenaProblem };

type H2HState =
  | { phase: "idle" }
  | { phase: "selecting" }
  | { phase: "creating" }
  | { phase: "active"; match: MatchWithProblem; opponent: Player }
  | { phase: "waiting"; match: MatchWithProblem; opponent: Player }   // I solved, waiting for opponent
  | { phase: "verifying"; match: MatchWithProblem; opponent: Player }
  | { phase: "result"; won: boolean; message: string; problem: ArenaProblem }
  | { phase: "error"; message: string; prev?: MatchWithProblem };

const POLL_INTERVAL_MS = 10_000; // 10 seconds

export default function H2HPage() {
  const [state, setState] = useState<H2HState>({ phase: "idle" });
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Poll Supabase directly to see if match completed
  const pollMatchStatus = useCallback(async (matchId: string, match: MatchWithProblem, opponent: Player) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("h2h_matches")
      .select("status, winner_id, player_one_completed_at, player_two_completed_at")
      .eq("id", matchId)
      .single();

    if (!data) return;

    if (data.status === "completed") {
      if (pollRef.current) clearInterval(pollRef.current);
      setState({
        phase: "result",
        won: data.winner_id === currentUserId,
        message: data.winner_id === currentUserId ? "You Win! 🏆" : `${opponent.display_name} was faster. Better luck next time!`,
        problem: match.problem,
      });
    }
  }, [currentUserId]);

  function startPolling(matchId: string, match: MatchWithProblem, opponent: Player) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      pollMatchStatus(matchId, match, opponent);
    }, POLL_INTERVAL_MS);
  }

  async function loadPlayers() {
    setState({ phase: "selecting" });
    setLoadingPlayers(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("players")
      .select("*")
      .neq("id", currentUserId ?? "")
      .order("xp", { ascending: false });
    setPlayers((data ?? []) as Player[]);
    setLoadingPlayers(false);
  }

  async function createMatch(opponent: Player) {
    setState({ phase: "creating" });
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setState({ phase: "error", message: "You must be logged in." }); return; }

    const res = await fetch("/api/h2h/create", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ playerTwoId: opponent.id }),
    });

    const data = await res.json();
    if (!res.ok) { setState({ phase: "error", message: data.message ?? "Failed to create match." }); return; }

    const match: MatchWithProblem = {
      id: data.matchId,
      player_one_id: currentUserId ?? "",
      player_two_id: opponent.id,
      problem_id: data.problem.id,
      status: "active",
      created_at: new Date().toISOString(),
      started_at: data.startedAt,
      player_one_completed_at: null,
      player_two_completed_at: null,
      winner_id: null,
      completed_at: null,
      problem: data.problem,
    };

    setState({ phase: "active", match, opponent });
    // Start polling so the result shows automatically when both finish
    startPolling(data.matchId, match, opponent);
  }

  async function verifySolve() {
    if (state.phase !== "active") return;
    const { match, opponent } = state;
    setState({ phase: "verifying", match, opponent });

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setState({ phase: "error", message: "Session expired." }); return; }

    const res = await fetch("/api/h2h/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ matchId: match.id }),
    });

    const data = await res.json();

    if (!res.ok && !data.verified) {
      setState({ phase: "error", message: data.message ?? "Verification failed.", prev: match });
      return;
    }

    if (data.matchComplete) {
      if (pollRef.current) clearInterval(pollRef.current);
      setState({
        phase: "result",
        won: data.winnerId === currentUserId,
        message: data.message,
        problem: match.problem,
      });
    } else if (data.verified) {
      // My solve is verified — now waiting for opponent
      setState({ phase: "waiting", match, opponent });
      startPolling(match.id, match, opponent);
    } else {
      setState({ phase: "error", message: data.message ?? "Verification failed.", prev: match });
    }
  }

  function backToChallenge() {
    const s = state;
    if ((s.phase === "error") && s.prev) {
      setState({ phase: "active", match: s.prev, opponent: { id: "", display_name: "", leetcode_username: "", xp: 0, solved: 0, streak: 0, last_solved_at: null, h2h_wins: 0, h2h_losses: 0, created_at: "" } });
    } else {
      setState({ phase: "idle" });
    }
  }

  const activeProblem =
    state.phase === "active" || state.phase === "verifying" || state.phase === "waiting"
      ? state.match.problem
      : null;

  const activeOpponent =
    state.phase === "active" || state.phase === "verifying" || state.phase === "waiting"
      ? state.opponent
      : null;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Zap size={28} style={{ color: "var(--accent-green)" }} />
          Head-to-Head
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          Challenge a friend. Same problem. First verified Accepted submission wins.
        </p>
      </div>

      {/* ── IDLE ── */}
      {state.phase === "idle" && (
        <div className="card animate-fade-in" style={{ padding: "3rem", textAlign: "center", border: "1px dashed var(--bg-border)" }}>
          <Zap size={48} style={{ color: "var(--text-muted)", margin: "0 auto 1.5rem" }} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>Challenge a Friend</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.6 }}>
            Pick a player. You&apos;ll both get the same problem.
            <br />The first to submit an Accepted solution wins.
          </p>
          <button onClick={loadPlayers} className="btn btn-primary" style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}>
            <Users size={17} />
            Select Opponent
          </button>
        </div>
      )}

      {/* ── SELECTING ── */}
      {state.phase === "selecting" && (
        <div className="card animate-fade-in" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontWeight: 700, marginBottom: "1rem" }}>Select an Opponent</h2>
          {loadingPlayers ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)", margin: "0 auto" }} />
            </div>
          ) : players.length === 0 ? (
            <p style={{ color: "var(--text-muted)", padding: "1rem 0" }}>
              No other players found. Invite a friend to join LeetArena first!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => createMatch(p)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.875rem 1rem",
                    background: "var(--bg-base)",
                    border: "1px solid var(--bg-border)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    color: "var(--text-primary)",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--bg-border)")}
                >
                  <div
                    style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, color: "white", flexShrink: 0,
                    }}
                  >
                    {p.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.display_name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      @{p.leetcode_username} · {p.xp} XP · {p.h2h_wins}W/{p.h2h_losses}L
                    </div>
                  </div>
                  <span style={{ color: "var(--accent-blue)", fontSize: "0.875rem", fontWeight: 600 }}>Challenge →</span>
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setState({ phase: "idle" })} className="btn btn-ghost" style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }}>
            Cancel
          </button>
        </div>
      )}

      {/* ── CREATING ── */}
      {state.phase === "creating" && (
        <div className="card animate-fade-in" style={{ padding: "3rem", textAlign: "center" }}>
          <Loader2 size={36} className="animate-spin" style={{ color: "var(--accent-blue)", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-secondary)" }}>Picking a problem and creating the match…</p>
        </div>
      )}

      {/* ── ACTIVE (challenge shown, not yet solved) ── */}
      {(state.phase === "active" || state.phase === "verifying") && activeProblem && (
        <div className="animate-fade-in">
          {/* VS header */}
          <div className="card" style={{ padding: "1rem 1.5rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderColor: "rgba(16,185,129,0.25)" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              You <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>VS</span> {activeOpponent?.display_name}
            </span>
            <span style={{ fontSize: "0.8125rem", color: "#10b981", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 2s infinite" }} />
              Live
            </span>
          </div>

          <div className="card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
              <span
                className={`difficulty-badge-${activeProblem.difficulty.toLowerCase()}`}
                style={{ padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.8125rem", fontWeight: 600 }}
              >
                {activeProblem.difficulty}
              </span>
              <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.875rem" }}>+{activeProblem.xp} XP to winner</span>
            </div>

            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", letterSpacing: "-0.02em" }}>
              {activeProblem.title}
            </h2>

            {activeProblem.topics && activeProblem.topics.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {activeProblem.topics.map((t) => (
                  <span key={t} className="topic-tag">{t}</span>
                ))}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <a
                href={activeProblem.leetcode_url}
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
                  <><Loader2 size={17} className="animate-spin" /> Verifying with LeetCode…</>
                ) : (
                  <><CheckCircle size={17} /> I Solved It — Verify</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── WAITING (I solved, polling for opponent) ── */}
      {state.phase === "waiting" && activeProblem && (
        <div className="animate-fade-in">
          <div className="card" style={{ padding: "1rem 1.5rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderColor: "rgba(16,185,129,0.25)" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              You <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>VS</span> {activeOpponent?.display_name}
            </span>
          </div>

          <div className="card" style={{ padding: "2.5rem", textAlign: "center" }}>
            <CheckCircle size={40} style={{ color: "var(--easy)", margin: "0 auto 1rem" }} />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--easy)" }}>
              Your solve verified! ✅
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Waiting for <strong>{activeOpponent?.display_name}</strong> to finish…
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              <Clock size={14} />
              Auto-checking every 10 seconds
              <RefreshCw size={14} className="animate-spin" />
            </div>
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {state.phase === "result" && (
        <div className="card animate-fade-in" style={{
          padding: "2.5rem",
          textAlign: "center",
          borderColor: state.won ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.2)",
          background: state.won ? "rgba(16,185,129,0.03)" : "transparent",
        }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>{state.won ? "🏆" : "💪"}</div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem", color: state.won ? "var(--easy)" : "var(--hard)", letterSpacing: "-0.02em" }}>
            {state.won ? "You Win!" : "You Lose"}
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.9375rem" }}>
            {state.message}
          </p>
          <button onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setState({ phase: "idle" }); }} className="btn btn-primary" style={{ justifyContent: "center", fontSize: "1rem", padding: "0.875rem 2rem" }}>
            New Battle
          </button>
        </div>
      )}

      {/* ── ERROR ── */}
      {state.phase === "error" && (
        <div className="animate-fade-in">
          <div className="alert alert-error" style={{ marginBottom: "1rem", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "1px" }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Error</div>
              <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>{state.message}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {state.prev && (
              <button onClick={backToChallenge} className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
                Try Again
              </button>
            )}
            <button onClick={() => setState({ phase: "idle" })} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
