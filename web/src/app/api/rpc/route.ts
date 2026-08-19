import { NextResponse } from "next/server";

import { heliusApiKey } from "@/lib/helius/history";
import { isSameOrigin, isAllowedRpcBody } from "@/lib/rpc-proxy";

/**
 * The wallet's RPC, with our key kept on this side of it.
 *
 * `NEXT_PUBLIC_SOLANA_RPC_URL` carries an `api-key`, and NEXT_PUBLIC means the
 * browser gets it — a reviewer pointed out he could lift it out of the bundle and
 * spend our quota, which on a free plan is two requests a second for everyone at
 * once. This route takes the same JSON-RPC calls and makes them from the server,
 * where the key stays.
 *
 * Two guards, because a proxy that forwards anything to anyone is the same leak
 * wearing a different hat:
 *  - same origin only, so it serves this app rather than the internet;
 *  - one call per request, and only methods the app actually makes.
 *
 * NOT covered: websocket subscriptions. They can't run through a serverless
 * function, so live balance updates still connect to Helius directly — see
 * `NEXT_PUBLIC_SOLANA_WSS_URL` in `lib/constants.ts` for how to give that its own,
 * domain-locked key instead of the one that does the work.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM = "https://mainnet.helius-rpc.com";

export async function POST(req: Request) {
  if (!isSameOrigin(req.headers.get("origin"), req.url)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const key = heliusApiKey();
  if (!key) return NextResponse.json({ error: "RPC not configured" }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isAllowedRpcBody(body)) {
    return NextResponse.json({ error: "Method not allowed here" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${UPSTREAM}/?api-key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    // Pass the payload through untouched — a JSON-RPC error is a valid answer and
    // the wallet library knows what to do with it. Only the transport is ours.
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch (e) {
    console.error("RPC proxy error:", e);
    return NextResponse.json({ error: "RPC request failed" }, { status: 502 });
  }
}
