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
 * to the cent and survives device changes — no self-tracking. `costMint` is assumed
 * to be ~$1 (USDC), so its UI amount IS the dollar cost.
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

/**
 * Net USD the `owner` has put into acquiring `heldMint`, derived from swap legs.
 * Counts only transactions where the owner's `heldMint` balance actually moved
 * (i.e. a real acquire/dispose), attributing the same-tx `costMint` delta as the
 * cost/proceeds. Receiving the held asset for free (no cost leg) adds 0 — honest.
 */
export function netInvestedFromSwaps(
  txs: HeliusTx[],
  owner: string,
  heldMint: string,
  costMint: string,
): number {
  // Oldest first: a disposal can only be attributed against units acquired before it.
  // Sort is stable, so txs without a timestamp keep their given order.
  const ordered = [...txs].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

  let units = 0; // held-asset units currently attributed
  let basis = 0; // USD still invested in them

  for (const tx of ordered) {
    let heldDelta = 0;
    let costDelta = 0;
    for (const t of tx.tokenTransfers ?? []) {
      if (!t.mint || typeof t.tokenAmount !== "number") continue;
      const sign =
        t.toUserAccount === owner ? 1 : t.fromUserAccount === owner ? -1 : 0;
      if (sign === 0) continue;
      if (t.mint === heldMint) heldDelta += sign * t.tokenAmount;
      else if (t.mint === costMint) costDelta += sign * t.tokenAmount;
    }
    // Only when the held asset moved for the owner is this an acquire/dispose.
    if (heldDelta === 0) continue;

    if (heldDelta > 0) {
      // Acquire. costDelta < 0 means the cost token left the wallet to pay for it;
      // a free receipt (no cost leg) adds units at zero cost.
      units += heldDelta;
      if (costDelta < 0) basis += -costDelta;
      continue;
    }

    const sold = -heldDelta;
    if (costDelta > 0) {
      // Sale: proceeds came back, so they reduce what is still invested. Keeping the
      // realized gain in this figure is deliberate — earned = value − netInvested then
      // covers realized and unrealized alike.
      basis -= costDelta;
    } else if (units > 0) {
      // Transfer out, no proceeds: retire the share of the basis that left with it.
      basis -= basis * Math.min(1, sold / units);
    }
    units = Math.max(0, units - sold);
  }

  return basis;
}
