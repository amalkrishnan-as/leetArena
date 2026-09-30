import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Swords, Trophy, Flame, Target, Zap, Users, Star } from "lucide-react";
import type { Player, Achievement, PlayerAchievement } from "@/types";

async function getDashboardData(userId: string) {
  const supabase = await createServerSupabaseClient();

  const [playerResult, achievementsResult, leaderboardResult] = await Promise.all([
    supabase.from("players").select("*").eq("id", userId).single(),
    supabase
      .from("player_achievements")
      .select("*, achievement:achievements(*)")
      .eq("player_id", userId)
      .order("unlocked_at", { ascending: false })
      .limit(5),
    supabase
      .from("players")
      .select("id, display_name, xp, solved, streak")
      .order("xp", { ascending: false })
      .limit(5),
  ]);

  return {
    player: playerResult.data as Player | null,
    recentAchievements: (achievementsResult.data ?? []) as PlayerAchievement[],
    leaderboard: (leaderboardResult.data ?? []) as Pick<Player, "id" | "display_name" | "xp" | "solved" | "streak">[],
  };
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem", color: color ?? "var(--text-secondary)" }}>
        {icon}
        <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>{value}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { player, recentAchievements, leaderboard } = await getDashboardData(user.id);

  if (!player) {
    redirect("/setup");
  }

  // Find player's rank
  const rank = leaderboard.findIndex((p) => p.id === user.id) + 1;
  const rankDisplay = rank > 0 ? `#${rank}` : "Unranked";

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Welcome */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.25rem" }}>
          Welcome back, {player.display_name} ⚔️
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          <span style={{ color: "var(--text-muted)" }}>LeetCode:</span>{" "}
          <a
            href={`https://leetcode.com/${player.leetcode_username}/`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent-blue)", textDecoration: "none" }}
          >
            {player.leetcode_username}
          </a>
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard icon={<Trophy size={16} />} label="XP" value={player.xp} color="var(--accent-yellow)" />
        <StatCard icon={<Target size={16} />} label="Solved" value={player.solved} color="var(--accent-blue)" />
        <StatCard icon={<Flame size={16} />} label="Streak" value={`${player.streak}d`} color="var(--accent-purple)" />
        <StatCard icon={<Zap size={16} />} label="H2H Record" value={`${player.h2h_wins}W-${player.h2h_losses}L`} color="var(--accent-green)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Arena CTA */}
        <div className="card" style={{ padding: "1.75rem", gridColumn: "span 2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Swords size={20} style={{ color: "var(--accent-blue)" }} />
                <h2 style={{ fontWeight: 700, fontSize: "1.125rem" }}>Arena</h2>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                Get a random LeetCode problem, solve it, earn XP.
              </p>
            </div>
            <Link href="/arena" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
              <Swords size={16} />
              Enter Arena
            </Link>
          </div>
        </div>

        {/* Leaderboard preview */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Trophy size={16} style={{ color: "var(--accent-yellow)" }} />
              Leaderboard
            </h3>
            <Link href="/leaderboard" style={{ fontSize: "0.8125rem", color: "var(--accent-blue)", textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {leaderboard.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  background: p.id === user.id ? "rgba(59,130,246,0.06)" : "transparent",
                }}
              >
                <span
                  style={{
                    width: "20px",
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "var(--text-muted)",
                    flexShrink: 0,
                    textAlign: "center",
                  }}
                >
                  #{i + 1}
                </span>
                <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: p.id === user.id ? 700 : 500 }}>
                  {p.display_name}
                  {p.id === user.id && (
                    <span style={{ marginLeft: "0.375rem", fontSize: "0.75rem", color: "var(--accent-blue)" }}>you</span>
                  )}
                </span>
                <span style={{ fontSize: "0.8125rem", color: "var(--accent-yellow)", fontWeight: 600 }}>
                  {p.xp} XP
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements preview */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Star size={16} style={{ color: "var(--accent-purple)" }} />
              Achievements
            </h3>
            <Link href="/achievements" style={{ fontSize: "0.8125rem", color: "var(--accent-blue)", textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          {recentAchievements.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              No achievements yet. Complete Arena challenges to earn them!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {recentAchievements.map((pa) => (
                <div key={pa.achievement_id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem" }}>
                  <span style={{ fontSize: "1.25rem" }}>{pa.achievement?.icon}</span>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{pa.achievement?.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{pa.achievement?.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
