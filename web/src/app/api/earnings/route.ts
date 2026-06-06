import { NextResponse } from "next/server";

import { netInvestedFromSwaps, type HeliusTx } from "@/lib/earnings/swaps";
import { XSTOCKS } from "@/lib/yield/xstocks";

// On-chain cost-basis proxy. Reads the wallet's parsed transaction history from
// Helius (key stays server-side) and derives net USD invested per swap-and-hold
// source. Generalizes by adding entries to SOURCES — the engine is shared.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Swap-and-hold sources: net invested = USDC spent acquiring `heldMint`. Stocks come
// straight from the xStocks catalog so the two never drift. (Vault-based sources like
// Kamino/Jupiter Lend will attribute by vault address next — same shared engine.)
const SOURCES: { id: string; heldMint: string; costMint: string }[] = [
  { id: "ondo-usdy", heldMint: "A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6", costMint: USDC },
  ...XSTOCKS.map((s) => ({ id: s.id, heldMint: s.mint, costMint: USDC })),
];

const isAddress = (a: unknown): a is string =>
  typeof a === "string" && a.length >= 32 && a.length <= 44;

function heliusKey(): string | null {
  const url = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "";
  const m = url.match(/api-key=([\w-]+)/);
  return m?.[1] ?? process.env.HELIUS_API_KEY ?? null;
}

/** Page through the wallet's enhanced transactions (newest first), bounded. */
async function fetchHistory(owner: string, key: string, maxPages = 8): Promise<HeliusTx[]> {
  const out: HeliusTx[] = [];
  let before = "";
  for (let i = 0; i < maxPages; i++) {
    const url =
      `https://api.helius.xyz/v0/addresses/${owner}/transactions` +
      `?api-key=${key}&limit=100${before ? `&before=${before}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const page = (await res.json()) as Array<HeliusTx & { signature?: string }>;
    if (!Array.isArray(page) || page.length === 0) break;
    out.push(...page);
    const last = page[page.length - 1]?.signature;
    if (!last || page.length < 100) break;
    before = last;
  }
  return out;
}

// Server cache (owner → basis map), 5 min — history changes only on new txs.
const cache = new Map<string, { at: number; basis: Record<string, number> }>();
const TTL = 300_000;

export async function POST(req: Request) {
  const key = heliusKey();
  if (!key) return NextResponse.json({ error: "Earnings unavailable" }, { status: 503 });

  let owner: unknown;
  try {
    ({ owner } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!isAddress(owner)) return NextResponse.json({ error: "Invalid owner" }, { status: 400 });

  const cached = cache.get(owner);
  if (cached && Date.now() - cached.at < TTL) {
    return NextResponse.json({ basis: cached.basis });
  }

  try {
    const txs = await fetchHistory(owner, key);
    const basis: Record<string, number> = {};
    for (const s of SOURCES) {
      basis[s.id] = netInvestedFromSwaps(txs, owner, s.heldMint, s.costMint);
    }
    cache.set(owner, { at: Date.now(), basis });
    return NextResponse.json({ basis });
  } catch (e) {
    console.error("Earnings route error:", e);
    return NextResponse.json({ error: "Earnings request failed" }, { status: 502 });
  }
}
