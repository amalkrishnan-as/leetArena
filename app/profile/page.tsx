import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileEditForm from "./ProfileEditForm";
import type { Player } from "@/types";

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!player) redirect("/setup");

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
          Your Profile
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          Update your display name or LeetCode username.
        </p>
      </div>

      <ProfileEditForm player={player as Player} email={user.email ?? ""} />
    </div>
  );
}
