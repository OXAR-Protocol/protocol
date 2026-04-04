"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { ReactNode, useMemo } from "react";

export function PrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

  // Lazy load Solana connectors and RPC to avoid SSR crashes
  const solanaConfig = useMemo(() => {
    if (typeof window === "undefined") return {};

    try {
      const { toSolanaWalletConnectors } = require("@privy-io/react-auth/solana");
      const { createSolanaRpc, createSolanaRpcSubscriptions } = require("@solana/kit");

      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
      const wssUrl = rpcUrl.replace("https://", "wss://").replace("http://", "ws://");

      return {
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors({ shouldAutoConnect: true }),
          },
        },
        solana: {
          rpcs: {
            "solana:mainnet": {
              rpc: createSolanaRpc(rpcUrl),
              rpcSubscriptions: createSolanaRpcSubscriptions(wssUrl),
            },
            "solana:devnet": {
              rpc: createSolanaRpc(rpcUrl),
              rpcSubscriptions: createSolanaRpcSubscriptions(wssUrl),
            },
            "solana:testnet": {
              rpc: createSolanaRpc(rpcUrl),
              rpcSubscriptions: createSolanaRpcSubscriptions(wssUrl),
            },
          },
        },
      };
    } catch {
      return {};
    }
  }, []);

  if (!appId) {
    return <>{children}</>;
  }

  return (
    <PrivyProviderBase
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#00D4AA",
          walletChainType: "solana-only",
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
        ...solanaConfig,
      } as any}
    >
      {children}
    </PrivyProviderBase>
  );
}
