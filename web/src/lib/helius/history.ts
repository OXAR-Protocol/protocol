/**
 * Shared Helius enhanced-transaction history fetch (server-side only — keeps the
 * key off the client). Used by both the earnings cost-basis engine and the
 * recent-activity feed, so the paging logic lives in one place.
 */

import type { AccountData } from "@oxar/sdk";

/** One token movement inside an enhanced transaction (the fields we read). */
export interface EnhancedTokenTransfer {
  fromUserAccount?: string;
  toUserAccount?: string;
  /** UI units (e.g. 0.47 USDC), NOT base units — per the Helius enhanced API. */
  tokenAmount?: number;
  mint?: string;
}

/** A parsed enhanced transaction (the subset of fields we consume). */
export interface EnhancedTx {
  signature?: string;
  /** Unix seconds. */
  timestamp?: number;
  type?: string;
  tokenTransfers?: EnhancedTokenTransfer[];
  /** Per-account net balance changes — the honest reading of what moved, since a
   *  routed swap's transfers count the same dollars once per hop. See
   *  `walletDeltas` in the SDK. */
  accountData?: AccountData[];
}

/** Helius API key from the RPC URL (`?api-key=`) or `HELIUS_API_KEY`. Null if absent. */
export function heliusApiKey(): string | null {
  const url = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "";
  const m = url.match(/api-key=([\w-]+)/);
  return m?.[1] ?? process.env.HELIUS_API_KEY ?? null;
}

/**
 * Page through `owner`'s enhanced transactions, newest first.
 *
 * `maxPages` is a ceiling, not a target. Pass `since` (unix seconds) and paging stops
 * as soon as it has reached back past that moment — which is what the caller actually
 * wants: enough history to cover the window being asked about. A fixed page count is
 * wrong in both directions at once. It fetches 25 pages to draw a 7-day chart for a
 * wallet whose whole life fits in one, and it stops at 2500 transactions for the
 * wallet that needed 4000 to reach the start of the year — the first is slow, the
 * second quietly incomplete.
 */
export async function fetchEnhancedHistory(
  owner: string,
  key: string,
  maxPages = 8,
  since?: number,
): Promise<EnhancedTx[]> {
  return (await fetchHistoryPaged(owner, key, maxPages, since)).txs;
}

/**
 * The same paging, plus the one fact the caller cannot infer from the result: whether
 * this is the wallet's WHOLE history or just as much of it as we were willing to ask
 * for.
 *
 * It matters because the portfolio chart reconstructs the past by undoing transfers
 * backwards from today. Undoing a withdrawal adds the money back, so on a wallet that
 * has taken more out than it put in the reconstruction grows the further back it goes
 * — and it cannot tell "you really did hold this much in May" from "your account did
 * not exist in May". Only `exhausted` separates them: if paging ran off the end of the
 * wallet's history, the oldest transaction we hold IS its first, and there was nothing
 * before it.
 */
export async function fetchHistoryPaged(
  owner: string,
  key: string,
  maxPages = 8,
  since?: number,
): Promise<{ txs: EnhancedTx[]; exhausted: boolean }> {
  const out: EnhancedTx[] = [];
  let before = "";
  let exhausted = false;
  for (let i = 0; i < maxPages; i++) {
    const url =
      `https://api.helius.xyz/v0/addresses/${owner}/transactions` +
      `?api-key=${key}&limit=100${before ? `&before=${before}` : ""}`;
    const res = await fetch(url);
    // A failed page is not the end of the wallet's history, it is the end of our
    // patience — the difference decides whether the chart may speak about May.
    if (!res.ok) break;
    const page = (await res.json()) as EnhancedTx[];
    if (!Array.isArray(page) || page.length === 0) {
      exhausted = true;
      break;
    }
    out.push(...page);
    const oldest = page[page.length - 1];
    if (page.length < 100) {
      // A short page means Helius had no more to give: this is the beginning.
      exhausted = true;
      break;
    }
    if (!oldest?.signature) break;
    // Reached back past the window — everything older belongs to a question nobody
    // asked. A page whose last entry carries no timestamp is not evidence of that, so
    // it keeps paging: too much history is harmless, too little is a wrong number.
    if (since !== undefined && oldest.timestamp !== undefined && oldest.timestamp < since) break;
    before = oldest.signature;
  }
  return { txs: out, exhausted };
}
