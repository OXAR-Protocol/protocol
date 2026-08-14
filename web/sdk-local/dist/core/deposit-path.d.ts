/**
 * Which way a deposit reaches the product: pay with the asset it already settles in,
 * or swap into it first.
 *
 * It used to have a third answer — bridge — for a pay-asset on another chain. Buying
 * spends the wallet's dollars now, and money from elsewhere arrives before any of
 * this runs, so the branch had no way of being reached and the executor answered it
 * with "coming soon". A router that can return a path nobody executes is a bug
 * waiting for the day someone wires it up.
 */
export type DepositPath = "direct" | "swap";
export declare function chooseDepositPath(params: {
    /** Pay-asset mint (Solana). */
    payMint: string;
    /** The product's deposit asset mint (USDC on Solana). */
    productMint: string;
}): DepositPath;
