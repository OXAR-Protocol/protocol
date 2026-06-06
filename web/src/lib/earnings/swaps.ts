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
  let net = 0;
  for (const tx of txs) {
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
    // costDelta < 0 (USDC left the wallet) → positive invested; > 0 (USDC came
    // back from a sell) → reduces invested.
    if (heldDelta !== 0) net += -costDelta;
  }
  return net;
}
