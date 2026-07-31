import { CASH_MINTS, JL_USDC, JL_USDT } from "./position-mints";
import { PROVIDERS } from "./registry";

/**
 * What to call a mint when a breakdown has to name it.
 *
 * The performance engine works in mints because that is what the chain gives it; a
 * person reads holdings. Jupiter Lend's receipt tokens are the one case the provider
 * catalog can't answer — they aren't declared as `heldMint` (nothing prices them as a
 * market), so they're named here.
 */

const NAMES: Record<string, string> = {
  [JL_USDC]: "Jupiter Lend USDC",
  [JL_USDT]: "Jupiter Lend USDT",
  ...Object.fromEntries(
    PROVIDERS.filter((p) => p.heldMint).map((p) => [p.heldMint as string, p.assetSymbol || p.name]),
  ),
};

/** Every dollar the wallet holds is one line, not three: "USDC −$0.00, USDG −$0.01,
 *  USDT $0.00" is noise standing where an explanation should be. */
export function isCashMint(mint: string): boolean {
  return CASH_MINTS.has(mint);
}

/** A display name, or null when we have nothing honest to call it. */
export function nameOfMint(mint: string): string | null {
  return NAMES[mint] ?? null;
}
