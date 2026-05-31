"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

import { buildEvmAssets } from "@/lib/portfolio/evm-assets";
import type { WalletAsset } from "@/lib/portfolio/assets";

/**
 * The connected EVM wallet's holdings across our supported chains, USD-valued.
 * Reads balances through the server `/api/evm-balances` route (Alchemy key stays
 * server-side). Empty until the user connects an EVM wallet. Fetch-on-mount, no
 * polling (web convention); `refresh()` after actions.
 */
export function useEvmAssets() {
  const { authenticated, user } = usePrivy();
  const [assets, setAssets] = useState<WalletAsset[]>([]);
  const [loading, setLoading] = useState(false);

  // Prefer a connected external EVM wallet (MetaMask/Rainbow) — that's where funds
  // are — over any embedded one. Mirrors the Solana address-selection logic.
  const evmAddress = useMemo<string | null>(() => {
    if (!authenticated || !user) return null;
    // SAFETY: linkedAccounts is loosely typed by Privy; we read type/chainType/address/walletClientType.
    const wallets = user.linkedAccounts.filter(
      (a: any) => a.type === "wallet" && a.chainType === "ethereum",
    ) as Array<{ address?: string; walletClientType?: string }>;
    const external = wallets.find((w) => w.walletClientType && w.walletClientType !== "privy");
    return (external ?? wallets[0])?.address ?? null;
  }, [authenticated, user]);

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
