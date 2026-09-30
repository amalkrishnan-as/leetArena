// Browser (client-side) Supabase client.
// Uses the public anon key. Safe to use in client components.
// Never use SUPABASE_SERVICE_ROLE_KEY here.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
