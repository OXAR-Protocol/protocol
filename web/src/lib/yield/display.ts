/** Shared display maps for yield sources, keyed by the risk/chain unions. */

/** Tailwind text-tone per risk tier. */
/** Weight-300 at 80% opacity was legible on the dark surfaces these were designed
 *  for; the cards are white now, and amber-300 on white is the one a tester couldn't
 *  read. Same hues, the weight the rest of the app already uses on white. */
export const RISK_TONE: Record<string, string> = {
  low: "text-emerald-600",
  medium: "text-amber-600",
  high: "text-rose-600",
};

/** Human-readable label per tier.
 *
 *  These used to read "Low risk" / "Medium risk" / "High risk", which says a grade
 *  without saying what was graded — and a reader supplies the missing half himself.
 *  In crypto he supplies the wrong one: risk there means "will this thing rug", and
 *  no tier we can assign from a catalogue answers that. What the tier actually
 *  tracks is how far the value can travel — a lending rate barely moves, a share or
 *  an ounce of gold moves with its market, insurance capital moves with a
 *  catastrophe season. So the label says that instead, and whether an issuer is
 *  trustworthy stays where it belongs: the links under "check it yourself". */
export const RISK_LABEL: Record<string, string> = {
  low: "Value holds",
  medium: "Value moves",
  high: "Value swings",
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

/**
 * What to call a held position at the top of its row.
 *
 * `unitLabelOf` answers "what are these units called", and for a source with no
 * ticker it falls back to `assetSymbol` — which is the currency you PAY WITH, "USDC"
 * on every one of them. Two different holdings then both read "USDC", which is how a
 * position someone had funded days earlier looked to them like it wasn't there at all.
 * Falling back to the source's own name costs nothing and says which is which.
 */
export function positionTitle(v: { name: string; assetSymbol: string; group?: string }): string {
  const ticker = v.name.match(/\(([^)]+)\)/)?.[1];
  if (ticker) return ticker;
  // Members of a group share one name by construction — every Jupiter Lend market is
  // called "Jupiter Lend", and the market is only in the symbol. Without this, two
  // positions in two different markets are one word, twice.
  return v.group ? `${v.name} ${v.assetSymbol}` : v.name;
}
