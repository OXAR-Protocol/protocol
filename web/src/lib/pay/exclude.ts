import type { Cashable } from "@/hooks/use-cashable";

/**
 * What a purchase may NOT be paid with: itself.
 *
 * The payment picker offers everything the wallet can turn into dollars, and on an
 * asset's own page that list included the asset being bought. Taken to the end it is
 * a round trip — sell $5 of Apple, get dollars, buy Apple back — and it costs two
 * swaps to arrive exactly where you started. Nobody asks for that; it was offered
 * because the picker had no idea what page it was standing on.
 *
 * It also decided by itself: with no dollars in the wallet the picker pre-selects the
 * biggest holding, which on the Apple page IS Apple. So the exclusion has to happen
 * before the default is chosen, not just in the list the user sees.
 */
export interface PayExclusion {
  /** Provider views being bought — a position in one can't fund buying it. */
  viewIds?: readonly string[];
  /** Mints of what's being bought (a stock's `heldMint`). Undefined entries ignored. */
  mints?: readonly (string | undefined)[];
}

/** `items` minus anything that IS what's being bought. */
export function excludePaySources<T extends Cashable>(
  items: readonly T[],
  exclude?: PayExclusion,
): T[] {
  const viewIds = new Set(exclude?.viewIds ?? []);
  const mints = new Set((exclude?.mints ?? []).filter((m): m is string => !!m));
  if (viewIds.size === 0 && mints.size === 0) return [...items];

  return items.filter((item) =>
    item.kind === "position"
      ? !viewIds.has(item.view.id) && !(item.view.heldMint && mints.has(item.view.heldMint))
      : !mints.has(item.asset.mint),
  );
}
