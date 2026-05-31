import { USDC_MINT } from "@/lib/constants";
import { SOL_MINT } from "@/lib/portfolio/assets";

const EVM_NATIVE = "0x0000000000000000000000000000000000000000";

/** How a destination asset is reached from the user's USDC. */
export type OutboundKind = "transfer" | "swap" | "bridge";

export interface DestAsset {
  symbol: string;
  /** Solana mint, or EVM token contract (zero address = native coin). */
  mint: string;
  decimals: number;
  kind: OutboundKind;
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
    { symbol: "USDC", mint: usdc, decimals: 6, kind: "bridge" },
    { symbol: nativeSym, mint: EVM_NATIVE, decimals: 18, kind: "bridge" },
  ],
});

/** Withdraw your USDC into any of these. Source is always USDC (the yield asset). */
export const DEST_CHAINS: DestChain[] = [
  {
    key: "solana",
    label: "Solana",
    chain: "solana",
    assets: [
      { symbol: "USDC", mint: USDC_MINT, decimals: 6, kind: "transfer" },
      { symbol: "SOL", mint: SOL_MINT, decimals: 9, kind: "swap" },
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
