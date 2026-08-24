import { describe, expect, it } from "vitest";

import { bornAtFrom } from "./history";

/**
 * The birthday the portfolio chart is allowed to assert.
 *
 * Getting this wrong is not a cosmetic problem: `portfolioSeries` refuses to report
 * any day closing before it, so a birthday that is too late deletes history that
 * really happened. That shipped once — a 7-day range showed a balance the 30-day
 * range had already erased.
 */

const tx = (timestamp: number | undefined) =>
  ({ timestamp, signature: String(timestamp) }) as Parameters<typeof bornAtFrom>[0][number];

describe("bornAtFrom", () => {
  it("is the oldest transaction when the history was read to its end", () => {
    expect(bornAtFrom([tx(3000), tx(1000), tx(2000)], true)).toBe(1000);
  });

  it("refuses to name a birthday when paging stopped early", () => {
    // A page cap, the window, or a failed request all leave the beginning unknown.
    // Guessing here would trade one wrong chart for another.
    expect(bornAtFrom([tx(3000), tx(1000)], false)).toBeUndefined();
  });

  it("ignores transactions with no timestamp instead of dating them to 1970", () => {
    expect(bornAtFrom([tx(3000), tx(undefined), tx(2000)], true)).toBe(2000);
  });

  it("returns undefined for an empty history", () => {
    expect(bornAtFrom([], true)).toBeUndefined();
  });

  it("must be given the whole history, not the tracked subset", () => {
    // The regression, stated as a test. `history` holds everything the wallet ever
    // did; `txs` is what survives filtering to the mints this app tracks. Reading the
    // birthday off the filtered list moves it forward — here from day 1000 to day
    // 2600 — and every day in between is then dropped from the chart as "before the
    // account existed", which is exactly the history the user could still remember.
    const whole = [tx(1000), tx(2600), tx(3000)];
    const trackedOnly = [tx(2600), tx(3000)];

    expect(bornAtFrom(whole, true)).toBe(1000);
    expect(bornAtFrom(trackedOnly, true)).toBe(2600);
    expect(bornAtFrom(whole, true)).toBeLessThan(bornAtFrom(trackedOnly, true)!);
  });
});
