import "server-only";

import { getDb } from "./client";

export interface UsageEntry {
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
}

export async function logUsage(entry: UsageEntry): Promise<void> {
  const sql = getDb();
  // Fire-and-forget: failure here must never block the response. The
  // caller already ignored the promise but we still swallow errors as
  // a defense in depth.
  try {
    await sql`
      insert into radar.api_usage
        (api_key_id, endpoint, method, status_code, latency_ms)
      values
        (${entry.apiKeyId}, ${entry.endpoint}, ${entry.method},
         ${entry.statusCode}, ${entry.latencyMs})
    `;
  } catch (err) {
    console.error("logUsage failed", err);
  }
}
