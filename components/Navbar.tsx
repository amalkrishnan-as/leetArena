"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Swords,
  Trophy,
  Users,
  LayoutDashboard,
  Star,
  Shield,
  LogOut,
  Zap,
  UserCircle,
} from "lucide-react";

const navItems = [
  { href: "/",            label: "Dashboard",   icon: LayoutDashboard },
  { href: "/arena",       label: "Arena",       icon: Swords },
  { href: "/h2h",         label: "H2H",         icon: Zap },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/players",     label: "Players",     icon: Users },
  { href: "/achievements",label: "Achievements",icon: Star },
  { href: "/league",      label: "League",      icon: Shield },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: "220px",
        background: "var(--bg-card)",
        borderRight: "1px solid var(--bg-border)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 1rem",
        zIndex: 50,
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: "2rem", paddingLeft: "0.5rem" }}>
        <span
          style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ⚔ LeetArena
        </span>
      </div>

      {/* Nav Links */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`nav-link ${isActive ? "active" : ""}`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Bottom: Profile + Sign Out */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "1rem", borderTop: "1px solid var(--bg-border)", paddingTop: "1rem" }}>
        <Link
          href="/profile"
          className={`nav-link ${pathname.startsWith("/profile") ? "active" : ""}`}
        >
          <UserCircle size={16} />
          Profile
        </Link>
        <button
          onClick={handleSignOut}
          className="nav-link"
          style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", color: "var(--text-secondary)" }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
