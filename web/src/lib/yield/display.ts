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
