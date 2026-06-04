/**
 * Server-proxied EVM JSON-RPC. EVM *reads* (ERC-20 allowance, tx receipts) must
 * not go through the connected wallet's RPC: some external wallets (Trust /
 * WalletConnect NaaS) expose a short-lived session URL that the node rejects with
 * "Invalid RPC URL", failing every eth_call. They also must not use viem's default
 * public RPC, which is rate-limited/flaky. Instead they go through `/api/evm-rpc`,
 * backed by Alchemy (key stays server-side) — the same proxy pattern as
 * `/api/evm-balances`, `/api/kamino`, `/api/yields`.
 */

/** chainId → Alchemy v2 JSON-RPC subdomain (our supported set). */
const ALCHEMY_SUBDOMAIN: Record<number, string> = {
  1: "eth-mainnet",
  10: "opt-mainnet",
  137: "polygon-mainnet",
  8453: "base-mainnet",
  42161: "arb-mainnet",
};

/** Alchemy JSON-RPC subdomain for a chain id, or null if unsupported. */
export function alchemySubdomainFor(chainId: number): string | null {
  return ALCHEMY_SUBDOMAIN[chainId] ?? null;
}

/** Absolute URL of our server-side EVM JSON-RPC proxy for a chain (browser only). */
export function evmRpcProxyUrl(chainId: number): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/api/evm-rpc?chainId=${chainId}`;
}
