import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import type { Achievement, PlayerAchievement } from "@/types";

export default async function AchievementsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [allAchievementsResult, unlockedResult] = await Promise.all([
    supabase.from("achievements").select("*").order("created_at"),
    supabase
      .from("player_achievements")
      .select("achievement_id, unlocked_at")
      .eq("player_id", user.id),
  ]);

  const allAchievements = (allAchievementsResult.data ?? []) as Achievement[];
  const unlocked = new Map(
    ((unlockedResult.data ?? []) as { achievement_id: string; unlocked_at: string }[]).map((ua) => [
      ua.achievement_id,
      ua.unlocked_at,
    ])
  );

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <Star size={28} style={{ color: "var(--accent-purple)" }} />
          Achievements
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          {unlocked.size} of {allAchievements.length} unlocked.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {allAchievements.map((a) => {
          const unlockedAt = unlocked.get(a.id);
          const isUnlocked = !!unlockedAt;

          return (
            <div
              key={a.id}
              className="card"
              style={{
                padding: "1.25rem 1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                opacity: isUnlocked ? 1 : 0.45,
                filter: isUnlocked ? "none" : "grayscale(1)",
                transition: "opacity 0.2s",
              }}
            >
              <span style={{ fontSize: "2rem", flexShrink: 0 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.125rem" }}>
                  {a.name}
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  {a.description}
                </div>
              </div>
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                {isUnlocked ? (
                  <div>
                    <div style={{ color: "var(--accent-green)", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.125rem" }}>
                      ✓ Unlocked
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(unlockedAt!).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>Locked</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
