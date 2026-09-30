import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shield, Trophy, Target, Flame, Star } from "lucide-react";
import type { Player } from "@/types";

export default async function LeaguePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Group players into League tiers based on XP
  const { data: allPlayers } = await supabase
    .from("players")
    .select("id, display_name, xp, solved, streak")
    .order("xp", { ascending: false });

  const players = (allPlayers ?? []) as Pick<Player, "id" | "display_name" | "xp" | "solved" | "streak">[];

  const tiers = [
    { name: "Diamond", icon: "💎", minXP: 5000, color: "#00bcd4" },
    { name: "Platinum", icon: "🔷", minXP: 2500, color: "#7e57c2" },
    { name: "Gold", icon: "🥇", minXP: 1000, color: "#ffd700" },
    { name: "Silver", icon: "🥈", minXP: 400, color: "#c0c0c0" },
    { name: "Bronze", icon: "🥉", minXP: 0, color: "#cd7f32" },
  ];

  function getTier(xp: number) {
    return tiers.find((t) => xp >= t.minXP) ?? tiers[tiers.length - 1];
  }

  const playerTier = getTier(
    players.find((p) => p.id === user.id)?.xp ?? 0
  );

  const tierGroups = tiers.map((tier) => ({
    tier,
    players: players.filter((p) => {
      const playerTierIndex = tiers.findIndex((t) => p.xp >= t.minXP);
      const tierIndex = tiers.indexOf(tier);
      return (
        playerTierIndex === tierIndex ||
        (playerTierIndex === -1 && tier === tiers[tiers.length - 1])
      );
    }),
  }));

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Shield size={28} style={{ color: "var(--accent-purple)" }} />
          League
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          Players grouped into tiers based on XP. Your current tier:{" "}
          <span style={{ fontWeight: 700 }}>
            {playerTier.icon} {playerTier.name}
          </span>
        </p>
      </div>

      {/* Tier thresholds */}
      <div className="card" style={{ padding: "1.25rem 1.5rem", marginBottom: "2rem" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "0.9375rem" }}>Tier Requirements</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {tiers.map((t) => (
            <div
              key={t.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.875rem",
                borderRadius: "8px",
                background: "var(--bg-base)",
                border: `1px solid ${t.name === playerTier.name ? t.color + "66" : "var(--bg-border)"}`,
                boxShadow: t.name === playerTier.name ? `0 0 0 1px ${t.color}33` : "none",
              }}
            >
              <span style={{ fontSize: "1.125rem" }}>{t.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.875rem", color: t.name === playerTier.name ? t.color : "var(--text-primary)" }}>
                  {t.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {t.minXP.toLocaleString()}+ XP
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {tierGroups
          .filter((g) => g.players.length > 0)
          .map(({ tier, players: tierPlayers }) => (
            <div key={tier.name}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.875rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{tier.icon}</span>
                <h2 style={{ fontWeight: 700, fontSize: "1.125rem" }}>{tier.name}</h2>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  {tierPlayers.length} {tierPlayers.length === 1 ? "player" : "players"}
                </span>
              </div>

              <div className="card" style={{ overflow: "hidden" }}>
                {tierPlayers.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.875rem 1.25rem",
                      borderBottom: i < tierPlayers.length - 1 ? "1px solid var(--bg-border)" : "none",
                      background: p.id === user.id ? "rgba(59,130,246,0.05)" : "transparent",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        color: "white",
                        flexShrink: 0,
                        fontSize: "0.9375rem",
                      }}
                    >
                      {p.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                        {p.display_name}
                        {p.id === user.id && (
                          <span style={{ marginLeft: "0.375rem", fontSize: "0.75rem", color: "var(--accent-blue)", fontWeight: 500 }}>you</span>
                        )}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.9375rem" }}>{p.xp.toLocaleString()}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>XP</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 600, color: "var(--accent-blue)", fontSize: "0.9375rem" }}>{p.solved}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Solved</div>
                      </div>
                      {p.streak > 0 && (
                        <div style={{ color: "#f59e0b", display: "flex", alignItems: "center", gap: "2px", fontSize: "0.875rem", fontWeight: 600 }}>
                          <Flame size={13} />
                          {p.streak}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
