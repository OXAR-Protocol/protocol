import { USDC_MINT } from "@/lib/constants";
import { SOL_MINT } from "@/lib/portfolio/assets";

const EVM_NATIVE = "0x0000000000000000000000000000000000000000";

export type OutboundKind = "transfer" | "swap" | "bridge";

export interface DestAsset {
  symbol: string;
  /** Solana mint, or EVM token contract (zero address = native coin). */
  mint: string;
  decimals: number;
}

export interface DestChain {
  key: string;
  label: string;
  chain: "solana" | "ethereum";
  /** Delora numeric chain id (EVM only). */
  chainId?: number;
  assets: DestAsset[];
}

const evm = (label: string, key: string, chainId: number, usdc: string, nativeSym: string): DestChain => ({
  key,
  label,
  chain: "ethereum",
  chainId,
  assets: [
    { symbol: "USDC", mint: usdc, decimals: 6 },
    { symbol: nativeSym, mint: EVM_NATIVE, decimals: 18 },
  ],
});

/** Send any held Solana asset into any of these. */
export const DEST_CHAINS: DestChain[] = [
  {
    key: "solana",
    label: "Solana",
    chain: "solana",
    assets: [
      { symbol: "USDC", mint: USDC_MINT, decimals: 6 },
      { symbol: "SOL", mint: SOL_MINT, decimals: 9 },
    ],
  },
  evm("Base", "base", 8453, "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", "ETH"),
  evm("Ethereum", "ethereum", 1, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "ETH"),
  evm("Arbitrum", "arbitrum", 42161, "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", "ETH"),
  evm("Optimism", "optimism", 10, "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", "ETH"),
  evm("Polygon", "polygon", 137, "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", "POL"),
];

export const getDestChain = (key: string): DestChain =>
  DEST_CHAINS.find((d) => d.key === key) ?? DEST_CHAINS[0];

/**
 * How to reach the destination from the source: cross-chain → bridge; same Solana
 * asset → plain transfer; different Solana asset → swap.
 */
export function outboundKind(sourceMint: string, destChain: DestChain, destMint: string): OutboundKind {
  if (destChain.chain === "ethereum") return "bridge";
  return destMint === sourceMint ? "transfer" : "swap";
}
