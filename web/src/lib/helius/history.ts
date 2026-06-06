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

/** Page through `owner`'s enhanced transactions (newest first), bounded by `maxPages`. */
export async function fetchEnhancedHistory(
  owner: string,
  key: string,
  maxPages = 8,
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
    const last = page[page.length - 1]?.signature;
    if (!last || page.length < 100) break;
    before = last;
  }
  return out;
}
