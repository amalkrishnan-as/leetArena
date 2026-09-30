"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Code2, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import type { Player } from "@/types";

interface Props {
  player: Player;
  email: string;
}

export default function ProfileEditForm({ player, email }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(player.display_name);
  const [leetcodeUsername, setLeetcodeUsername] = useState(player.leetcode_username);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Password reset
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({
        display_name: displayName,
        leetcode_username: leetcodeUsername,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("success");
      setMessage("Profile updated successfully.");
      router.refresh();
    } else {
      setStatus("error");
      setMessage(data.message ?? "Update failed.");
    }

    setLoading(false);
  }

  async function handlePasswordReset() {
    setResetLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setResetLoading(false);
    setResetSent(!error);
  }

  const unchanged =
    displayName === player.display_name && leetcodeUsername === player.leetcode_username;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Profile info card */}
      <div className="card" style={{ padding: "2rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.0625rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <User size={16} style={{ color: "var(--accent-blue)" }} />
          Profile Details
        </h2>

        {status === "success" && (
          <div className="alert alert-success" style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <CheckCircle size={16} />
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="alert alert-error" style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <AlertCircle size={16} />
            {message}
          </div>
        )}

        <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Read-only email */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              <Mail size={14} />
              Email
            </label>
            <input
              className="input"
              type="email"
              value={email}
              disabled
              style={{ opacity: 0.5, cursor: "not-allowed" }}
            />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
              <User size={14} />
              Display Name
            </label>
            <input
              className="input"
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setStatus("idle"); }}
              minLength={2}
              maxLength={32}
              required
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
              onChange={(e) => { setLeetcodeUsername(e.target.value); setStatus("idle"); }}
              pattern="[a-zA-Z0-9_-]+"
              required
            />
            <p style={{ marginTop: "0.375rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Must match your exact public LeetCode username — used for submission verification.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || unchanged}
            className="btn btn-primary"
            style={{ justifyContent: "center", padding: "0.75rem" }}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Saving…</>
            ) : unchanged ? (
              "No changes"
            ) : (
              "Save Changes"
            )}
          </button>
        </form>
      </div>

      {/* Account security card */}
      <div className="card" style={{ padding: "2rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.0625rem", marginBottom: "0.5rem" }}>
          Account Security
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
          Send a password reset link to <strong>{email}</strong>.
        </p>

        {resetSent ? (
          <div className="alert alert-success" style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <CheckCircle size={16} />
            Password reset email sent. Check your inbox.
          </div>
        ) : (
          <button
            onClick={handlePasswordReset}
            disabled={resetLoading}
            className="btn btn-secondary"
            style={{ justifyContent: "center" }}
          >
            {resetLoading ? (
              <><Loader2 size={15} className="animate-spin" /> Sending…</>
            ) : (
              "Send Password Reset Email"
            )}
          </button>
        )}
      </div>

      {/* Stats snapshot */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.0625rem", marginBottom: "1rem" }}>
          Your Stats
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem" }}>
          {[
            { label: "XP", value: player.xp.toLocaleString(), color: "#f59e0b" },
            { label: "Solved", value: player.solved.toString(), color: "var(--accent-blue)" },
            { label: "Streak", value: `${player.streak}d`, color: "var(--accent-purple)" },
            { label: "H2H", value: `${player.h2h_wins}W/${player.h2h_losses}L`, color: "var(--accent-green)" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
