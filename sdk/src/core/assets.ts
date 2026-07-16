import { toBaseUnits } from "./units";
import { EVM_NATIVE_SENTINEL } from "./evm-assets";

/** Native SOL wrapped-mint sentinel (used as the asset id for SOL). */
export const SOL_MINT = "So11111111111111111111111111111111111111112";

/** A wallet holding, valued in USD. `amount` is in base units. */
export interface WalletAsset {
  /** Asset id: Solana mint, or EVM token contract (native sentinel for ETH/etc.). */
  mint: string;
  symbol: string;
  decimals: number;
  amount: bigint;
  uiAmount: number;
  usdValue: number;
  /** Chain the asset lives on — drives the deposit router (direct/swap vs bridge). */
  chain: "solana" | "ethereum";
  /** Alchemy network id (EVM only), e.g. "base-mainnet" — needed for bridge quotes. */
  network?: string;
  logo?: string;
}

// --- Helius DAS `getAssetsByOwner` shapes (only the fields we read) ---
export interface DasFungible {
  interface?: string;
  id: string;
  content?: { metadata?: { symbol?: string }; links?: { image?: string } };
  token_info?: { balance?: number | string; decimals?: number };
}
export interface DasResult {
  items?: DasFungible[];
  nativeBalance?: { lamports?: number; total_price?: number };
}

/** Jupiter Price v3: `{ [mint]: { usdPrice } }`. */
export type PriceMap = Record<string, { usdPrice?: number } | undefined>;

/** Stable id unique across chains. Native EVM coins (ETH/POL) share one mint —
 *  the zero sentinel — on every network, so we key on (chain, network, mint).
 *  Used for picker keys and pay-asset selection; keying by mint alone collides
 *  (e.g. ETH on Base vs Arbitrum) and could bridge from the wrong network. */
export function assetUid(a: WalletAsset): string {
  return `${a.chain}:${a.network ?? ""}:${a.mint}`;
}

const DUST_USD = 0.01;

/** Keep this much SOL for tx fees (swap + deposit) when paying with native SOL. */
export const SOL_FEE_RESERVE = BigInt(10_000_000); // 0.01 SOL
/** Even when gas is sponsored, swapping NATIVE SOL needs SOL for the temporary
 *  wrapped-SOL account rent (~0.002) — so keep a small reserve rather than zero. */
export const SOL_SPONSORED_RESERVE = BigInt(5_000_000); // 0.005 SOL

/** USD of native coin to keep for the ORIGIN-CHAIN network fee when paying with a
 *  native EVM coin (ETH/POL). Without it the bridge tx spends the whole balance and
 *  the wallet rejects it ("insufficient ETH"). Heuristic per network — L1 gas is
 *  dear and volatile, L2s are cheap. (Precise per-tx gas estimation is a follow-up.)
 *  Keys are Alchemy network ids (see bridge/delora `NETWORK_CHAIN_ID`). */
export const EVM_GAS_RESERVE_USD: Record<string, number> = {
  "eth-mainnet": 1.5, // Ethereum L1 — expensive, spikes
  "matic-mainnet": 0.05,
  "base-mainnet": 0.1,
  "arb-mainnet": 0.1,
  "opt-mainnet": 0.1,
};
const DEFAULT_EVM_GAS_RESERVE_USD = 0.5;

/** True for a native EVM coin (ETH/POL) — pays its own origin-chain gas. */
function isNativeEvmCoin(asset: WalletAsset): boolean {
  return asset.chain === "ethereum" && asset.mint === EVM_NATIVE_SENTINEL;
}

/** Base units of an asset that may be spent, leaving gas for the network fee.
 *  - Native SOL: reserve SOL for the tx fee (skipped for Privy-sponsored wallets
 *    via `reserveGas = false`, which keep only the wrapped-SOL rent).
 *  - Native EVM coin (ETH/POL): reserve gas for the origin-chain (bridge) fee —
 *    always, since the EVM origin tx is never sponsored.
 *  - ERC-20 / SPL tokens: pay gas in a separate coin → spend the full balance. */
export function spendableBase(asset: WalletAsset, reserveGas = true): bigint {
  if (asset.mint === SOL_MINT) {
    // Sponsored (embedded) wallets pay no fee, but a native-SOL swap still needs the
    // small wrapped-SOL rent → keep a reduced reserve; external cover the full fee too.
    const reserve = reserveGas ? SOL_FEE_RESERVE : SOL_SPONSORED_RESERVE;
    const max = asset.amount - reserve;
    return max > BigInt(0) ? max : BigInt(0);
  }
  if (isNativeEvmCoin(asset)) {
    const usd = EVM_GAS_RESERVE_USD[asset.network ?? ""] ?? DEFAULT_EVM_GAS_RESERVE_USD;
    const max = asset.amount - usdToBase(asset, usd);
    return max > BigInt(0) ? max : BigInt(0);
  }
  return asset.amount;
}

/** USD amount → base units of `asset`, at its current unit price (usdValue/uiAmount).
 *  Single source of truth for the USD-denominated money path. */
export function usdToBase(asset: WalletAsset, usd: number): bigint {
  const price = asset.usdValue / asset.uiAmount;
  return toBaseUnits((usd / price).toFixed(asset.decimals), asset.decimals);
}

/**
 * Build a USD-valued asset list from a Helius DAS result + a Jupiter price map.
 * Includes native SOL (priced by Helius directly), drops dust/zero/unpriced,
 * sorts by USD value desc.
 */
export function buildWalletAssets(das: DasResult, prices: PriceMap): WalletAsset[] {
  const assets: WalletAsset[] = [];

  const native = das?.nativeBalance;
  if (native?.lamports && native.lamports > 0) {
    const amount = BigInt(native.lamports);
    assets.push({
      mint: SOL_MINT,
      symbol: "SOL",
      decimals: 9,
      amount,
      uiAmount: Number(amount) / 1e9,
      usdValue: native.total_price ?? 0,
      chain: "solana",
    });
  }

  for (const item of das?.items ?? []) {
    if (!item?.interface?.startsWith("Fungible")) continue;
    const ti = item.token_info;
    if (!ti?.balance || !ti.decimals) continue;
    const amount = BigInt(ti.balance);
    if (amount <= BigInt(0)) continue;
    const uiAmount = Number(amount) / 10 ** ti.decimals;
    const usdPrice = prices[item.id]?.usdPrice ?? 0;
    assets.push({
      mint: item.id,
      symbol: item.content?.metadata?.symbol || `${item.id.slice(0, 4)}…`,
      decimals: ti.decimals,
      amount,
      uiAmount,
      usdValue: uiAmount * usdPrice,
      chain: "solana",
      logo: item.content?.links?.image,
    });
  }

  return assets
    .filter((a) => a.usdValue >= DUST_USD)
    .sort((a, b) => b.usdValue - a.usdValue);
}
