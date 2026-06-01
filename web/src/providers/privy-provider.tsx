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
        // v2: the account is the wallet you log in with. Email → we create an
        // embedded wallet (the wedge). Solana wallet → that wallet IS the account,
        // no embedded is created. See
        // docs/plans/2026-06-01-wallet-payment-architecture-v2.md.
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "#000000",
          accentColor: "#FFFFFF",
          // EVM + Solana wallets can still be LINKED (for paying) — not for login.
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
            // Create an embedded wallet ONLY for users who have no wallet of their
            // own (email/social login). A wallet-login user operates from their own
            // wallet — don't spawn a second, empty one (the v2 fix).
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
