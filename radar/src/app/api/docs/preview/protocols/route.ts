import { NextResponse } from "next/server";

import { listActiveProtocols } from "@/lib/db/protocols";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, unauthenticated proxy used by the live previews on /docs.
 *
 * No API key required — caps are IP-based instead. The proxy hits the
 * same listActiveProtocols() function the authenticated endpoint uses,
 * so the response shape is identical to /api/v1/protocols.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const ip = clientIpFrom(request);
  const limit = checkRateLimit(`docs-preview:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", resetAt: limit.resetAt },
      { status: 429 },
    );
  }

  const protocols = await listActiveProtocols();
  return NextResponse.json(
    {
      data: protocols.map((p) => ({
        slug: p.slug,
        name: p.name,
        chain: p.chain,
        category: p.category,
        contractAddress: p.contractAddress,
        decimals: p.decimals,
        description: p.description,
        issuer: { name: p.issuerName, jurisdiction: p.issuerJurisdiction ?? null },
        websiteUrl: p.websiteUrl,
        estimatedApyBps: p.estimatedApyBps,
      })),
    },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
