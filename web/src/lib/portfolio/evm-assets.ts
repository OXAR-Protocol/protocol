import { toBaseUnits } from "@/lib/yield";
import type { WalletAsset } from "./assets";

/** Address representing a native EVM coin (ETH/POL/…). The zero address is the
 * canonical native representation Delora expects as `originCurrency`. */
export const EVM_NATIVE_SENTINEL = "0x0000000000000000000000000000000000000000";

const DUST_USD = 0.01;

/** Native coin symbol per Alchemy network — the API returns null metadata for it. */
const NATIVE_SYMBOL: Record<string, string> = {
  "eth-mainnet": "ETH",
  "base-mainnet": "ETH",
  "arb-mainnet": "ETH",
  "opt-mainnet": "ETH",
  "matic-mainnet": "POL",
};

/** Human-readable network name from an Alchemy network id (for the pay picker). */
const NETWORK_LABEL: Record<string, string> = {
  "eth-mainnet": "Ethereum",
  "base-mainnet": "Base",
  "arb-mainnet": "Arbitrum",
  "opt-mainnet": "Optimism",
  "matic-mainnet": "Polygon",
};

/** Display name of an EVM network, or null (Solana / unknown). */
export function networkLabel(network?: string): string | null {
  return network ? NETWORK_LABEL[network] ?? null : null;
}

/** Network name for ANY asset — "Solana" for Solana holdings, else the EVM
 *  network. Every pay-asset shows its chain so nothing is ambiguous. */
export function assetNetworkLabel(a: WalletAsset): string {
  if (a.chain === "solana") return "Solana";
  return networkLabel(a.network) ?? "Ethereum";
}

/** One token entry from Alchemy `assets/tokens/by-address` (fields we read). */
export interface AlchemyToken {
  address: string;
  network: string;
  /** ERC-20 contract, or null for the native coin. */
  tokenAddress: string | null;
  /** Decimal UI string ("100.5") or hex base units ("0x..."). */
  tokenBalance?: string;
  tokenMetadata?: { decimals?: number; symbol?: string; name?: string; logo?: string } | null;
  tokenPrices?: Array<{ currency?: string; value?: string }>;
  error?: string | null;
}

/** Balance → base units. Handles both hex ("0x..", already base units) and
 * decimal UI strings ("100.5", scaled by decimals). */
function toBase(raw: string, decimals: number): bigint {
  if (raw.startsWith("0x")) return BigInt(raw);
  return toBaseUnits(raw, decimals);
}

/**
 * Build a USD-valued, chain-tagged asset list from Alchemy's multi-network token
 * response. Drops errored / zero / dust / unpriced tokens; sorts by USD value desc.
 */
export function buildEvmAssets(tokens: AlchemyToken[]): WalletAsset[] {
  const assets: WalletAsset[] = [];

  for (const t of tokens) {
    if (t.error) continue;
    if (!t.tokenBalance) continue;
    const isNative = t.tokenAddress === null;
    // Native coin comes back with null metadata — default to 18 decimals.
    const decimals = t.tokenMetadata?.decimals ?? (isNative ? 18 : undefined);
    if (typeof decimals !== "number") continue;

    let amount: bigint;
    try {
      amount = toBase(t.tokenBalance, decimals);
    } catch {
      continue;
    }
    if (amount <= BigInt(0)) continue;

    const price = Number(t.tokenPrices?.find((p) => p.currency === "usd")?.value ?? 0);
    if (!(price > 0)) continue;

    const uiAmount = Number(amount) / 10 ** decimals;
    assets.push({
      mint: isNative ? EVM_NATIVE_SENTINEL : t.tokenAddress!,
      symbol: t.tokenMetadata?.symbol || (isNative ? NATIVE_SYMBOL[t.network] ?? "ETH" : "TOKEN"),
      decimals,
      amount,
      uiAmount,
      usdValue: uiAmount * price,
      chain: "ethereum",
      network: t.network,
      logo: t.tokenMetadata?.logo,
    });
  }

  return assets.filter((a) => a.usdValue >= DUST_USD).sort((a, b) => b.usdValue - a.usdValue);
}
