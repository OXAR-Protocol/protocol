import { createPublicClient, http, type Chain, type PublicClient } from "viem";
import { mainnet, base, arbitrum, optimism, polygon } from "viem/chains";

/** Delora/EVM numeric chain id → viem chain (our supported set). */
const BY_ID: Record<number, Chain> = {
  1: mainnet,
  10: optimism,
  137: polygon,
  8453: base,
  42161: arbitrum,
};

export function viemChainById(id: number): Chain | null {
  return BY_ID[id] ?? null;
}

/** A read-only viem client for the chain (default public RPC). */
export function publicClientFor(id: number): PublicClient {
  const chain = viemChainById(id);
  if (!chain) throw new Error(`Unsupported EVM chain: ${id}`);
  return createPublicClient({ chain, transport: http() });
}
