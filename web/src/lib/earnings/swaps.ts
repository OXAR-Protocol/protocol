/**
 * On-chain cost-basis from a wallet's swap history (Helius enhanced transactions).
 *
 * Realized + unrealized earnings = current value − net invested. For a swap-and-hold
 * asset (e.g. Ondo USDY, acquired by swapping USDC → USDY), the net invested is the
 * USDC actually spent acquiring it minus the USDC taken back out:
 *
 *   netInvested = Σ(USDC spent buying heldMint) − Σ(USDC received selling heldMint)
 *
 * We read it straight from the chain (the wallet's parsed transfers), so it's true
 * to the cent and survives device changes — no self-tracking. Every cost mint is a
 * dollar stablecoin (~$1), so its UI amount IS the dollar cost.
 *
 * Sending the asset OUT with nothing coming back (a plain transfer to another wallet)
 * is not a sale: it has no proceeds to subtract, but the units are gone, so the cost
 * attributed to them has to leave with them. Charging it against the remaining
 * position instead is what produced a phantom loss — a wallet that had sent some of
 * its position away showed a negative yield on the part it still held. That is why
 * this walks the history in order, tracking units alongside the money.
 */

/** One token movement inside a Helius enhanced transaction (fields we read). */
export interface HeliusTokenTransfer {
  fromUserAccount?: string;
  toUserAccount?: string;
  /** UI units (e.g. 0.47 USDC), NOT base units — per Helius enhanced API. */
  tokenAmount?: number;
  mint?: string;
}

export interface HeliusTx {
  /** Unix seconds. Helius returns newest-first, so we sort on this. */
  timestamp?: number;
  tokenTransfers?: HeliusTokenTransfer[];
}

export interface CostBasis {
  /** Net USD still invested in the held units. */
  basis: number;
  /**
   * Whether that figure describes the whole holding.
   *
   * False means the history doesn't explain where these units came from — the
   * acquisition fell outside the fetched window, or it was paid for in something
   * that isn't a dollar (asset→asset swap, a transfer in). The basis is then an
   * undercount, and `value − undercount` reads as profit the holder never made.
   * A position at $24 acquired this way reported "+$24 since you bought", which is
   * the worst direction for a money screen to be wrong in. Absent beats invented.
   */
  covered: boolean;
}

/** Units this far below the holding are rounding dust, not an unexplained buy. */
const DUST = 0.005;

/**
 * Net USD the `owner` has put into acquiring `heldMint`, derived from swap legs,
 * plus whether the history actually accounts for what is held.
 *
 * Counts only transactions where the owner's `heldMint` balance actually moved
 * (i.e. a real acquire/dispose), attributing the same-tx cash delta as the
 * cost/proceeds. Units acquired with no cost leg add nothing to the basis — and
 * are tracked separately, because a holding built that way can't be priced from
 * this history at all.
 *
 * `costMints` is the whole set of dollars the app deals in, not one of them. Reading
 * a single settlement token meant a purchase paid in USDT looked free: no cost leg,
 * so nothing was invested, so the entire position read as profit. Every mint in the
 * set is a dollar stablecoin, so its UI amount IS its dollar amount.
 */
export function costBasisFromSwaps(
  txs: HeliusTx[],
  owner: string,
  heldMint: string,
  costMints: ReadonlySet<string>,
): CostBasis {
  // Oldest first: a disposal can only be attributed against units acquired before it.
  // Sort is stable, so txs without a timestamp keep their given order.
  const ordered = [...txs].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

  let units = 0; // held-asset units currently attributed
  let basis = 0; // USD still invested in them
  let uncosted = 0; // of `units`, those acquired with no dollar leg to price them
  let seen = false; // the held mint moved for the owner at least once

  for (const tx of ordered) {
    let heldDelta = 0;
    let costDelta = 0;
    for (const t of tx.tokenTransfers ?? []) {
      if (!t.mint || typeof t.tokenAmount !== "number") continue;
      const sign =
        t.toUserAccount === owner ? 1 : t.fromUserAccount === owner ? -1 : 0;
      if (sign === 0) continue;
      if (t.mint === heldMint) heldDelta += sign * t.tokenAmount;
      else if (costMints.has(t.mint)) costDelta += sign * t.tokenAmount;
    }
    // Only when the held asset moved for the owner is this an acquire/dispose.
    if (heldDelta === 0) continue;
    seen = true;

    if (heldDelta > 0) {
      // Acquire. costDelta < 0 means the cost token left the wallet to pay for it;
      // a receipt with no cost leg adds units this history cannot price.
      units += heldDelta;
      if (costDelta < 0) basis += -costDelta;
      else uncosted += heldDelta;
      continue;
    }

    const sold = -heldDelta;
    // Whatever leaves takes its share of the unpriced units with it, however it left.
    const gone = units > 0 ? Math.min(1, sold / units) : 1;
    uncosted *= 1 - gone;
    if (costDelta > 0) {
      // Sale: proceeds came back, so they reduce what is still invested. Keeping the
      // realized gain in this figure is deliberate — earned = value − netInvested then
      // covers realized and unrealized alike.
      basis -= costDelta;
    } else if (units > 0) {
      // Transfer out, no proceeds: retire the share of the basis that left with it.
      basis -= basis * gone;
    }
    units = Math.max(0, units - sold);
  }

  return { basis, covered: seen && uncosted <= units * DUST };
}
