import { NextResponse } from "next/server";

import { withApiKey } from "@/lib/auth";
import { getProtocolBySlug } from "@/lib/db/protocols";
import { getLatestSnapshot } from "@/lib/db/snapshots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiKey<{ slug: string }>(async (_req, { params }) => {
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
      issuer: {
        name: protocol.issuerName,
        jurisdiction: protocol.issuerJurisdiction ?? null,
      },
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
    {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    },
  );
});
