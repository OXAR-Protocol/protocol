"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { ReactNode, useEffect, useState } from "react";

export function PrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmmzf4k4s00g80cjywxio7b89";
  const [solanaConfig, setSolanaConfig] = useState<any>({});

  useEffect(() => {
    async function loadSolanaConfig() {
      try {
        const { toSolanaWalletConnectors } = await import("@privy-io/react-auth/solana");
        const { createSolanaRpc, createSolanaRpcSubscriptions } = await import("@solana/kit");

        const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
        const wssUrl = rpcUrl.replace("https://", "wss://").replace("http://", "ws://");

        setSolanaConfig({
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
        });
      } catch (e) {
        console.error("Failed to load Solana config:", e);
      }
    }
    loadSolanaConfig();
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
