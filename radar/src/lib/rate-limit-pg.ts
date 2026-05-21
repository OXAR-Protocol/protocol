import "server-only";

import { getDb } from "./db/client";
import type { RateLimitResult } from "./rate-limit";

/**
 * Postgres-backed sliding-window rate limiter for API keys.
 *
 * Reads `radar.api_usage` (which the auth middleware appends to anyway)
 * and counts hits in the last 60 seconds. Avoids the cost of running
 * Upstash on top of an already-deployed Supabase Postgres.
 *
 * Tradeoff vs Redis: a small race window where two concurrent requests
 * both pass the check before either appends a usage row. For the
 * 60-req/min preview tier the overshoot is bounded to a handful of
 * requests, which is acceptable. Switch to a dedicated atomic-counter
 * table if/when paid tiers ship with stricter limits.
 */
export async function checkApiKeyRateLimit(
  apiKeyId: string,
  perMinute: number,
): Promise<RateLimitResult> {
  const sql = getDb();
  const oneMinAgo = new Date(Date.now() - 60_000);

  const rows = await sql<{ count: string }[]>`
    select count(*)::text as count
    from radar.api_usage
    where api_key_id = ${apiKeyId}
      and ts > ${oneMinAgo.toISOString()}
  `;

  const used = Number(rows[0]?.count ?? "0");
  const remaining = Math.max(0, perMinute - used - 1);
  return {
    allowed: used < perMinute,
    remaining,
    resetAt: Date.now() + 60_000,
  };
}
