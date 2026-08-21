/** Native SOL wrapped-mint sentinel (used as the asset id for SOL). */
export declare const SOL_MINT = "So11111111111111111111111111111111111111112";
/** A wallet holding, valued in USD. `amount` is in base units.
 *
 *  Solana only, and stated in the type rather than checked at every call site: the
 *  account IS a Solana wallet, nothing builds an asset on another chain, and the six
 *  `chain === "solana"` filters that used to guard against it were all always true.
 *  Sending money TO another chain is a property of the destination, not of a holding. */
export interface WalletAsset {
    /** Solana mint. */
    mint: string;
    symbol: string;
    decimals: number;
    amount: bigint;
    uiAmount: number;
    usdValue: number;
    chain: "solana";
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
/** Stable id for a holding. One chain, so the mint is the whole answer — it used to
 *  key on (chain, network, mint) because native ETH shares one sentinel mint across
 *  five networks, and picking the wrong one could bridge from the wrong chain. */
export declare function assetUid(a: WalletAsset): string;
/** Keep this much SOL for tx fees (swap + deposit) when paying with native SOL. */
export declare const SOL_FEE_RESERVE: bigint;
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
export declare const SOL_SPONSORED_RESERVE: bigint;
/** Base units of an asset that may be spent, leaving gas for the network fee.
 *  - Native SOL: reserve SOL for the tx fee (skipped for Privy-sponsored wallets
 *    via `reserveGas = false`, which keep only the wrapped-SOL rent).
 *  - SPL tokens: gas is paid in SOL → spend the full balance. */
export declare function spendableBase(asset: WalletAsset, reserveGas?: boolean): bigint;
/** What the asset is worth to spend, in dollars — its balance net of the gas reserve
 *  `spendableBase` keeps back. The dollar figure every buying screen quotes. */
export declare function spendableUsd(asset: WalletAsset, reserveGas?: boolean): number;
/**
 * A dollar holding described from a dollar figure.
 *
 * Dollars are sometimes known before the asset list is: they were read straight off
 * the chain, or a sale just produced them and the indexer hasn't caught up. The money
 * path still wants a `WalletAsset` to carry the mint and the decimals — a dollar is a
 * dollar, so this builds one rather than making each caller inline the same literal.
 */
export declare function usdcAsset(mint: string, usd: number, decimals?: number): WalletAsset;
/** USD amount → base units of `asset`, at its current unit price (usdValue/uiAmount).
 *  Single source of truth for the USD-denominated money path. */
export declare function usdToBase(asset: WalletAsset, usd: number): bigint;
export interface PriceableOptions {
    /** Mints counted elsewhere (the app's own positions) — no price call needed. */
    skip?: ReadonlySet<string>;
    /** Mints that must come first if the list has to be cut. */
    first?: ReadonlySet<string>;
    /** Ceiling on how many mints to return. */
    max?: number;
}
/**
 * Which of a wallet's holdings to ask a price for.
 *
 * The caller used to take "the first N ids DAS returned", and DAS returns emptied
 * token accounts and the app's own positions alongside real holdings — so on a
 * heavily traded wallet the budget was spent on nothing and the USDC never got
 * priced. Unpriced meant valued at zero, and zero meant dropped by the dust filter:
 * the wallet held dollars and the app said it held none.
 *
 * So: only what has a balance, never what's counted elsewhere, and `first` (cash) at
 * the front — if anything falls off the end, it must not be the dollars.
 */
export declare function priceableMints(das: DasResult, opts?: PriceableOptions): string[];
export interface BuildAssetOptions {
    /**
     * Mints worth a dollar each when the price feed doesn't name them.
     *
     * A stablecoin has a price we already know, and asking a third party for it adds a
     * way to be wrong: a rate-limited price round used to value the wallet's USDC at
     * zero, which the dust filter then removed entirely — the balance didn't read as
     * "price unknown", it read as "you have no dollars". Callers pass their own set
     * (web's `CASH_MINTS`) so this file needs no opinion about which mints are cash.
     */
    assumeUsdOne?: ReadonlySet<string>;
}
/**
 * Build a USD-valued asset list from a Helius DAS result + a Jupiter price map.
 * Includes native SOL (priced by Helius directly), drops dust/zero/unpriced,
 * sorts by USD value desc.
 */
export declare function buildWalletAssets(das: DasResult, prices: PriceMap, opts?: BuildAssetOptions): WalletAsset[];
