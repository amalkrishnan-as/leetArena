import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Flame, Target, Zap, Star, ExternalLink } from "lucide-react";
import type { Player, PlayerAchievement, ProblemSolve } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch player first, then parallel queries
  const playerResult = await supabase.from("players").select("*").eq("id", id).single();

  if (!playerResult.data) notFound();

  const player = playerResult.data as Player;

  const [achievementsResult, solvesResult, rankCountResult] = await Promise.all([
    supabase
      .from("player_achievements")
      .select("*, achievement:achievements(*)")
      .eq("player_id", id)
      .order("unlocked_at", { ascending: false }),
    supabase
      .from("problem_solves")
      .select("id, problem_title, difficulty, xp_awarded, solved_at")
      .eq("player_id", id)
      .order("solved_at", { ascending: false })
      .limit(10),
    supabase
      .from("players")
      .select("*", { count: "exact", head: true })
      .gt("xp", player.xp),
  ]);

  const achievements = (achievementsResult.data ?? []) as PlayerAchievement[];
  const solves = (solvesResult.data ?? []) as ProblemSolve[];

  // Calculate rank
  const rank = (rankCountResult.count ?? 0) + 1;

  const isOwnProfile = user.id === id;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      {/* Back */}
      <Link
        href="/players"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "1.5rem" }}
      >
        <ArrowLeft size={15} />
        Players
      </Link>

      {/* Profile card */}
      <div className="card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5rem", flexWrap: "wrap" }}>
          {/* Avatar */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "1.75rem",
              color: "white",
              flexShrink: 0,
            }}
          >
            {player.display_name.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                {player.display_name}
              </h1>
              {isOwnProfile && (
                <span style={{ fontSize: "0.75rem", color: "var(--accent-blue)", fontWeight: 600 }}>you</span>
              )}
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: rank <= 3 ? "#f59e0b" : "var(--text-muted)" }}>
                #{rank}
              </span>
            </div>

            <a
              href={`https://leetcode.com/${player.leetcode_username}/`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.875rem", marginBottom: "1rem" }}
            >
              <ExternalLink size={13} />
              @{player.leetcode_username} on LeetCode
            </a>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.875rem" }}>
              {[
                { icon: <Trophy size={14} />, label: "XP", value: player.xp.toLocaleString(), color: "#f59e0b" },
                { icon: <Target size={14} />, label: "Solved", value: player.solved.toString(), color: "var(--accent-blue)" },
                { icon: <Flame size={14} />, label: "Streak", value: `${player.streak}d`, color: "var(--accent-purple)" },
                { icon: <Zap size={14} />, label: "H2H", value: `${player.h2h_wins}W/${player.h2h_losses}L`, color: "var(--accent-green)" },
              ].map(({ icon, label, value, color }) => (
                <div key={label} style={{ padding: "0.75rem", background: "var(--bg-base)", borderRadius: "8px", border: "1px solid var(--bg-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color, marginBottom: "0.25rem", fontSize: "0.75rem", fontWeight: 600 }}>
                    {icon}
                    {label}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1.125rem" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Star size={16} style={{ color: "var(--accent-purple)" }} />
          Achievements ({achievements.length})
        </h2>
        {achievements.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No achievements yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {achievements.map((pa) => (
              <div
                key={pa.achievement_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.875rem 1rem",
                  background: "var(--bg-base)",
                  borderRadius: "8px",
                  border: "1px solid var(--bg-border)",
                }}
              >
                <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{pa.achievement?.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{pa.achievement?.name}</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{pa.achievement?.description}</div>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>
                  {new Date(pa.unlocked_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent solves */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, marginBottom: "1rem" }}>Recent Solves</h2>
        {solves.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No solved problems yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {solves.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.75rem",
                  background: "var(--bg-base)",
                  borderRadius: "6px",
                  border: "1px solid var(--bg-border)",
                }}
              >
                <span
                  className={`difficulty-badge-${s.difficulty.toLowerCase()}`}
                  style={{ padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600, flexShrink: 0 }}
                >
                  {s.difficulty.charAt(0)}
                </span>
                <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500 }}>{s.problem_title}</span>
                <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0 }}>+{s.xp_awarded}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", flexShrink: 0 }}>
                  {new Date(s.solved_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
