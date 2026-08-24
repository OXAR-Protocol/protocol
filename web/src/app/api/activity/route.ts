import { NextResponse } from "next/server";

import { heliusApiKey } from "@/lib/helius/history";
import { getWalletHistory } from "@/lib/helius/wallet-history";
import { parseActivity, type ActivityEvent } from "@/lib/activity/parse";
import { PROVIDERS } from "@/lib/yield/registry";
import { JL_USDC, JL_USDT } from "@/lib/yield/position-mints";
import { isPriceExposure } from "@/lib/yield/assets";
import { isSameOrigin } from "@/lib/rpc-proxy";

// Recent-activity feed from the wallet's on-chain history (Helius, key server-side).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
/** The feed shows the latest few; the history view asks for everything. */
const DEFAULT_EVENTS = 12;
const MAX_EVENTS = 500;
/** Pages of 100 txs. The feed only needs the recent ones; a history view wants depth. */
const FEED_PAGES = 8;
const HISTORY_PAGES = 25;

// Mint → display name, taken from the provider registry rather than a hand-kept list:
// the old list covered stocks, gold and USDY only, so deposits into Jupiter Lend,
// Maple and OnRe were classified as an anonymous "Deposited" with no asset name.
const ASSET_DECIMALS: Record<string, number> = Object.fromEntries(
  PROVIDERS.filter((p) => p.heldMint && p.heldDecimals !== undefined).map((p) => [
    p.heldMint as string,
    p.heldDecimals as number,
  ]),
);

// Which held mints are a THING YOU BUY (stock, gold) versus somewhere you PUT money
// (a savings source). Jupiter Lend's receipt tokens aren't in PROVIDERS' heldMint, so
// they're named explicitly below and belong here too.
const ASSET_IS_PRICE: Record<string, boolean> = {
  ...Object.fromEntries(
    PROVIDERS.filter((p) => p.heldMint).map((p) => [p.heldMint as string, isPriceExposure(p.id)]),
  ),
  [JL_USDC]: false,
  [JL_USDT]: false,
};

const ASSET_NAMES: Record<string, string> = {
  ...Object.fromEntries(
    PROVIDERS.filter((p) => p.heldMint).map((p) => [p.heldMint as string, p.name]),
  ),
  [JL_USDC]: "Jupiter Lend USDC",
  [JL_USDT]: "Jupiter Lend USDT",
};

const isAddress = (a: unknown): a is string =>
  typeof a === "string" && a.length >= 32 && a.length <= 44;

// Server cache (owner → events), 2 min — history changes only on new txs.
const cache = new Map<string, { at: number; events: ActivityEvent[] }>();
const TTL = 120_000;

export async function POST(req: Request) {
  // Our Helius quota pays for these. A stranger's page may not spend it — the
  // data is public on-chain, the two requests a second are not.
  if (!isSameOrigin(req.headers.get("origin"), req.url)) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const key = heliusApiKey();
  if (!key) return NextResponse.json({ error: "Activity unavailable" }, { status: 503 });

  let owner: unknown;
  let limit: unknown;
  try {
    ({ owner, limit } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!isAddress(owner)) return NextResponse.json({ error: "Invalid owner" }, { status: 400 });
  const want = Math.min(
    Math.max(typeof limit === "number" ? Math.floor(limit) : DEFAULT_EVENTS, 1),
    MAX_EVENTS,
  );

  // Cached per depth: the feed's 12 must not satisfy a request for the full history,
  // which is exactly how a "show more" that revealed nothing would happen.
  const cacheKey = `${owner}:${want}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < TTL) {
    return NextResponse.json({ events: cached.events });
  }

  try {
    const { txs } = await getWalletHistory(owner, key, {
      pages: want > DEFAULT_EVENTS ? HISTORY_PAGES : FEED_PAGES,
    });
    const events = parseActivity(txs, owner, USDC, ASSET_NAMES, ASSET_DECIMALS, ASSET_IS_PRICE).slice(0, want);
    cache.set(cacheKey, { at: Date.now(), events });
    return NextResponse.json({ events });
  } catch (e) {
    console.error("Activity route error:", e);
    return NextResponse.json({ error: "Activity request failed" }, { status: 502 });
  }
}
