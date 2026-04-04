"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { ReactNode } from "react";

const HELIUS_RPC = "https://devnet.helius-rpc.com/?api-key=0803f982-c361-4a2a-8496-1391a4b38672";
const HELIUS_WSS = "wss://devnet.helius-rpc.com/?api-key=0803f982-c361-4a2a-8496-1391a4b38672";

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

const solanaRpcs = {
  "solana:mainnet": {
    rpc: createSolanaRpc(HELIUS_RPC),
    rpcSubscriptions: createSolanaRpcSubscriptions(HELIUS_WSS),
  },
  "solana:devnet": {
    rpc: createSolanaRpc(HELIUS_RPC),
    rpcSubscriptions: createSolanaRpcSubscriptions(HELIUS_WSS),
  },
  "solana:testnet": {
    rpc: createSolanaRpc(HELIUS_RPC),
    rpcSubscriptions: createSolanaRpcSubscriptions(HELIUS_WSS),
  },
};

export function PrivyProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProviderBase
      appId="cmmzf4k4s00g80cjywxio7b89"
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#00D4AA",
          walletChainType: "solana-only",
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "all-users",
          },
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
        solana: {
          rpcs: solanaRpcs,
        },
      } as any}
    >
      {children}
    </PrivyProviderBase>
  );
}
