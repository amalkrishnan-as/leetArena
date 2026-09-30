import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Trophy, Flame, Target, Zap } from "lucide-react";
import type { Player } from "@/types";

export default async function PlayersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: players } = await supabase
    .from("players")
    .select("id, display_name, leetcode_username, xp, solved, streak, h2h_wins, h2h_losses")
    .order("xp", { ascending: false });

  const allPlayers = (players ?? []) as Pick<Player, "id" | "display_name" | "leetcode_username" | "xp" | "solved" | "streak" | "h2h_wins" | "h2h_losses">[];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Users size={28} style={{ color: "var(--accent-blue)" }} />
          Players
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          {allPlayers.length} {allPlayers.length === 1 ? "player" : "players"} competing in LeetArena.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {allPlayers.map((p, i) => (
          <Link key={p.id} href={`/players/${p.id}`} style={{ textDecoration: "none" }}>
            <div
              className="card"
              style={{
                padding: "1.5rem",
                cursor: "pointer",
                transition: "all 0.15s",
                borderColor: p.id === user.id ? "rgba(59,130,246,0.3)" : undefined,
              }}
            >
              {/* Avatar + name */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "1.125rem",
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  {p.display_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {p.display_name}
                    {p.id === user.id && (
                      <span style={{ fontSize: "0.7rem", color: "var(--accent-blue)", fontWeight: 500 }}>you</span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    @{p.leetcode_username}
                  </div>
                </div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: i < 3 ? "#f59e0b" : "var(--text-muted)" }}>
                  #{i + 1}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#f59e0b" }}>{p.xp}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>XP</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--accent-blue)" }}>{p.solved}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Solved</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.125rem", fontWeight: 700, color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                    {p.streak > 0 && <Flame size={14} />}
                    {p.streak}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Streak</div>
                </div>
              </div>

              {(p.h2h_wins > 0 || p.h2h_losses > 0) && (
                <div style={{ marginTop: "0.875rem", paddingTop: "0.875rem", borderTop: "1px solid var(--bg-border)", fontSize: "0.8125rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Zap size={13} />
                  H2H: {p.h2h_wins}W – {p.h2h_losses}L
                </div>
              )}
            </div>
          </Link>
        ))}

        {allPlayers.length === 0 && (
          <div style={{ gridColumn: "1/-1", padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            No players yet.
          </div>
        )}
      </div>
    </div>
  );
}
