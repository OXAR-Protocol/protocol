import { USDC_MINT } from "@/lib/constants";

import { PROVIDERS } from "./registry";

/**
 * Every mint that IS a position rather than idle cash.
 *
 * The wallet card ("in your wallet · not working yet") lists what the user holds
 * and nudges them to put it to work. Without this it listed their own positions —
 * AAPLx, KOx, jlUSDC — as money doing nothing, so the same dollars appeared twice:
 * once in the balance, once as "idle".
 *
 * Swap-and-hold sources declare what they hold (`heldMint`). Jupiter Lend doesn't:
 * its receipt tokens aren't a tradeable market, so exposing them as `heldMint`
 * would make the UI offer a "sell now" quote for something no pool prices. They
 * are listed here instead.
 */

/** Jupiter Lend receipt tokens — held in the wallet, value accrues in price. */
export const JL_USDC = "9BEcn9aPEmhSPbPQeFGjidRiEKki46fVQDyPpSQXPA2D";
export const JL_USDT = "Cmn4v2wipYV41dkakDvCgFJpxhtaaKt11NyWV8pjSE8A";

/** True when this mint is a position the app already counts elsewhere. */
export function isPositionMint(mint: string): boolean {
  return POSITION_MINTS.has(mint);
}

export const POSITION_MINTS: ReadonlySet<string> = new Set<string>([
  ...PROVIDERS.map((p) => p.heldMint).filter((m): m is string => !!m),
  JL_USDC,
  JL_USDT,
]);

/** Dollars sitting in the wallet, not yet at work. */
export const CASH_MINTS: ReadonlySet<string> = new Set<string>([
  USDC_MINT,
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
  "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH", // USDG (Token-2022)
]);

/**
 * Everything performance is measured over: positions AND the cash beside them.
 *
 * Cash belongs in it for a reason that only shows up in the arithmetic. If the
 * portfolio were the positions alone, buying a stock with wallet dollars would count
 * as money ARRIVING, and paying $100 for $99 of stock would be recorded as "$99 came
 * in" — the dollar it cost to get in simply vanishing. With cash inside the boundary
 * that same purchase is internal, and the dollar reads as the loss it is. It also
 * ends the split where the chart drew a different portfolio than the balance above it.
 *
 * SOL is deliberately absent: it is a reserve kept for network fees, and letting its
 * price swing move "what you earned" would be noise rather than performance.
 */
export const TRACKED_MINTS: ReadonlySet<string> = new Set<string>([
  ...POSITION_MINTS,
  ...CASH_MINTS,
]);
