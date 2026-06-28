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
  tvlUsd?: number | null;
}

const PROJECTS = new Set(["kamino-lend", "jupiter-lend", "ondo-yield-assets"]);

// Pools we want by exact id regardless of chain. Maple's protocol-wide USDC rate
// lives on its Ethereum pool, but it's the same Syrup yield that syrupUSDC accrues
// on Solana — so we surface that pool's APY/TVL for the Maple source.
const EXTRA_POOLS = new Set(["43641cf5-a92e-416b-bce9-27113d3c0db6"]);

/** DefiLlama APY is a percent (5.63 = 5.63%); our providers want a fraction. */
export function toApyFraction(percent: number | null | undefined): number {
  return typeof percent === "number" && Number.isFinite(percent) && percent > 0
    ? percent / 100
    : 0;
}

/** Is this DefiLlama pool one of our curated sources (Solana projects + allowlist)? */
function isOurPool(p: DefiLlamaPool): boolean {
  return (p?.chain === "Solana" && PROJECTS.has(p?.project)) || EXTRA_POOLS.has(p?.pool);
}

/** Filter DefiLlama pools to our Solana lending sources → `{ poolId: apyPercent }`. */
export function buildApyMap(pools: DefiLlamaPool[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const p of pools ?? []) {
    if (isOurPool(p) && typeof p?.apy === "number") map[p.pool] = p.apy;
  }
  return map;
}

/** Filter DefiLlama pools to our sources → `{ poolId: tvlUsd }` (USD deposited). */
export function buildTvlMap(pools: DefiLlamaPool[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const p of pools ?? []) {
    if (isOurPool(p) && typeof p?.tvlUsd === "number") map[p.pool] = p.tvlUsd;
  }
  return map;
}

// --- Client: read APY + TVL via our /api/yields proxy (memoized per page load) ---

interface Yields {
  apy: Record<string, number>; // APY fraction
  tvl: Record<string, number>; // USD deposited
}

let inflight: Promise<Yields> | null = null;
let fetchedAt = 0;

/** APY fraction + TVL for all our sources. One memoized fetch (~60s). */
async function getYields(): Promise<Yields> {
  if (inflight && Date.now() - fetchedAt < 60_000) return inflight;
  fetchedAt = Date.now();
  inflight = (async () => {
    const res = await fetch("/api/yields");
    if (!res.ok) throw new Error("yields unavailable");
    const { apy, tvl } = (await res.json()) as {
      apy?: Record<string, number>;
      tvl?: Record<string, number>;
    };
    const apyOut: Record<string, number> = {};
    for (const [poolId, pct] of Object.entries(apy ?? {})) apyOut[poolId] = toApyFraction(pct);
    return { apy: apyOut, tvl: tvl ?? {} };
  })().catch(() => {
    inflight = null; // allow retry on next call
    return { apy: {}, tvl: {} };
  });
  return inflight;
}

/** Map of `poolId → APY fraction` for all our sources. */
export async function getApyMap(): Promise<Record<string, number>> {
  return (await getYields()).apy;
}

/** APY fraction for one pool (0 if unknown). */
export async function getProviderApy(poolId: string): Promise<number> {
  return (await getApyMap())[poolId] ?? 0;
}

/** USD deposited (TVL) in one pool (0 if unknown). A social-proof trust signal. */
export async function getProviderTvl(poolId: string): Promise<number> {
  return (await getYields()).tvl[poolId] ?? 0;
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
