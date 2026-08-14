import { toBaseUnits } from "./units";

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
/**
 * Reserve on the SPONSORED path. The fee is not the reason — a relayer pays that.
 * Spending native SOL means WRAPPING it, and the temporary wrapped-SOL account must
 * be rent-exempt for the moment it exists. That rent is charged to the user's own
 * account by the instruction, so a relayer being fee payer doesn't cover it, and
 * wrapping the entire balance leaves nothing to fund it — the transaction fails.
 *
 * The figure is the measured rent-exempt minimum for a 165-byte token account
 * (2,039,280 lamports, `getMinimumBalanceForRentExemption(165)`) plus ~13% for the
 * priority fee and rounding. It was 0.005 — a round guess at 2.5× the requirement,
 * which stranded small balances: 0.0047 SOL (~$0.35) read as nothing spendable.
 */
export const SOL_SPONSORED_RESERVE = BigInt(2_300_000); // 0.0023 SOL

/** Base units of an asset that may be spent, leaving gas for the network fee.
 *  - Native SOL: reserve SOL for the tx fee (skipped for Privy-sponsored wallets
 *    via `reserveGas = false`, which keep only the wrapped-SOL rent).
 *  - SPL tokens: gas is paid in SOL → spend the full balance. */
export function spendableBase(asset: WalletAsset, reserveGas = true): bigint {
  if (asset.mint === SOL_MINT) {
    // Sponsored (embedded) wallets pay no fee, but a native-SOL swap still needs the
    // small wrapped-SOL rent → keep a reduced reserve; external cover the full fee too.
    const reserve = reserveGas ? SOL_FEE_RESERVE : SOL_SPONSORED_RESERVE;
    const max = asset.amount - reserve;
    return max > BigInt(0) ? max : BigInt(0);
  }
  return asset.amount;
}

/** What the asset is worth to spend, in dollars — its balance net of the gas reserve
 *  `spendableBase` keeps back. The dollar figure every buying screen quotes. */
export function spendableUsd(asset: WalletAsset, reserveGas = true): number {
  if (asset.uiAmount <= 0) return 0;
  const price = asset.usdValue / asset.uiAmount;
  return (Number(spendableBase(asset, reserveGas)) / 10 ** asset.decimals) * price;
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
