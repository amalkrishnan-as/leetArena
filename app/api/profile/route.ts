// PUT /api/profile
// Updates the current user's display_name and/or leetcode_username.

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";

interface ProfileUpdateBody {
  display_name?: string;
  leetcode_username?: string;
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "AUTH_REQUIRED", message: "You must be logged in." },
      { status: 401 }
    );
  }

  let body: ProfileUpdateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const updates: Record<string, string> = {};

  if (body.display_name !== undefined) {
    const dn = body.display_name.trim();
    if (dn.length < 2 || dn.length > 32) {
      return NextResponse.json(
        { error: "VALIDATION", message: "Display name must be 2–32 characters." },
        { status: 400 }
      );
    }
    updates.display_name = dn;
  }

  if (body.leetcode_username !== undefined) {
    const lc = body.leetcode_username.trim().toLowerCase();
    if (!/^[a-z0-9_-]+$/.test(lc)) {
      return NextResponse.json(
        { error: "VALIDATION", message: "Invalid LeetCode username format." },
        { status: 400 }
      );
    }
    updates.leetcode_username = lc;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "No updates provided." },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await adminSupabase
    .from("players")
    .update(updates)
    .eq("id", user.id)
    .select("display_name, leetcode_username")
    .single();

  if (updateError) {
    if (updateError.message.includes("unique")) {
      return NextResponse.json(
        { error: "DUPLICATE", message: "That LeetCode username is already linked to another account." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "UPDATE_FAILED", message: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, player: updated });
}
