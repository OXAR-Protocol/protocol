import { PublicKey } from "@solana/web3.js";

/**
 * Tokenized physical metal — one troy ounce per token, held in the user's own
 * wallet. No APY: what you hold is the metal's price.
 *
 * Was `gold.ts` until silver arrived. The catalog is split from the provider
 * logic so adding a metal is a row, not a diff through swap code.
 */
export const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export const TOKEN_2022_PROGRAM = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export interface MetalMeta {
  id: string;
  symbol: string; // ticker, e.g. "XAUT"
  token: string; // display symbol, e.g. "XAUt0"
  name: string; // display name, e.g. "Tether Gold"
  metal: "gold" | "silver";
  mint: string;
  decimals: number;
  /** Which program owns the mint. Gold is classic SPL; SILV is Token-2022, so
   *  holdings are read with a scan per program rather than one hardcoded one. */
  program: "spl" | "token2022";
}

// Physically-backed metal tokens with usable Solana liquidity (verified via Jupiter).
// Extend = append a row; P&L follows automatically via /api/earnings.
export const METALS: readonly MetalMeta[] = [
  {
    id: "gold-xaut",
    symbol: "XAUT",
    token: "XAUt0",
    name: "Tether Gold",
    metal: "gold",
    mint: "AymATz4TCL9sWNEEV9Kvyz45CHVhDZ6kUgjTJPzLpU9P",
    decimals: 6,
    program: "spl",
  },
  {
    // ORO. Same ounce, different promise: this mint has NO freeze authority, where
    // Tether Gold's issuer can freeze a holder's balance. That is the reason it is
    // here — it is the only gold on Solana that matches what this app says about
    // whose money it is. Costs more to enter (~0.25% vs ~0.03% on a $200 buy,
    // measured 2026-07-31) and the book is thinner: 0.24% at $5k, 0.36% at $20k.
    //
    // Their 3–4% staking yield is deliberately NOT offered: it locks the gold for
    // 12 months, and "withdraw anytime" is a promise we keep. Price exposure only.
    id: "gold-oro",
    symbol: "ORO",
    token: "ORO",
    name: "ORO Gold",
    metal: "gold",
    mint: "GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A",
    decimals: 6,
    program: "spl",
  },
  {
    // Dominion Silver — one troy ounce of silver per token, allocated vault storage.
    // The first non-gold metal, and the first metal that is NOT classic SPL.
    //
    // Verified on-chain before listing: Token-2022 with `permanentDelegate` and a
    // freeze authority (the same key, `FqFNXCM…`), so the issuer can both freeze and
    // move a holder's balance. That is the shape xStocks already have, and the asset
    // card says it in plain words — it is emphatically NOT the ORO promise, which is
    // the one mint here with no freeze authority at all.
    //
    // Crucially there is NO transfer fee and NO transfer hook, so this is not the USDG
    // case: Kora's validator sees a plain `transferChecked`, and the 0-SOL gasless path
    // needs no relayer change (Whirlpool + Token-2022 are already in allowed_programs).
    //
    // Liquidity measured 2026-08-14, USDC round-trip: 0.03% at $200, 0.14% at $1k,
    // 0.23% at $5k, 0.65% at $20k — deeper than either gold at every retail size.
    id: "silver-dominion",
    symbol: "SILV",
    token: "SILV",
    name: "Dominion Silver",
    metal: "silver",
    mint: "SiLVFMgD3eD2rgK628NbTBq9MnuJF5FW2CRaVyTB35L",
    decimals: 6,
    program: "token2022",
  },
];

export const METAL_MINTS = METALS.map((m) => m.mint);

/** The distinct token programs the catalog actually spans — one balance scan each. */
export const METAL_PROGRAMS: readonly PublicKey[] = METALS.some((m) => m.program === "token2022")
  ? [TOKEN_PROGRAM, TOKEN_2022_PROGRAM]
  : [TOKEN_PROGRAM];

const METAL_IDS = new Set(METALS.map((m) => m.id));

/** True for a metal provider id (vs a yield source). Matched against the catalog,
 *  not an id prefix: gold shipped as `gold-*` and renaming those ids would orphan
 *  every user's cost basis. */
export function isMetal(id: string): boolean {
  return METAL_IDS.has(id);
}
