"use client";

import { useCallback, useEffect, useState } from "react";

import { buildEvmAssets, type WalletAsset } from "@oxar/sdk";
import { useEvmAddress } from "./use-evm-address";

/**
 * The connected EVM wallet's holdings across our supported chains, USD-valued.
 * Reads balances through the server `/api/evm-balances` route (Alchemy key stays
 * server-side). Empty until the user connects an EVM wallet. Fetch-on-mount, no
 * polling (web convention); `refresh()` after actions.
 */
export function useEvmAssets() {
  const evmAddress = useEvmAddress();
  const [assets, setAssets] = useState<WalletAsset[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!evmAddress) {
      setAssets([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/evm-balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: evmAddress }),
      });
      if (!res.ok) throw new Error("balance fetch failed");
      const { tokens } = await res.json();
      setAssets(buildEvmAssets(tokens ?? []));
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [evmAddress]);

  useEffect(() => {
    void load();
  }, [load]);

  return { assets, evmAddress, loading, refresh: load };
}
