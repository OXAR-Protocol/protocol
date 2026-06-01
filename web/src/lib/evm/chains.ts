import { createPublicClient, custom, http, type Chain, type PublicClient } from "viem";
import { mainnet, base, arbitrum, optimism, polygon } from "viem/chains";

/** Minimal EIP-1193 provider (the connected wallet's RPC). */
export type Eip1193 = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };

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

/**
 * A read-only viem client for the chain. Prefer the connected wallet's RPC
 * (`provider`) — reliable and already on this chain — over viem's default public
 * RPC, which is rate-limited/flaky (e.g. eth.merkle.io fails for mainnet reads,
 * surfacing as "Network's being slow" on the ERC-20 allowance check).
 */
export function publicClientFor(id: number, provider?: Eip1193): PublicClient {
  const chain = viemChainById(id);
  if (!chain) throw new Error(`Unsupported EVM chain: ${id}`);
  return createPublicClient({ chain, transport: provider ? custom(provider) : http() });
}
