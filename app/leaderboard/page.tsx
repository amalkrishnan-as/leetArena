import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, Flame, Target } from "lucide-react";
import type { Player } from "@/types";

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: players } = await supabase
    .from("players")
    .select("id, display_name, leetcode_username, xp, solved, streak, h2h_wins, h2h_losses")
    .order("xp", { ascending: false })
    .limit(100);

  const allPlayers = (players ?? []) as Pick<Player, "id" | "display_name" | "leetcode_username" | "xp" | "solved" | "streak" | "h2h_wins" | "h2h_losses">[];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Trophy size={28} style={{ color: "#f59e0b" }} />
          Leaderboard
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          All-time rankings by total XP.
        </p>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--bg-border)" }}>
              {["Rank", "Player", "XP", "Solved", "Streak", "H2H"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "0.875rem 1rem",
                    textAlign: h === "Rank" ? "center" : "left",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allPlayers.map((p, i) => {
              const isMe = p.id === user.id;
              const rank = i + 1;
              return (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: "1px solid var(--bg-border)",
                    background: isMe ? "rgba(59,130,246,0.05)" : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = isMe
                      ? "rgba(59,130,246,0.08)"
                      : "var(--bg-card-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = isMe
                      ? "rgba(59,130,246,0.05)"
                      : "transparent";
                  }}
                >
                  <td style={{ padding: "0.875rem 1rem", textAlign: "center", width: "60px" }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: rank <= 3 ? "1rem" : "0.875rem",
                        color: rank === 1 ? "#ffd700" : rank === 2 ? "#c0c0c0" : rank === 3 ? "#cd7f32" : "var(--text-muted)",
                      }}
                    >
                      {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                    </span>
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <Link
                      href={`/players/${p.id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div style={{ fontWeight: 600, fontSize: "0.9375rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {p.display_name}
                        {isMe && (
                          <span style={{ fontSize: "0.75rem", color: "var(--accent-blue)", fontWeight: 500 }}>you</span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>@{p.leetcode_username}</div>
                    </Link>
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <span style={{ fontWeight: 700, color: "#f59e0b" }}>{p.xp.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <span style={{ color: "var(--accent-blue)", fontWeight: 600 }}>{p.solved}</span>
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: p.streak > 0 ? "#f59e0b" : "var(--text-muted)" }}>
                      {p.streak > 0 && <Flame size={13} />}
                      {p.streak}d
                    </span>
                  </td>
                  <td style={{ padding: "0.875rem 1rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      {p.h2h_wins}W–{p.h2h_losses}L
                    </span>
                  </td>
                </tr>
              );
            })}
            {allPlayers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                  No players yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
