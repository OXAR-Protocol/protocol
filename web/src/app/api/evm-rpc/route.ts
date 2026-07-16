import { NextResponse } from "next/server";

import { alchemySubdomainFor } from "@/lib/evm/rpc-proxy";
import { fetchWithRetry } from "@oxar/sdk";

// Server-side EVM JSON-RPC proxy → Alchemy. Keeps the Alchemy key off the client
// and gives EVM reads (allowance, receipts) a reliable RPC instead of the wallet's
// (often invalid) session RPC. Passes the JSON-RPC body through verbatim so both
// single and batch requests work.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) return NextResponse.json({ error: "EVM RPC unavailable" }, { status: 503 });

  const subdomain = alchemySubdomainFor(
    Number(new URL(req.url).searchParams.get("chainId")),
  );
  if (!subdomain) return NextResponse.json({ error: "Unsupported chain" }, { status: 400 });

  let body: string;
  try {
    body = JSON.stringify(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const res = await fetchWithRetry(`https://${subdomain}.g.alchemy.com/v2/${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    // Pass the JSON-RPC response through unchanged (preserves batch arrays + error shape).
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "EVM RPC request failed" }, { status: 502 });
  }
}
