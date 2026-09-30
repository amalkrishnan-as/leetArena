"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Swords } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const supabase = createClient();

    if (mode === "register") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/setup`,
        },
      });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage("Account created! Check your email to confirm, or proceed to set up your profile.");
        // Check if email confirmation is disabled (auto-confirm)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.push("/setup");
          router.refresh();
        }
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      } else {
        // Check if player profile exists
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: player } = await supabase
            .from("players")
            .select("id")
            .eq("id", user.id)
            .single();

          if (player) {
            router.push("/");
          } else {
            router.push("/setup");
          }
          router.refresh();
        }
      }
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
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Swords size={28} color="white" />
            </div>
          </div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "0.5rem",
            }}
          >
            LeetArena
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
            Competitive coding for friends
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "2rem" }}>
          {/* Tab toggle */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4px",
              background: "var(--bg-base)",
              borderRadius: "8px",
              padding: "4px",
              marginBottom: "1.75rem",
            }}
          >
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); setMessage(""); }}
                style={{
                  padding: "0.5rem",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  transition: "all 0.15s",
                  background: mode === m ? "var(--bg-card)" : "transparent",
                  color: mode === m ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
                }}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}
          {message && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>{message}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                Email
              </label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                Password
              </label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
                required
                minLength={mode === "register" ? 6 : 1}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: "0.5rem", width: "100%", justifyContent: "center", padding: "0.75rem" }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  {mode === "login" ? "Signing in…" : "Creating account…"}
                </span>
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          {/* Forgot password (only shown in login mode) */}
          {mode === "login" && (
            <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
              <button
                type="button"
                onClick={async () => {
                  if (!email) { setError("Enter your email address first."); return; }
                  const { createClient: cc } = await import("@/lib/supabase/client");
                  const supabase = cc();
                  await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
                  });
                  setMessage("Password reset email sent — check your inbox.");
                  setError("");
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.8125rem", textDecoration: "underline" }}
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          LeetArena uses official LeetCode to verify solutions.
          <br />No LeetCode password is ever required.
        </p>
      </div>
    </div>
  );
}
