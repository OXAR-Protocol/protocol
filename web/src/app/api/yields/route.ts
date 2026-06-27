import { NextResponse } from "next/server";

import { buildApyMap, buildTvlMap, type DefiLlamaPool } from "@/lib/yield/yields-api";
import { fetchWithRetry } from "@/lib/net/fetch-retry";

// Lightweight DefiLlama proxy — NO protocol SDK here (unlike /api/kamino), so it
// stays fast and never cold-starts klend. Returns APY for our pools + history.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POOLS_URL = "https://yields.llama.fi/pools";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Server-side cache of the heavy (~10MB) /pools response, filtered to our pools.
interface PoolMaps {
  apy: Record<string, number>;
  tvl: Record<string, number>;
}
let cache: { maps: PoolMaps; ts: number } | null = null;

async function loadMaps(): Promise<PoolMaps> {
  if (cache && Date.now() - cache.ts < 600_000) return cache.maps;
  const res = await fetchWithRetry(POOLS_URL);
  if (!res.ok) throw new Error(`DefiLlama ${res.status}`);
  const json = (await res.json()) as { data?: DefiLlamaPool[] };
  const pools = json?.data ?? [];
  const maps = { apy: buildApyMap(pools), tvl: buildTvlMap(pools) };
  cache = { maps, ts: Date.now() };
  return maps;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const history = searchParams.get("history");

  try {
    if (history) {
      if (!UUID.test(history)) {
        return NextResponse.json({ history: [] }, { status: 400 });
      }
      const res = await fetchWithRetry(`https://yields.llama.fi/chart/${history}`);
      if (!res.ok) return NextResponse.json({ history: [] });
      const json = (await res.json()) as {
        data?: Array<{ timestamp: string; apy: number | null }>;
      };
      const points = (json?.data ?? [])
        .filter((d) => typeof d.apy === "number")
        .map((d) => ({ t: d.timestamp, apy: d.apy as number }));
      return NextResponse.json({ history: points });
    }

    const maps = await loadMaps();
    return NextResponse.json({ apy: maps.apy, tvl: maps.tvl });
  } catch (e) {
    // Soft-fail so the client falls back gracefully (card keeps last/0, never breaks).
    console.error("Yields route error:", e);
    return NextResponse.json({ apy: {}, tvl: {}, history: [] });
  }
}
