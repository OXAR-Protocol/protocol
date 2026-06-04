import { createPublicClient, custom, fallback, http, type Chain, type PublicClient } from "viem";
import { mainnet, base, arbitrum, optimism, polygon } from "viem/chains";

import { evmRpcProxyUrl } from "./rpc-proxy";

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
 * A read-only viem client for the chain. Reads go through our Alchemy-backed
 * server proxy (`/api/evm-rpc`): reliable, and the key stays server-side. The
 * connected wallet's RPC is only a FALLBACK — some external wallets (Trust /
 * WalletConnect NaaS) expose a short-lived session URL the node rejects with
 * "Invalid RPC URL", which previously failed every ERC-20 allowance check. viem's
 * default public RPC (eth.merkle.io) is too flaky to rely on, so it isn't used.
 */
export function publicClientFor(id: number, provider?: Eip1193): PublicClient {
  const chain = viemChainById(id);
  if (!chain) throw new Error(`Unsupported EVM chain: ${id}`);
  const proxy = http(evmRpcProxyUrl(id));
  const transport = provider ? fallback([proxy, custom(provider)]) : proxy;
  return createPublicClient({ chain, transport });
}
