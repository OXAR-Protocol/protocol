/** Native SOL wrapped-mint sentinel (used as the asset id for SOL). */
export declare const SOL_MINT = "So11111111111111111111111111111111111111112";
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
export interface DasFungible {
    interface?: string;
    id: string;
    content?: {
        metadata?: {
            symbol?: string;
        };
        links?: {
            image?: string;
        };
    };
    token_info?: {
        balance?: number | string;
        decimals?: number;
    };
}
export interface DasResult {
    items?: DasFungible[];
    nativeBalance?: {
        lamports?: number;
        total_price?: number;
    };
}
/** Jupiter Price v3: `{ [mint]: { usdPrice } }`. */
export type PriceMap = Record<string, {
    usdPrice?: number;
} | undefined>;
/** Stable id unique across chains. Native EVM coins (ETH/POL) share one mint —
 *  the zero sentinel — on every network, so we key on (chain, network, mint).
 *  Used for picker keys and pay-asset selection; keying by mint alone collides
 *  (e.g. ETH on Base vs Arbitrum) and could bridge from the wrong network. */
export declare function assetUid(a: WalletAsset): string;
/** Keep this much SOL for tx fees (swap + deposit) when paying with native SOL. */
export declare const SOL_FEE_RESERVE: bigint;
/** Even when gas is sponsored, swapping NATIVE SOL needs SOL for the temporary
 *  wrapped-SOL account rent (~0.002) — so keep a small reserve rather than zero. */
export declare const SOL_SPONSORED_RESERVE: bigint;
/** USD of native coin to keep for the ORIGIN-CHAIN network fee when paying with a
 *  native EVM coin (ETH/POL). Without it the bridge tx spends the whole balance and
 *  the wallet rejects it ("insufficient ETH"). Heuristic per network — L1 gas is
 *  dear and volatile, L2s are cheap. (Precise per-tx gas estimation is a follow-up.)
 *  Keys are Alchemy network ids (see bridge/delora `NETWORK_CHAIN_ID`). */
export declare const EVM_GAS_RESERVE_USD: Record<string, number>;
/** Base units of an asset that may be spent, leaving gas for the network fee.
 *  - Native SOL: reserve SOL for the tx fee (skipped for Privy-sponsored wallets
 *    via `reserveGas = false`, which keep only the wrapped-SOL rent).
 *  - Native EVM coin (ETH/POL): reserve gas for the origin-chain (bridge) fee —
 *    always, since the EVM origin tx is never sponsored.
 *  - ERC-20 / SPL tokens: pay gas in a separate coin → spend the full balance. */
export declare function spendableBase(asset: WalletAsset, reserveGas?: boolean): bigint;
/** USD amount → base units of `asset`, at its current unit price (usdValue/uiAmount).
 *  Single source of truth for the USD-denominated money path. */
export declare function usdToBase(asset: WalletAsset, usd: number): bigint;
/**
 * Build a USD-valued asset list from a Helius DAS result + a Jupiter price map.
 * Includes native SOL (priced by Helius directly), drops dust/zero/unpriced,
 * sorts by USD value desc.
 */
export declare function buildWalletAssets(das: DasResult, prices: PriceMap): WalletAsset[];
