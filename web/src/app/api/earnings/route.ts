import { NextResponse } from "next/server";

import { netInvestedFromSwaps } from "@/lib/earnings/swaps";
import { heliusApiKey, fetchEnhancedHistory } from "@/lib/helius/history";
import { XSTOCKS } from "@/lib/yield/xstocks";
import { GOLD } from "@/lib/yield/gold";

// On-chain cost-basis proxy. Reads the wallet's parsed transaction history from
// Helius (key stays server-side) and derives net USD invested per swap-and-hold
// source. Generalizes by adding entries to SOURCES — the engine is shared.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
// Jupiter Lend receipt (jl) tokens — the SPL you HOLD after depositing (value accrues in
// price). Deposit = costMint → jlToken; withdraw = jlToken → costMint, so the same
// swap-attribution engine works: net invested = cost spent to acquire the jlToken.
const JL_USDC = "9BEcn9aPEmhSPbPQeFGjidRiEKki46fVQDyPpSQXPA2D";
const JL_USDT = "Cmn4v2wipYV41dkakDvCgFJpxhtaaKt11NyWV8pjSE8A";

// Net invested = cost spent acquiring `heldMint`. Stocks come straight from the xStocks
// catalog so the two never drift.
const SOURCES: { id: string; heldMint: string; costMint: string }[] = [
  { id: "ondo-usdy", heldMint: "A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6", costMint: USDC },
  { id: "maple-solana", heldMint: "AvZZF1YaZDziPY2RCK4oJrRVrbN3mTD9NL24hPeaZeUj", costMint: USDC },
  // Jupiter Lend: hold jlUSDC/jlUSDT, attribute against the deposited dollar (USDC/USDT).
  { id: "jupiter-lend-usdc", heldMint: JL_USDC, costMint: USDC },
  { id: "jupiter-lend-usdt", heldMint: JL_USDT, costMint: USDT },
  ...XSTOCKS.map((s) => ({ id: s.id, heldMint: s.mint, costMint: USDC })),
  ...GOLD.map((g) => ({ id: g.id, heldMint: g.mint, costMint: USDC })),
];
// NOTE: Kamino (klend) is NOT here yet — it's obligation-based (no transferable receipt
// token in the wallet), so the held-mint attribution can't see it. It needs
// counterparty-address attribution (USDC moved to/from the klend program) — a separate,
// larger change. Until then a Kamino position simply shows no earned figure (never wrong,
// just absent), which `allCovered` already accounts for.

const isAddress = (a: unknown): a is string =>
  typeof a === "string" && a.length >= 32 && a.length <= 44;

// Server cache (owner → basis map), 5 min — history changes only on new txs.
const cache = new Map<string, { at: number; basis: Record<string, number> }>();
const TTL = 300_000;

export async function POST(req: Request) {
  const key = heliusApiKey();
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
    // Cost basis needs the FULL acquisition history — with the default 8-page window
    // (800 txs) a heavily-active wallet's older buys fell outside it, so their USDC
    // cost wasn't counted → "invested" undercounted → a held asset showed a phantom
    // profit. Page deeper here (the recent-activity feed keeps the small default). The
    // 5-min server cache means this deeper fetch is paid rarely. (True cost-basis for
    // >2.5k-tx wallets still needs a durable ledger — out of scope for v1.)
    const txs = await fetchEnhancedHistory(owner, key, 25);
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
