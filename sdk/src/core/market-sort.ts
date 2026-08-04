/**
 * Ordering a shelf of things you could buy.
 *
 * The default is deliberately `""` — the catalog's own order. Ranking by size or
 * by anything else is a claim about what's best, so it has to be asked for; a
 * list that arrives pre-sorted by deposits is us answering a question nobody put.
 */

export type MarketSortKey = "" | "name" | "position" | "deposited";

/** The three facts anything on the shelf can be ordered by. */
export interface MarketSortFacts {
  /** Display name, for A→Z. */
  name: string;
  /** What this user already holds in it, USD. */
  position: number;
  /** What everyone has deposited in it, USD. 0 when it doesn't apply. */
  deposited: number;
}

/**
 * Items in the requested order, without mutating the input.
 *
 * Anything with a zero figure keeps the catalog's order at the BOTTOM rather
 * than being ranked as a zero: a tokenised stock has no deposit figure at all,
 * and sorting it to last-place-by-value would read as "nobody wants this"
 * instead of "this number doesn't apply here".
 */
export function sortMarketItems<T>(
  items: readonly T[],
  key: MarketSortKey,
  facts: (item: T) => MarketSortFacts,
): T[] {
  if (!key) return [...items];
  if (key === "name") {
    return [...items].sort((a, b) =>
      facts(a).name.localeCompare(facts(b).name, "en", { sensitivity: "base" }),
    );
  }

  const value = (item: T): number => (key === "position" ? facts(item).position : facts(item).deposited);
  const ranked: T[] = [];
  const blank: T[] = [];
  for (const item of items) (value(item) > 0 ? ranked : blank).push(item);
  ranked.sort((a, b) => value(b) - value(a));
  return [...ranked, ...blank];
}
