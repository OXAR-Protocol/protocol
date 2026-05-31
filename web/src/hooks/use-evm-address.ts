"use client";

import { useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";

/**
 * The user's EVM address from Privy — prefers a connected external wallet
 * (MetaMask/Rainbow), where funds live, over any embedded one. Null until an
 * EVM wallet is linked. Shared by the wallet menu and the EVM balance hook.
 */
export function useEvmAddress(): string | null {
  const { authenticated, user } = usePrivy();
  return useMemo<string | null>(() => {
    if (!authenticated || !user) return null;
    // SAFETY: linkedAccounts is loosely typed by Privy; we read type/chainType/address/walletClientType.
    const wallets = user.linkedAccounts.filter(
      (a: any) => a.type === "wallet" && a.chainType === "ethereum",
    ) as Array<{ address?: string; walletClientType?: string }>;
    const external = wallets.find((w) => w.walletClientType && w.walletClientType !== "privy");
    return (external ?? wallets[0])?.address ?? null;
  }, [authenticated, user]);
}
