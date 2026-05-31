/**
 * Outbound router (mirror of the deposit router): given the asset the user holds
 * and where they want it to land, pick the path. The hook executes it.
 */
export type OutboundPath = "transfer" | "swap" | "bridge";

export function chooseOutboundPath(params: {
  /** Held asset mint (Solana). */
  sourceMint: string;
  /** Chain the funds should land on. */
  destChain: "solana" | "ethereum";
  /** Destination asset — Solana mint, or EVM token address (ignored cross-chain routing-wise). */
  destMint: string;
}): OutboundPath {
  if (params.destChain !== "solana") return "bridge";
  if (params.destMint === params.sourceMint) return "transfer";
  return "swap";
}
