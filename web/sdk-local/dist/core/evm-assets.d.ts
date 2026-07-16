import type { WalletAsset } from "./assets";
/** Address representing a native EVM coin (ETH/POL/…). The zero address is the
 * canonical native representation Delora expects as `originCurrency`. */
export declare const EVM_NATIVE_SENTINEL = "0x0000000000000000000000000000000000000000";
/** Display name of an EVM network, or null (Solana / unknown). */
export declare function networkLabel(network?: string): string | null;
/** Network name for ANY asset — "Solana" for Solana holdings, else the EVM
 *  network. Every pay-asset shows its chain so nothing is ambiguous. */
export declare function assetNetworkLabel(a: WalletAsset): string;
/** One token entry from Alchemy `assets/tokens/by-address` (fields we read). */
export interface AlchemyToken {
    address: string;
    network: string;
    /** ERC-20 contract, or null for the native coin. */
    tokenAddress: string | null;
    /** Decimal UI string ("100.5") or hex base units ("0x..."). */
    tokenBalance?: string;
    tokenMetadata?: {
        decimals?: number;
        symbol?: string;
        name?: string;
        logo?: string;
    } | null;
    tokenPrices?: Array<{
        currency?: string;
        value?: string;
    }>;
    error?: string | null;
}
/**
 * Build a USD-valued, chain-tagged asset list from Alchemy's multi-network token
 * response. Drops errored / zero / dust / unpriced tokens; sorts by USD value desc.
 */
export declare function buildEvmAssets(tokens: AlchemyToken[]): WalletAsset[];
