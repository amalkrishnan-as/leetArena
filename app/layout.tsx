import type { Metadata } from "next";
import "./globals.css";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "LeetArena — Competitive Coding for Friends",
  description:
    "A private competitive coding arena. Solve LeetCode problems, earn XP, maintain streaks, and compete with your friends.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pages that don't show the sidebar nav
  // (login/setup handle their own full-page layout)
  const showNav = !!user;

  return (
    <html lang="en">
      <body>
        {showNav && <Navbar />}
        <main
          style={{
            marginLeft: showNav ? "220px" : "0",
            minHeight: "100vh",
            padding: showNav ? "2rem" : "0",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
