/**
 * Shared Helius enhanced-transaction history fetch (server-side only — keeps the
 * key off the client). Used by both the earnings cost-basis engine and the
 * recent-activity feed, so the paging logic lives in one place.
 */

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
  const out: EnhancedTx[] = [];
  let before = "";
  for (let i = 0; i < maxPages; i++) {
    const url =
      `https://api.helius.xyz/v0/addresses/${owner}/transactions` +
      `?api-key=${key}&limit=100${before ? `&before=${before}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const page = (await res.json()) as EnhancedTx[];
    if (!Array.isArray(page) || page.length === 0) break;
    out.push(...page);
    const oldest = page[page.length - 1];
    if (!oldest?.signature || page.length < 100) break;
    // Reached back past the window — everything older belongs to a question nobody
    // asked. A page whose last entry carries no timestamp is not evidence of that, so
    // it keeps paging: too much history is harmless, too little is a wrong number.
    if (since !== undefined && oldest.timestamp !== undefined && oldest.timestamp < since) break;
    before = oldest.signature;
  }
  return out;
}
