import { NextResponse } from "next/server";

import { runSnapshotJob, type SnapshotJobInput } from "@oxar/radar-core";

import { listActiveProtocols } from "@/lib/db/protocols";
import { insertSnapshots } from "@/lib/db/snapshots";
import { getServerEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron endpoint. Scheduled in `vercel.json`.
 *
 * Auth: when CRON_SECRET is set, Vercel sends it as
 *   `Authorization: Bearer <CRON_SECRET>`. Reject anything else.
 *
 * In local dev (no CRON_SECRET set) the endpoint is unauthenticated —
 * convenient for `curl localhost:3000/api/cron/snapshot` smoke tests.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const env = getServerEnv();

  if (env.cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${env.cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const start = Date.now();
  const protocols = await listActiveProtocols();

  const input: SnapshotJobInput = {
    protocols: protocols.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      chain: p.chain,
      category: p.category,
      contractAddress: p.contractAddress,
      decimals: p.decimals,
      description: p.description,
      issuerName: p.issuerName,
      issuerJurisdiction: p.issuerJurisdiction,
      websiteUrl: p.websiteUrl,
      estimatedApyBps: p.estimatedApyBps,
    })),
    ctx: {
      alchemyApiKey: env.alchemyApiKey,
      heliusApiKey: env.heliusApiKey,
    },
  };

  const result = await runSnapshotJob(input);
  await insertSnapshots(result.rows);

  return NextResponse.json({
    captured: result.rows.length,
    errors: result.errors,
    elapsedMs: Date.now() - start,
  });
}
