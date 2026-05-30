/**
 * APY data layer backed by the free DefiLlama Yields API (no key). It gives an
 * accurate, fast, cacheable APY for every provider plus historical series for
 * charts — without loading a protocol's heavy on-chain SDK on each page load
 * (that cold-start is exactly what made the Kamino card read 0%).
 *
 * The full DefiLlama `/pools` payload is ~10MB, so the browser never fetches it
 * directly — the server route `/api/yields` filters it to our pools (tiny), and
 * the client reads that.
 */

export interface DefiLlamaPool {
  chain: string;
  project: string;
  pool: string;
  apy: number | null;
}

const PROJECTS = new Set(["kamino-lend", "jupiter-lend"]);

/** DefiLlama APY is a percent (5.63 = 5.63%); our providers want a fraction. */
export function toApyFraction(percent: number | null | undefined): number {
  return typeof percent === "number" && Number.isFinite(percent) && percent > 0
    ? percent / 100
    : 0;
}

/** Filter DefiLlama pools to our Solana lending sources → `{ poolId: apyPercent }`. */
export function buildApyMap(pools: DefiLlamaPool[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const p of pools ?? []) {
    if (p?.chain === "Solana" && PROJECTS.has(p?.project) && typeof p?.apy === "number") {
      map[p.pool] = p.apy;
    }
  }
  return map;
}

// --- Client: read APYs via our /api/yields proxy (memoized per page load) ---

let inflight: Promise<Record<string, number>> | null = null;
let fetchedAt = 0;

/** Map of `poolId → APY fraction` for all our sources. One memoized fetch (~60s). */
export async function getApyMap(): Promise<Record<string, number>> {
  if (inflight && Date.now() - fetchedAt < 60_000) return inflight;
  fetchedAt = Date.now();
  inflight = (async () => {
    const res = await fetch("/api/yields");
    if (!res.ok) throw new Error("yields unavailable");
    const { apy } = (await res.json()) as { apy?: Record<string, number> };
    const out: Record<string, number> = {};
    for (const [poolId, pct] of Object.entries(apy ?? {})) out[poolId] = toApyFraction(pct);
    return out;
  })().catch(() => {
    inflight = null; // allow retry on next call
    return {};
  });
  return inflight;
}

/** APY fraction for one pool (0 if unknown). */
export async function getProviderApy(poolId: string): Promise<number> {
  return (await getApyMap())[poolId] ?? 0;
}

export interface ApyHistoryPoint {
  t: string;
  apy: number;
}

const historyCache = new Map<string, { at: number; points: ApyHistoryPoint[] }>();

/** Historical APY series for a pool (for charts), via the proxy. Cached ~5min. */
export async function getApyHistory(poolId: string): Promise<ApyHistoryPoint[]> {
  const cached = historyCache.get(poolId);
  if (cached && Date.now() - cached.at < 300_000) return cached.points;
  try {
    const res = await fetch(`/api/yields?history=${encodeURIComponent(poolId)}`);
    if (!res.ok) return [];
    const { history } = (await res.json()) as { history?: ApyHistoryPoint[] };
    const points = history ?? [];
    historyCache.set(poolId, { at: Date.now(), points });
    return points;
  } catch {
    return [];
  }
}
