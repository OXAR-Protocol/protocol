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
