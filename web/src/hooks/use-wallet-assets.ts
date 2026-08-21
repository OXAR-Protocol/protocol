"use client";

import { useCallback, useEffect, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import {
  buildWalletAssets,
  fetchWithRetry,
  priceableMints,
  type WalletAsset,
  type DasResult,
  type PriceMap,
} from "@oxar/sdk";
import { clearCache, once } from "@/lib/cache";
import { CASH_MINTS, POSITION_MINTS, isPositionMint } from "@/lib/yield/position-mints";

const JUP_PRICE_URL = "https://lite-api.jup.ag/price/v3";
const JUP_TOKEN_URL = "https://lite-api.jup.ag/tokens/v2/search";
/** Jupiter Price v3 takes at most this many mints per request. */
const PRICE_BATCH = 50;
/** Ceiling on how many holdings we'll price. Four requests is plenty for a wallet;
 *  past that it's spam airdrops, and they aren't worth the round trips. */
const MAX_PRICED_MINTS = 200;

async function fetchDasAssets(rpc: string, owner: string): Promise<DasResult> {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "oxar-portfolio",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: owner,
        page: 1,
        limit: 1000,
        displayOptions: { showFungible: true, showNativeBalance: true },
      },
    }),
  });
  if (!res.ok) throw new Error(`Balances unavailable (${res.status})`);
  const json = (await res.json()) as { result?: DasResult };
  return json?.result ?? {};
}

/** Prices for every mint, in batches the API will accept. Throws only if NOTHING
 *  could be priced — a partial answer still beats blanking the whole wallet. */
async function fetchPrices(mints: string[]): Promise<PriceMap> {
  if (mints.length === 0) return {};

  const batches: string[][] = [];
  for (let i = 0; i < mints.length; i += PRICE_BATCH) batches.push(mints.slice(i, i + PRICE_BATCH));

  const results = await Promise.all(
    batches.map(async (batch) => {
      try {
        const res = await fetchWithRetry(`${JUP_PRICE_URL}?ids=${batch.join(",")}`);
        return res.ok ? ((await res.json()) as PriceMap) : null;
      } catch {
        return null;
      }
    }),
  );

  const priced = results.filter((r): r is PriceMap => r !== null);
  if (priced.length === 0) throw new Error("Prices unavailable");
  return Object.assign({}, ...priced) as PriceMap;
}

/** Token logos by mint, from the Jupiter token index — fills gaps DAS leaves
 *  (notably native SOL). Best-effort: returns {} on any failure. */
async function fetchIcons(mints: string[]): Promise<Record<string, string>> {
  if (mints.length === 0) return {};
  try {
    const res = await fetchWithRetry(`${JUP_TOKEN_URL}?query=${mints.join(",")}`);
    if (!res.ok) return {};
    const list = (await res.json()) as Array<{ id: string; icon?: string }>;
    return Object.fromEntries(list.filter((t) => t.icon).map((t) => [t.id, t.icon as string]));
  } catch {
    return {};
  }
}

async function loadWalletAssets(rpc: string, owner: string): Promise<WalletAsset[]> {
  const das = await fetchDasAssets(rpc, owner);
  const prices = await fetchPrices(
    priceableMints(das, { skip: POSITION_MINTS, first: CASH_MINTS, max: MAX_PRICED_MINTS }),
  );
  const built = buildWalletAssets(das, prices, { assumeUsdOne: CASH_MINTS }).filter(
    (a) => !isPositionMint(a.mint),
  );

  // Fill missing logos (e.g. native SOL) from the Jupiter token index.
  const missing = built.filter((a) => !a.logo).map((a) => a.mint).slice(0, PRICE_BATCH);
  if (missing.length === 0) return built;
  const icons = await fetchIcons(missing);
  return built.map((a) => (a.logo || !icons[a.mint] ? a : { ...a, logo: icons[a.mint] }));
}

/** The connected wallet's IDLE Solana holdings, valued in USD (fetch-on-mount).
 *  Positions the app counts elsewhere (stocks, gold, Jupiter Lend receipts) are
 *  excluded — listing them as "not working yet" double-counted the same dollars.
 *
 *  Several components ask for this at once; `once` makes that one round trip rather
 *  than one each, which is also what keeps the price API from rate-limiting us. */
export function useWalletAssets() {
  const { connection, walletAddress } = useSolanaContext();
  const [assets, setAssets] = useState<WalletAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "mount" | "refresh" | "silent" = "mount") => {
      if (!walletAddress) {
        setAssets([]);
        setLoading(false);
        return;
      }
      // A live update must not raise `loading` — this card renders nothing while
      // loading, so a background refresh would make it disappear and come back on
      // every transaction.
      const silent = mode === "silent";
      if (!silent) setLoading(true);
      const key = `wallet-assets:${walletAddress.toBase58()}`;
      // Mounting shares whatever the last read produced; asking again means asking.
      if (mode !== "mount") clearCache(key);
      try {
        setAssets(await once(key, () => loadWalletAssets(connection.rpcEndpoint, walletAddress.toBase58())));
        setError(null);
      } catch (e) {
        // Keep what was already on screen. A failed read is not an empty wallet, and
        // rendering it as one tells the user their money is gone.
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [connection, walletAddress],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => void load("refresh"), [load]);
  /** Re-read without blanking the card — see `load`'s `silent`. */
  const refreshSilently = useCallback(() => void load("silent"), [load]);

  return { assets, loading, error, refresh, refreshSilently };
}
