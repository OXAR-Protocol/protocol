import { describe, it, expect } from "vitest";

import { quoteDeliveryRatio, marketLooksBroken, MIN_QUOTE_DELIVERY } from "@oxar/sdk";

const USDC_DP = 6;

/** A held-token SELL: tokens in, USDC out. */
const sell = (tokens: number, tokenDp: number, price: number, usdcOut: number) =>
  quoteDeliveryRatio({
    inAmount: BigInt(Math.round(tokens * 10 ** tokenDp)),
    outAmount: BigInt(Math.round(usdcOut * 10 ** USDC_DP)),
    inDecimals: tokenDp,
    outDecimals: USDC_DP,
    inPriceUsd: price,
    outPriceUsd: 1,
  });

/** A held-token BUY: USDC in, tokens out. */
const buy = (usdcIn: number, tokens: number, tokenDp: number, price: number) =>
  quoteDeliveryRatio({
    inAmount: BigInt(Math.round(usdcIn * 10 ** USDC_DP)),
    outAmount: BigInt(Math.round(tokens * 10 ** tokenDp)),
    inDecimals: USDC_DP,
    outDecimals: tokenDp,
    inPriceUsd: 1,
    outPriceUsd: price,
  });

describe("value delivered by a quote", () => {
  // Measured live 2026-07-27. Jupiter REPORTED 2.219% impact on this sell, while it
  // actually returned 99.8% of the value — the false positive this replaces.
  it("passes the GLDx sell that the reported impact would have condemned", () => {
    const ratio = sell(0.0092, 8, 325.2, 2.994);
    expect(ratio).toBeGreaterThan(0.99);
    expect(marketLooksBroken(ratio)).toBe(false);
  });

  // Measured live: $3 buys 0.0076252 AVGOx while the reference implies 0.007819 —
  // a real ~2.5% entry spread. Expensive, but the user's call to make.
  it("passes the AVGOx buy that really does cost ~2.5%", () => {
    const ratio = buy(3, 0.0076252, 8, 383.7);
    expect(ratio).toBeCloseTo(0.975, 2);
    expect(marketLooksBroken(ratio)).toBe(false);
  });

  it("passes a clean trade", () => {
    expect(marketLooksBroken(sell(2.661, 9, 1.1274, 2.9996))).toBe(false);
  });

  it("catches a route that hands back a fraction of the value", () => {
    const ratio = sell(1000, 6, 1.12, 250); // ~78% of value gone
    expect(marketLooksBroken(ratio)).toBe(true);
  });

  it("draws the line at MIN_QUOTE_DELIVERY", () => {
    expect(marketLooksBroken(MIN_QUOTE_DELIVERY)).toBe(false);
    expect(marketLooksBroken(MIN_QUOTE_DELIVERY - 0.001)).toBe(true);
  });

  // A price feed being down must not block a trade: the user still sees the quote
  // and the swap carries its own on-chain slippage limit.
  it("reports unknown — not broken — when a reference price is missing", () => {
    expect(sell(1, 8, 0, 100)).toBeNull();
    expect(buy(3, 1, 8, Number.NaN)).toBeNull();
    expect(marketLooksBroken(null)).toBe(false);
  });

  it("reports unknown for an empty input rather than dividing by zero", () => {
    expect(sell(0, 8, 300, 0)).toBeNull();
  });

  it("handles a 9-decimal token against 6-decimal USDC without drift", () => {
    // 100 ONyc at $1.1274 → $112.74 out is exactly par.
    expect(sell(100, 9, 1.1274, 112.74)).toBeCloseTo(1, 6);
  });
});
