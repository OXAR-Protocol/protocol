"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { mainnet, base, arbitrum, optimism, polygon } from "viem/chains";
import { ReactNode } from "react";
import { RPC_URL } from "@/lib/constants";

const PRIVY_APP_ID: string = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? (() => {
  throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not set");
})();

const HELIUS_WSS = RPC_URL.replace("https://", "wss://");

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

const solanaRpcs = {
  "solana:mainnet": {
    rpc: createSolanaRpc(RPC_URL),
    rpcSubscriptions: createSolanaRpcSubscriptions(HELIUS_WSS),
  },
  "solana:devnet": {
    rpc: createSolanaRpc(RPC_URL),
    rpcSubscriptions: createSolanaRpcSubscriptions(HELIUS_WSS),
  },
  "solana:testnet": {
    rpc: createSolanaRpc(RPC_URL),
    rpcSubscriptions: createSolanaRpcSubscriptions(HELIUS_WSS),
  },
};

export function PrivyProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProviderBase
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "#000000",
          accentColor: "#FFFFFF",
          // Solana + EVM: pay-with-any-crypto routes EVM holdings through Delora.
          walletChainType: "ethereum-and-solana",
          logo: "https://oxar.app/images/white.svg",
          landingHeader: "Welcome to OXAR",
          loginMessage: "Real-world yields. On-chain access.",
          showWalletLoginFirst: false,
        },
        // EVM networks we read balances on / bridge from (Story 4 cross-chain).
        defaultChain: mainnet,
        supportedChains: [mainnet, base, arbitrum, optimism, polygon],
        embeddedWallets: {
          solana: {
            // Only mint a built-in wallet for users who DON'T bring their own
            // (e.g. email sign-in). Phantom users get no shadow wallet — one
            // wallet, no confusion, nowhere for cross-chain funds to go astray.
            createOnLogin: "users-without-wallets",
          },
          // EVM funds come from the user's external wallet (MetaMask/Rainbow);
          // don't litter every account with an empty embedded EVM wallet.
          ethereum: {
            createOnLogin: "off",
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
