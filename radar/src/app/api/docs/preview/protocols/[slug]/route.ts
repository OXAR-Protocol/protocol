import { NextResponse } from "next/server";

import { getProtocolBySlug } from "@/lib/db/protocols";
import { getLatestSnapshot } from "@/lib/db/snapshots";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams): Promise<NextResponse> {
  const ip = clientIpFrom(request);
  const limit = checkRateLimit(`docs-preview:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", resetAt: limit.resetAt },
      { status: 429 },
    );
  }

  const { slug } = await params;
  const protocol = await getProtocolBySlug(slug);
  if (!protocol) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const snapshot = await getLatestSnapshot(protocol.id);
  return NextResponse.json(
    {
      slug: protocol.slug,
      name: protocol.name,
      chain: protocol.chain,
      category: protocol.category,
      contractAddress: protocol.contractAddress,
      decimals: protocol.decimals,
      description: protocol.description,
      issuer: { name: protocol.issuerName, jurisdiction: protocol.issuerJurisdiction ?? null },
      websiteUrl: protocol.websiteUrl,
      estimatedApyBps: protocol.estimatedApyBps,
      snapshot: snapshot
        ? {
            capturedAt: snapshot.ts,
            nav: snapshot.nav,
            tvlUsd: snapshot.tvl,
            holderCount: snapshot.holderCount,
            apyBps: snapshot.apyBps,
            top10ConcentrationPct: snapshot.top10ConcentrationPct,
            redemptionQueueUsd: snapshot.redemptionQueueUsd,
          }
        : null,
    },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
