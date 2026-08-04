import { describe, expect, it } from "vitest";

import { sortMarketItems, type MarketSortFacts } from "@oxar/sdk";

interface Row {
  id: string;
  facts: MarketSortFacts;
}

const row = (id: string, name: string, position: number, deposited: number): Row => ({
  id,
  facts: { name, position, deposited },
});

const ids = (rows: Row[]) => rows.map((r) => r.id);
const factsOf = (r: Row) => r.facts;

describe("sortMarketItems", () => {
  const shelf = [
    row("jup", "Jupiter Lend", 0, 143_000_000),
    row("onre", "OnRe ONyc", 104.93, 12_000_000),
    row("aapl", "Apple", 0, 0),
    row("gold", "Tether Gold", 20, 0),
  ];

  it("keeps the catalog's own order by default", () => {
    expect(ids(sortMarketItems(shelf, "", factsOf))).toEqual(["jup", "onre", "aapl", "gold"]);
  });

  it("does not mutate the input", () => {
    const before = ids(shelf);
    sortMarketItems(shelf, "deposited", factsOf);
    expect(ids(shelf)).toEqual(before);
  });

  it("orders by name, case-insensitively", () => {
    expect(ids(sortMarketItems(shelf, "name", factsOf))).toEqual(["aapl", "jup", "onre", "gold"]);
  });

  it("orders by what the user holds, biggest first", () => {
    const sorted = ids(sortMarketItems(shelf, "position", factsOf));
    expect(sorted.slice(0, 2)).toEqual(["onre", "gold"]);
  });

  it("sinks rows with no figure to the bottom IN CATALOG ORDER, not as zeros", () => {
    // The whole point: a tokenised stock has no deposit figure, and ranking it
    // last-by-value would read as "nobody wants this" rather than "not applicable".
    const sorted = ids(sortMarketItems(shelf, "deposited", factsOf));
    expect(sorted).toEqual(["jup", "onre", "aapl", "gold"]);

    // Same shelf, reversed: the blanks must still trail in THEIR original order.
    const reversed = [...shelf].reverse();
    expect(ids(sortMarketItems(reversed, "deposited", factsOf))).toEqual([
      "jup",
      "onre",
      "gold",
      "aapl",
    ]);
  });
});
