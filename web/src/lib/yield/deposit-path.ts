/**
 * Deposit router decision: given the asset the user pays with and the product's
 * asset, pick the path. The hook then executes it (direct deposit / Jupiter swap
 * then deposit / Delora bridge then deposit).
 */
export type DepositPath = "direct" | "swap" | "bridge";

export function chooseDepositPath(params: {
  /** Pay-asset mint (Solana) — ignored for non-Solana chains. */
  payMint: string;
  /** Chain the pay-asset lives on. */
  payChain: "solana" | "ethereum";
  /** The product's deposit asset mint (USDC on Solana). */
  productMint: string;
}): DepositPath {
  if (params.payChain !== "solana") return "bridge";
  if (params.payMint === params.productMint) return "direct";
  return "swap";
}
