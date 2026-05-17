import "server-only";

import postgres from "postgres";

import { getServerEnv } from "../env";

let cached: ReturnType<typeof postgres> | undefined;

/**
 * Direct Postgres client for the `radar` schema. Bypasses Supabase's
 * PostgREST layer because we don't need RLS for server-only data and
 * PostgREST requires per-schema dashboard exposure.
 *
 * Uses the Supabase EU-West-1 transaction pooler.
 */
export function getDb(): ReturnType<typeof postgres> {
  if (cached) return cached;

  const env = getServerEnv();
  const connectionString = buildConnectionString(env.supabaseUrl);

  cached = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ssl: "require",
  });

  return cached;
}

function buildConnectionString(supabaseUrl: string): string {
  const projectRef = extractProjectRef(supabaseUrl);
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (!dbPassword) {
    throw new Error("SUPABASE_DB_PASSWORD is not set");
  }

  const host = `aws-0-eu-west-1.pooler.supabase.com`;
  const user = `postgres.${projectRef}`;
  const encoded = encodeURIComponent(dbPassword);

  return `postgresql://${user}:${encoded}@${host}:5432/postgres`;
}

function extractProjectRef(url: string): string {
  const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  if (!match) throw new Error(`Cannot extract project ref from ${url}`);
  return match[1]!;
}
