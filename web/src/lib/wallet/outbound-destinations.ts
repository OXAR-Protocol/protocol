import { USDC_MINT } from "@/lib/constants";

/**
 * Where the user can send funds. Solana = same-asset transfer (any held asset).
 * EVM chains = cross-chain via Delora, delivering USDC on that chain (v1: USDC
 * only; native/other assets are a later add).
 */
export interface DestChain {
  key: string;
  label: string;
  chain: "solana" | "ethereum";
  /** Delora numeric chain id (EVM only). */
  chainId?: number;
  /** USDC mint (Solana) / contract (EVM) on this chain — the cross-chain dest asset. */
  usdc: string;
}

export const DEST_CHAINS: DestChain[] = [
  { key: "solana", label: "Solana", chain: "solana", usdc: USDC_MINT },
  { key: "base", label: "Base", chain: "ethereum", chainId: 8453, usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
  { key: "ethereum", label: "Ethereum", chain: "ethereum", chainId: 1, usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  { key: "arbitrum", label: "Arbitrum", chain: "ethereum", chainId: 42161, usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
  { key: "optimism", label: "Optimism", chain: "ethereum", chainId: 10, usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" },
  { key: "polygon", label: "Polygon", chain: "ethereum", chainId: 137, usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" },
];

export const getDestChain = (key: string): DestChain =>
  DEST_CHAINS.find((d) => d.key === key) ?? DEST_CHAINS[0];
