import { NextResponse } from "next/server";

import { withApiKey } from "@/lib/auth";
import { listActiveProtocols } from "@/lib/db/protocols";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiKey(async () => {
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
        issuer: {
          name: p.issuerName,
          jurisdiction: p.issuerJurisdiction ?? null,
        },
        websiteUrl: p.websiteUrl,
        estimatedApyBps: p.estimatedApyBps,
      })),
    },
    {
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    },
  );
});
