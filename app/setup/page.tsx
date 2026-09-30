"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Code2 } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("players")
      .upsert({
        id: user.id,
        display_name: displayName.trim(),
        leetcode_username: leetcodeUsername.trim().toLowerCase(),
      });

    if (insertError) {
      if (insertError.message.includes("unique")) {
        setError("That LeetCode username is already linked to another account.");
      } else {
        setError(insertError.message);
      }
    } else {
      router.push("/");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        background: "var(--bg-base)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "440px" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Set Up Your Profile
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
            One-time setup. Enter your LeetCode username so we can verify your solutions.
          </p>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          {error && <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                <User size={14} />
                Display Name
              </label>
              <input
                className="input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you appear on the leaderboard"
                required
                minLength={2}
                maxLength={32}
              />
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                <Code2 size={14} />
                LeetCode Username
              </label>
              <input
                className="input"
                type="text"
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                placeholder="your-leetcode-username"
                required
                minLength={1}
                maxLength={64}
                pattern="[a-zA-Z0-9_-]+"
                title="LeetCode username (letters, numbers, hyphens, underscores)"
              />
              <p style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                This is your public LeetCode username — we never ask for your password.
                We use it to verify your recent Accepted submissions.
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: "0.25rem", width: "100%", justifyContent: "center", padding: "0.75rem" }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  Saving…
                </span>
              ) : (
                "Enter the Arena →"
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          You can update these details later from your profile.
        </p>
      </div>
    </div>
  );
}
