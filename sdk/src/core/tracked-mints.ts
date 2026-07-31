/**
 * Which mints count as "the portfolio" for a particular wallet.
 *
 * A catalog alone is not enough. The moment someone swaps a catalogued asset for
 * something the catalog doesn't list — a delisted market's receipt token, an asset
 * added after their trade, anything we simply don't carry — that asset leaves our
 * view. And a transaction where our side only DECREASES reads, correctly by the rules
 * but wrongly in fact, as money leaving the wallet.
 *
 * That misreading is expensive, because the value series is replayed BACKWARD: every
 * phantom withdrawal is added back as you go further into the past, so a wallet that
 * cycled a few hundred dollars through an unlisted market is shown a year ago holding
 * thousands it never had. The line looks like a fortune steadily lost.
 *
 * So the set is the catalog plus whatever the wallet actually exchanged a catalogued
 * asset FOR. An airdrop arrives on its own, with nothing of ours on the other side of
 * it, and stays out — which is the point: this widens the view to money that demonstrably
 * came from the money we were already watching, and to nothing else.
 */

/** A transaction's net effect on one wallet: mint → UI units, positive = received. */
export interface MintMovement {
  legs: Readonly<Record<string, number>>;
}

export function trackedMints(
  movements: readonly MintMovement[],
  catalog: ReadonlySet<string>,
): Set<string> {
  const tracked = new Set(catalog);
  for (const { legs } of movements) {
    const mints = Object.keys(legs);
    if (!mints.some((mint) => catalog.has(mint))) continue;
    for (const mint of mints) tracked.add(mint);
  }
  return tracked;
}
