import { NextResponse } from "next/server";

import { listActiveProtocols } from "@/lib/db/protocols";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
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
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
