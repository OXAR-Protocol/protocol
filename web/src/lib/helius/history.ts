/**
 * Shared Helius enhanced-transaction history fetch (server-side only — keeps the
 * key off the client). Used by both the earnings cost-basis engine and the
 * recent-activity feed, so the paging logic lives in one place.
 */

import { fetchWithRetry, type AccountData } from "@oxar/sdk";

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
 * When the wallet first did anything — or `undefined` when we cannot know.
 *
 * Only meaningful together with `exhausted` from `fetchHistoryPaged`: if paging ran
 * off the end of the wallet's history then the oldest transaction in it is the first
 * one there has ever been, and the portfolio chart may state that nothing existed
 * before it. If paging stopped for any other reason, the beginning is unknown and
 * this returns `undefined` rather than a guess.
 *
 * It must be given the WHOLE history, not a filtered subset. Handing it the
 * tracked-mint transactions instead put the birthday later than it really was — the
 * first thing a wallet does is often not the first thing this app cares about — and
 * the chart then cut off days that genuinely happened. That shipped once: a 7-day
 * range showed a balance the 30-day range had already erased, because `exhausted` is
 * a property of the window and the two ranges disagreed about where life began.
 */
export function bornAtFrom(
  txs: readonly EnhancedTx[],
  exhausted: boolean,
): number | undefined {
  if (!exhausted) return undefined;
  let oldest = Infinity;
  // A transaction with no timestamp tells us nothing about when anything started;
  // treating its absence as epoch zero would move the birthday to 1970.
  for (const tx of txs) {
    if (typeof tx.timestamp === "number" && tx.timestamp > 0 && tx.timestamp < oldest) {
      oldest = tx.timestamp;
    }
  }
  return Number.isFinite(oldest) ? oldest : undefined;
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
): Promise<{ txs: EnhancedTx[]; exhausted: boolean; failed: boolean }> {
  const out: EnhancedTx[] = [];
  let before = "";
  let exhausted = false;
  let failed = false;
  for (let i = 0; i < maxPages; i++) {
    const url =
      `https://api.helius.xyz/v0/addresses/${owner}/transactions` +
      `?api-key=${key}&limit=100${before ? `&before=${before}` : ""}`;
    // Retried, the way the prices in the same route already are. Helius rate-limits
    // at a couple of requests a second and paging fires them back to back, so a 429
    // on page three is an ordinary event — and a bare `fetch` turned it into a
    // silently truncated history. Measured on a real wallet: the 90-day range read
    // all 292 transactions and knew the account was born in April, while the 365-day
    // range stopped at 200 and, having no birthday to bound it, drew eight months
    // that never happened.
    // `fetchWithRetry` throws once its attempts are spent, and it imposes a timeout
    // the bare `fetch` here never had. Both are caught: a page we could not read
    // leaves the history INCOMPLETE, which the caller must know about, but it must
    // not take down the whole request — the earnings engine and the activity feed
    // page through here too, and partial history is worth more to them than a 502.
    let res: Response;
    try {
      res = await fetchWithRetry(url, undefined, {
        retries: 3,
        backoffMs: 400,
        // Enhanced history is not a fast endpoint; the 8s default turned slow-but-fine
        // pages into failures.
        timeoutMs: 15_000,
      });
    } catch {
      failed = true;
      break;
    }
    // Still refused after retrying. That is the end of our patience, not the end of
    // the wallet's history, and the caller must be able to tell those apart.
    if (!res.ok) {
      failed = true;
      break;
    }
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
  return { txs: out, exhausted, failed };
}
