import { NextResponse } from "next/server";

import { runAnalyze } from "@/lib/analyze";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

import type { Chain } from "@oxar/radar-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pinned demo wallets — keeps the live-preview endpoint from being
// abused as a free wallet-analyser proxy. Each address has known
// public exposure to RWA so the response is interesting.
const DEMO_WALLETS: Readonly<Record<string, { address: string; chain: Chain; label: string }>> = {
  "vitalik": {
    address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    chain: "ethereum",
    label: "vitalik.eth",
  },
  "ondo-treasury": {
    address: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    chain: "ethereum",
    label: "Sample treasury",
  },
};

interface PreviewBody {
  walletKey?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const ip = clientIpFrom(request);
  const limit = checkRateLimit(`docs-preview-analyze:${ip}`, 6, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", resetAt: limit.resetAt },
      { status: 429 },
    );
  }

  let body: PreviewBody;
  try {
    body = (await request.json()) as PreviewBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const walletKey = typeof body.walletKey === "string" ? body.walletKey : "vitalik";
  const demo = DEMO_WALLETS[walletKey];
  if (!demo) {
    return NextResponse.json({ error: "unknown_demo_wallet" }, { status: 400 });
  }

  try {
    const result = await runAnalyze({
      walletAddress: demo.address,
      chains: [demo.chain],
      language: "en",
    });
    return NextResponse.json({
      demoWallet: { key: walletKey, address: demo.address, label: demo.label },
      analysis: result.analysis,
      explanation: result.explanation,
    });
  } catch (err) {
    console.error("docs preview analyze failed", err);
    return NextResponse.json({ error: "analyze_failed" }, { status: 500 });
  }
}

export function GET(): NextResponse {
  return NextResponse.json(
    { demoWallets: Object.entries(DEMO_WALLETS).map(([key, w]) => ({ key, ...w })) },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
