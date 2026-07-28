/** Shared display maps for yield sources, keyed by the risk/chain unions. */

/** Tailwind text-tone per risk tier. */
export const RISK_TONE: Record<string, string> = {
  low: "text-emerald-300/80",
  medium: "text-amber-300/80",
  high: "text-rose-300/80",
};

/** Human-readable risk label per tier. */
export const RISK_LABEL: Record<string, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

/** Human-readable chain label. */
export const CHAIN_LABEL: Record<string, string> = {
  solana: "Solana",
  ethereum: "Ethereum",
  base: "Base",
  arbitrum: "Arbitrum",
};

/**
 * What ONE unit of a position is called.
 *
 * `assetSymbol` is the currency a source settles in — USDC for a tokenised stock —
 * so using it to label a share count says "0.005868 USDC" for something that is
 * neither USDC nor that amount of it. The ticker is carried in the name, e.g.
 * "Apple (AAPLx)"; for sources that hold their own asset the two coincide.
 */
export function unitLabelOf(v: { name: string; assetSymbol: string }): string {
  return v.name.match(/\(([^)]+)\)/)?.[1] ?? v.assetSymbol;
}
