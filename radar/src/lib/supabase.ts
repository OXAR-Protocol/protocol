import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getServerEnv } from "./env";

type RadarSupabaseClient = ReturnType<typeof createRadarClient>;

let cached: RadarSupabaseClient | undefined;

/**
 * Server-side Supabase client scoped to the `radar` schema.
 * Uses the service-role key, which bypasses RLS.
 * Never import this module from a client component — `server-only` will throw.
 */
export function getSupabaseAdmin(): RadarSupabaseClient {
  if (!cached) cached = createRadarClient();
  return cached;
}

function createRadarClient() {
  const env = getServerEnv();
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "radar" },
  });
}
