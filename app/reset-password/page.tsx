"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Swords, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
    } else {
      setDone(true);
      setTimeout(() => router.push("/"), 2500);
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
                width: "56px", height: "56px", borderRadius: "14px",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Swords size={28} color="white" />
            </div>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
            Reset Password
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
            Choose a new password for your LeetArena account.
          </p>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
          {done ? (
            <div style={{ textAlign: "center" }}>
              <CheckCircle size={40} style={{ color: "var(--easy)", margin: "0 auto 1rem" }} />
              <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Password Updated!</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                Redirecting to your dashboard…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {error && (
                <div className="alert alert-error" style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    style={{ paddingRight: "2.75rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    style={{
                      position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                      padding: 0, display: "flex",
                    }}
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                  Confirm Password
                </label>
                <input
                  className="input"
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Same as above"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ justifyContent: "center", padding: "0.75rem", marginTop: "0.25rem" }}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Updating…</>
                ) : (
                  "Set New Password"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
      </div>
    }>
      <ResetForm />
    </Suspense>
  );
}
