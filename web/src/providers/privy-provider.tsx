"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { toSolanaWalletConnectors, useSolanaFundingPlugin } from "@privy-io/react-auth/solana";
import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { ReactNode } from "react";

import { useTheme } from "@/context/theme-context";
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

/** Registers Privy's Solana fiat-funding capability (on-ramp). Must be mounted
 *  inside PrivyProvider or `fundWallet` opens an empty modal. */
function SolanaFundingPlugin() {
  useSolanaFundingPlugin();
  return null;
}

export function PrivyProvider({ children }: { children: ReactNode }) {
  // Privy draws its own sheets — sign-in, the wallet list, the deposit address — and
  // a white modal over a dark app is the loudest seam there is. It takes plain values,
  // so it follows our theme by being handed our values.
  const { theme } = useTheme();
  const dark = theme === "dark";
  return (
    <PrivyProviderBase
      // Privy reads `config` when it mounts, so a theme switch has to remount it or
      // the sheet keeps the old palette until a reload — which reads as the switch
      // not working. Remounting is cheap here: the session lives in storage, not in
      // this tree.
      key={theme}
      appId={PRIVY_APP_ID}
      config={{
        // v2: the account is the wallet you log in with. Email → we create an
        // embedded wallet (the wedge). Solana wallet → that wallet IS the account,
        // no embedded is created. See
        // docs/plans/2026-06-01-wallet-payment-architecture-v2.md.
        // Google sits beside email because it IS email, minus typing an address and
        // waiting for a code — the step most people drop out on. It runs on Privy's
        // own OAuth credentials, so switching it on in the dashboard was the whole job.
        //
        // Passkey does the same job on the device itself — Face ID or a fingerprint,
        // no inbox, no third party's credentials to obtain first.
        //
        // Apple is NOT here yet on purpose. Its dashboard entry demands our own OAuth
        // credentials before production (Client ID, signing key, key + team id, all
        // marked required), which needs a paid Apple developer account and, by Apple's
        // own warning, can take weeks. Listing it before those exist ships a button
        // that fails when pressed. Add "apple" back the day the credentials are saved.
        loginMethods: ["email", "google", "passkey", "wallet"],
        appearance: {
          // The app's own paper, not white: a modal a shade brighter than the page
          // behind it reads as a different product borrowed for the occasion.
          theme: dark ? "#141414" : "#fbfaf8",
          // The brand's violet — lifted on dark, where the light-theme value goes black.
          accentColor: dark ? "#a78bfa" : "#3c05c7",
          // Solana only, for login and for linking. The account IS a Solana wallet;
          // an EVM wallet was only ever a way to pay, and money now arrives from other
          // chains as a deposit address (Relay) that needs no wallet connected at all.
          walletChainType: "solana-only",
          // Not a wall of wallets, but not a wall in front of one either. The three
          // worth naming come first; `detected_solana_wallets` then adds whatever the
          // person actually has installed, so a Backpack user isn't told their own
          // wallet doesn't exist.
          walletList: ["phantom", "solflare", "backpack", "detected_solana_wallets"],
          // Whichever mark survives the sheet it's printed on.
          logo: dark ? "https://oxar.app/images/white.svg" : "https://oxar.app/images/black.svg",
          landingHeader: "Welcome to OXAR",
          loginMessage: "Real-world yields. On-chain access.",
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          solana: {
            // Create an embedded wallet ONLY for users who have no wallet of their
            // own (email/social login). A wallet-login user operates from their own
            // wallet — don't spawn a second, empty one (the v2 fix).
            createOnLogin: "users-without-wallets",
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
      <SolanaFundingPlugin />
      {children}
    </PrivyProviderBase>
  );
}
