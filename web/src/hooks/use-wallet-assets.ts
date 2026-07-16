"use client";

import { useCallback, useEffect, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import {
  buildWalletAssets,
  type WalletAsset,
  type DasResult,
  type PriceMap,
} from "@oxar/sdk";

const JUP_PRICE_URL = "https://lite-api.jup.ag/price/v3";
const JUP_TOKEN_URL = "https://lite-api.jup.ag/tokens/v2/search";
const MAX_PRICED_MINTS = 50; // keep the price query URL well under length limits

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

async function fetchPrices(mints: string[]): Promise<PriceMap> {
  if (mints.length === 0) return {};
  const res = await fetch(`${JUP_PRICE_URL}?ids=${mints.join(",")}`);
  if (!res.ok) return {};
  return (await res.json()) as PriceMap;
}

/** Token logos by mint, from the Jupiter token index — fills gaps DAS leaves
 *  (notably native SOL). Best-effort: returns {} on any failure. */
async function fetchIcons(mints: string[]): Promise<Record<string, string>> {
  if (mints.length === 0) return {};
  try {
    const res = await fetch(`${JUP_TOKEN_URL}?query=${mints.join(",")}`);
    if (!res.ok) return {};
    const list = (await res.json()) as Array<{ id: string; icon?: string }>;
    return Object.fromEntries(list.filter((t) => t.icon).map((t) => [t.id, t.icon as string]));
  } catch {
    return {};
  }
}

/** The connected wallet's Solana holdings, valued in USD (fetch-on-mount). */
export function useWalletAssets() {
  const { connection, walletAddress } = useSolanaContext();
  const [assets, setAssets] = useState<WalletAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!walletAddress) {
      setAssets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const das = await fetchDasAssets(connection.rpcEndpoint, walletAddress.toBase58());
      const mints = (das.items ?? [])
        .filter((i) => i.interface?.startsWith("Fungible"))
        .map((i) => i.id)
        .slice(0, MAX_PRICED_MINTS);
      const prices = await fetchPrices(mints);
      const built = buildWalletAssets(das, prices);
      // Fill missing logos (e.g. native SOL) from the Jupiter token index.
      const missing = built.filter((a) => !a.logo).map((a) => a.mint).slice(0, MAX_PRICED_MINTS);
      const icons = await fetchIcons(missing);
      setAssets(
        missing.length
          ? built.map((a) => (a.logo || !icons[a.mint] ? a : { ...a, logo: icons[a.mint] }))
          : built,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [connection, walletAddress]);

  useEffect(() => {
    void load();
  }, [load]);

  return { assets, loading, error, refresh: load };
}
