import { PublicKey } from "@solana/web3.js";

import { CURRENT_USDC_MINT } from "./constants";

/// Tokens the rule monitor can watch. PublicKey.default() means native SOL.
export interface TriggerToken {
  symbol: string;
  label: string;
  emoji: string;
  mint: string; // base58, or "" for native SOL
  decimals: number;
}

export const TRIGGER_TOKENS: TriggerToken[] = [
  {
    symbol: "USDC",
    label: "USDC",
    emoji: "💵",
    mint: CURRENT_USDC_MINT,
    decimals: 6,
  },
  {
    symbol: "USDT",
    label: "USDT",
    emoji: "💵",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // mainnet — devnet uses different; placeholder
    decimals: 6,
  },
  {
    symbol: "SOL",
    label: "SOL",
    emoji: "◎",
    mint: "", // native
    decimals: 9,
  },
];

export const CUSTOM_TOKEN_SYMBOL = "__custom__";

export function mintToPublicKey(mint: string): PublicKey {
  if (!mint) return PublicKey.default;
  return new PublicKey(mint);
}

export function findTokenByMint(mint: PublicKey): TriggerToken | undefined {
  const base58 = mint.equals(PublicKey.default) ? "" : mint.toBase58();
  return TRIGGER_TOKENS.find((t) => t.mint === base58);
}
