// Server-side Supabase client.
// Uses the public anon key but reads cookies for session context.
// Use in Server Components and Route Handlers where user session is needed.
// This is NOT the admin client — it still respects RLS.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can be called from Server Components where mutation is not possible.
            // This is fine — the middleware will handle session refresh.
          }
        },
      },
    }
  );
}
