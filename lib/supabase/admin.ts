// Admin (service-role) Supabase client.
// IMPORTANT: This file must ONLY be imported in server-side code.
// It uses the SERVICE_ROLE_KEY which bypasses Row Level Security.
// Never import this in client components or expose to the browser.
//
// Using a lazy getter so Next.js build-time static analysis does not
// throw while pages are collected. The error will surface at runtime
// (when an API route is actually called) if the key is missing.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _adminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!key || !url) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. " +
        "These must be set in .env.local for server-side operations."
    );
  }

  _adminClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}

// Proxy object — looks like a regular SupabaseClient but initialises lazily.
// This lets Next.js import the module at build time without throwing.
export const adminSupabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getAdminClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
