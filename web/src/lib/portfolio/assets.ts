/** Native SOL wrapped-mint sentinel (used as the asset id for SOL). */
export const SOL_MINT = "So11111111111111111111111111111111111111112";

/** A wallet holding, valued in USD. `amount` is in base units. */
export interface WalletAsset {
  mint: string;
  symbol: string;
  decimals: number;
  amount: bigint;
  uiAmount: number;
  usdValue: number;
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

const DUST_USD = 0.01;

/** Keep this much SOL for tx fees (swap + deposit) when paying with native SOL. */
export const SOL_FEE_RESERVE = BigInt(10_000_000); // 0.01 SOL

/** Base units of an asset that may be spent — reserves SOL for network fees. */
export function spendableBase(asset: WalletAsset): bigint {
  if (asset.mint !== SOL_MINT) return asset.amount;
  const max = asset.amount - SOL_FEE_RESERVE;
  return max > BigInt(0) ? max : BigInt(0);
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
      logo: item.content?.links?.image,
    });
  }

  return assets
    .filter((a) => a.usdValue >= DUST_USD)
    .sort((a, b) => b.usdValue - a.usdValue);
}
