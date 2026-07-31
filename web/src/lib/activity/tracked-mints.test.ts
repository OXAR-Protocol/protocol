import { describe, it, expect } from "vitest";

import { trackedMints } from "@oxar/sdk";

const USDG = "usdg";
const CATALOG = new Set([USDG, "usdc"]);
const JL_USDG = "jlUsdg-a-market-we-have-since-delisted";
const SPAM = "airdropped-nonsense";

/**
 * The bug this exists to prevent: a wallet was shown holding $3,323 a year ago, when
 * it had never held more than two thousand. Nothing was wrong with the arithmetic —
 * it had cycled dollars through a market we no longer list, every one of those
 * deposits read as money LEAVING the wallet, and the backward replay dutifully added
 * each phantom withdrawal back the further into the past it went.
 */
describe("what counts as the portfolio", () => {
  it("follows a catalogued asset into whatever it was swapped for", () => {
    const tracked = trackedMints([{ legs: { [USDG]: -100, [JL_USDG]: 99.8 } }], CATALOG);
    expect(tracked.has(JL_USDG)).toBe(true);
  });

  it("leaves an airdrop out — nothing of ours was on the other side of it", () => {
    const tracked = trackedMints([{ legs: { [SPAM]: 5_000_000 } }], CATALOG);
    expect(tracked.has(SPAM)).toBe(false);
  });

  it("keeps the catalog whether or not the wallet ever touched it", () => {
    const tracked = trackedMints([], CATALOG);
    expect([...tracked].sort()).toEqual([...CATALOG].sort());
  });

  it("does not care which direction the swap went", () => {
    const out = trackedMints([{ legs: { [JL_USDG]: -99.8, [USDG]: 100 } }], CATALOG);
    expect(out.has(JL_USDG)).toBe(true);
  });

  it("takes everything in a transaction that touched us, once we're in it", () => {
    // A route that hands back two things at once is still one exchange of ours.
    const tracked = trackedMints([{ legs: { usdc: -50, a: 1, b: 2 } }], CATALOG);
    expect(tracked.has("a")).toBe(true);
    expect(tracked.has("b")).toBe(true);
  });
});
