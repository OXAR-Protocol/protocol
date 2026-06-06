import { NextResponse } from "next/server";

import { heliusApiKey, fetchEnhancedHistory } from "@/lib/helius/history";
import { parseActivity, type ActivityEvent } from "@/lib/activity/parse";
import { XSTOCKS } from "@/lib/yield/xstocks";
import { GOLD } from "@/lib/yield/gold";

// Recent-activity feed from the wallet's on-chain history (Helius, key server-side).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDY = "A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6";
const MAX_EVENTS = 12;

// Mint → display name for the held assets we recognise (Ondo USDY + stocks + gold).
const ASSET_NAMES: Record<string, string> = {
  [USDY]: "Ondo USDY",
  ...Object.fromEntries(XSTOCKS.map((s) => [s.mint, s.name])),
  ...Object.fromEntries(GOLD.map((g) => [g.mint, g.name])),
};

const isAddress = (a: unknown): a is string =>
  typeof a === "string" && a.length >= 32 && a.length <= 44;

// Server cache (owner → events), 2 min — history changes only on new txs.
const cache = new Map<string, { at: number; events: ActivityEvent[] }>();
const TTL = 120_000;

export async function POST(req: Request) {
  const key = heliusApiKey();
  if (!key) return NextResponse.json({ error: "Activity unavailable" }, { status: 503 });

  let owner: unknown;
  try {
    ({ owner } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!isAddress(owner)) return NextResponse.json({ error: "Invalid owner" }, { status: 400 });

  const cached = cache.get(owner);
  if (cached && Date.now() - cached.at < TTL) {
    return NextResponse.json({ events: cached.events });
  }

  try {
    const txs = await fetchEnhancedHistory(owner, key);
    const events = parseActivity(txs, owner, USDC, ASSET_NAMES).slice(0, MAX_EVENTS);
    cache.set(owner, { at: Date.now(), events });
    return NextResponse.json({ events });
  } catch (e) {
    console.error("Activity route error:", e);
    return NextResponse.json({ error: "Activity request failed" }, { status: 502 });
  }
}
