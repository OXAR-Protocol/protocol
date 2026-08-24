import { fetchHistoryPaged, type EnhancedTx } from "./history";

/**
 * One wallet, one history, shared by everything that needs it.
 *
 * Three routes page Helius for the same list. `/api/portfolio-history` reads up to
 * forty pages, `/api/earnings` twenty-five, `/api/activity` eight or twenty-five —
 * and each kept its own cache under its own key, so none of them ever saw another's
 * work. The portfolio route was worse still: its key included the RANGE, so flipping
 * 7 → 30 → 90 → 365 on one screen paged the wallet four separate times, even though
 * the year's read contains all three of the others inside it.
 *
 * One visit to `/you` could therefore ask Helius for the same transactions around a
 * hundred and ninety times. At a couple of requests a second that is not merely a
 * quota problem, it is a correctness problem: a rate-limited page comes back
 * truncated, and a truncated history is what made the chart draw months that never
 * happened.
 *
 * Two things fix that, and both belong here rather than in each caller:
 *
 *   Depth is a property of the READ, not of the question. A read that went deeper
 *   than you need is a read you can have, and a read that ran off the end of the
 *   wallet's history answers every question until it expires.
 *
 *   Callers arrive together. `/you` mounts the chart, the earnings figures and the
 *   activity feed in one breath, so the three of them miss an empty cache at the same
 *   instant. One in-flight read per wallet turns that into one request.
 */

interface Entry {
  txs: EnhancedTx[];
  /** Paging ran off the end — this is the wallet's whole life. */
  exhausted: boolean;
  /** Pages actually read, not the ceiling that was offered. */
  pages: number;
  /** Oldest transaction we hold, unix seconds. `Infinity` when we hold none. */
  oldest: number;
  at: number;
}

const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<void>>();
const TTL = 300_000;

export interface HistoryRequest {
  /** Page ceiling this caller is willing to pay for. */
  pages: number;
  /** Stop once the read reaches back past this moment (unix seconds). */
  since?: number;
}

export interface HistoryResult {
  txs: EnhancedTx[];
  exhausted: boolean;
  /** A page could not be read, so this is less history than the wallet has. */
  failed: boolean;
  /** Served without touching Helius. */
  cached: boolean;
}

/** Whether a cached read already answers what this caller is asking for. */
function covers(entry: Entry, req: HistoryRequest): boolean {
  if (Date.now() - entry.at >= TTL) return false;
  // The whole history answers every question.
  if (entry.exhausted) return true;
  // It already reaches back past the window being asked about.
  if (req.since !== undefined && entry.oldest <= req.since) return true;
  // It paged at least as deep as this caller would have been allowed to, so asking
  // again could not return more.
  return entry.pages >= req.pages;
}

function oldestOf(txs: readonly EnhancedTx[]): number {
  let oldest = Infinity;
  for (const tx of txs) {
    if (typeof tx.timestamp === "number" && tx.timestamp > 0 && tx.timestamp < oldest) {
      oldest = tx.timestamp;
    }
  }
  return oldest;
}

const served = (entry: Entry, cached: boolean): HistoryResult => ({
  txs: entry.txs,
  exhausted: entry.exhausted,
  failed: false,
  cached,
});

/**
 * The wallet's transactions, at least as deep as `req` asks for.
 *
 * A failed read is returned but NOT remembered: caching a truncated history would
 * turn one rate-limited request into five minutes of wrong charts.
 */
export async function getWalletHistory(
  owner: string,
  key: string,
  req: HistoryRequest,
): Promise<HistoryResult> {
  const hit = cache.get(owner);
  if (hit && covers(hit, req)) return served(hit, true);

  // Someone is already reading this wallet. Wait for them rather than starting a
  // second race down the same pages — then ask again, because their read may well be
  // deeper than what this caller needed.
  const running = inflight.get(owner);
  if (running) {
    await running;
    const after = cache.get(owner);
    if (after && covers(after, req)) return served(after, true);
  }

  let result: HistoryResult = { txs: [], exhausted: false, failed: true, cached: false };
  const read = (async () => {
    const { txs, exhausted, failed } = await fetchHistoryPaged(owner, key, req.pages, req.since);
    result = { txs, exhausted, failed, cached: false };
    // A truncated read is worth returning and not worth keeping.
    if (failed) return;
    cache.set(owner, {
      txs,
      exhausted,
      pages: Math.ceil(txs.length / 100),
      oldest: oldestOf(txs),
      at: Date.now(),
    });
  })();

  inflight.set(owner, read);
  try {
    await read;
  } finally {
    inflight.delete(owner);
  }
  return result;
}

/** Forget a wallet's history — for tests, and for anything that knows money moved. */
export function forgetWalletHistory(owner?: string): void {
  if (owner) cache.delete(owner);
  else cache.clear();
}
