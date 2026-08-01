import { describe, it, expect } from "vitest";

import {
  PAYBIS_SELL_ASSET,
  PAYBIS_BUY_ASSET,
  PAYBIS_FEE_WARN_FRACTION,
  buildPaybisQuote,
  readPaybisError,
  readPaybisQuote,
  paybisSellUrl,
  paybisBuyUrl,
} from "@oxar/sdk";

/** Shapes copied from real api.paybis.com responses. The two legs differ in naming. */
const sellResponse = (over: Record<string, unknown> = {}) => ({
  currencyCodeFrom: "USDC-BASE",
  currencyCodeTo: "EUR",
  payoutMethods: [
    {
      id: "credit-card-out",
      amountFrom: { amount: "100", currencyCode: "USDC" },
      amountTo: { amount: "83.08", currencyCode: "EUR" },
      amountFromEquivalent: { amount: "86.87", currencyCode: "EUR" },
      fees: { totalFee: { amount: "3.79", currencyCode: "EUR" } },
      ...over,
    },
  ],
});

const buyResponse = (over: Record<string, unknown> = {}) => ({
  currencyCodeFrom: "EUR",
  currencyCodeTo: "USDC-SOL",
  paymentMethods: [
    {
      id: "credit-card",
      amountFrom: { amount: "100.00", currencyCode: "EUR" },
      amountTo: { amount: "109.895168", currencyCode: "USDC" },
      amountToEquivalent: { amount: "95.48", currencyCode: "EUR" },
      fees: { totalFee: { amount: "4.52", currencyCode: "EUR" } },
      ...over,
    },
  ],
});

describe("buildPaybisQuote", () => {
  it("sells over Base — their Solana USDC is buy-only", () => {
    const req = buildPaybisQuote("sell", "100.00", "UAH");
    expect(req.currencyCodeFrom).toBe(PAYBIS_SELL_ASSET);
    expect(PAYBIS_SELL_ASSET).toBe("USDC-BASE");
    expect(req.currencyCodeTo).toBe("UAH");
    expect(req.requestedAmount).toEqual({ amount: "100.00", currencyCode: "USDC-BASE" });
  });

  it("buys onto Solana, and the amount is the fiat being spent", () => {
    const req = buildPaybisQuote("buy", "100.00", "EUR");
    expect(req.currencyCodeFrom).toBe("EUR");
    expect(req.currencyCodeTo).toBe(PAYBIS_BUY_ASSET);
    expect(PAYBIS_BUY_ASSET).toBe("USDC-SOL");
    expect(req.requestedAmount).toEqual({ amount: "100.00", currencyCode: "EUR" });
  });
});

describe("readPaybisQuote — selling", () => {
  it("reads the card leg against what the crypto is worth", () => {
    const q = readPaybisQuote("sell", sellResponse())!;
    expect(q.receive).toBe(83.08);
    expect(q.receiveCurrency).toBe("EUR");
    expect(q.fee).toBe(3.79);
    expect(q.feeCurrency).toBe("EUR");
    expect(q.feeFraction).toBeCloseTo(0.0436, 4);
  });

  it("flags a small sale as pricey and a large one as not", () => {
    // 20 USDC really does lose ~20% to their flat fee; 1000 loses under 1%.
    const small = readPaybisQuote(
      "sell",
      sellResponse({
        amountTo: { amount: "13.86", currencyCode: "EUR" },
        amountFromEquivalent: { amount: "17.37", currencyCode: "EUR" },
        fees: { totalFee: { amount: "3.51", currencyCode: "EUR" } },
      }),
    )!;
    const large = readPaybisQuote(
      "sell",
      sellResponse({
        amountTo: { amount: "861.82", currencyCode: "EUR" },
        amountFromEquivalent: { amount: "868.73", currencyCode: "EUR" },
        fees: { totalFee: { amount: "6.91", currencyCode: "EUR" } },
      }),
    )!;
    expect(small.feeFraction).toBeGreaterThan(PAYBIS_FEE_WARN_FRACTION);
    expect(large.feeFraction).toBeLessThan(PAYBIS_FEE_WARN_FRACTION);
  });

  it("falls back to market minus payout when the fee is missing", () => {
    expect(readPaybisQuote("sell", sellResponse({ fees: {} }))!.fee).toBeCloseTo(3.79, 2);
  });
});

describe("readPaybisQuote — buying", () => {
  it("reads USDC received and charges the fee against the fiat spent", () => {
    const q = readPaybisQuote("buy", buyResponse())!;
    expect(q.receive).toBe(109.895168);
    expect(q.receiveCurrency).toBe("USDC");
    expect(q.fee).toBe(4.52);
    expect(q.feeCurrency).toBe("EUR");
    expect(q.feeFraction).toBeCloseTo(0.0452, 4);
  });

  it("flags the floor that makes tiny purchases absurd", () => {
    // 5 EUR really does lose 40% — the fee has a ~2 EUR floor.
    const tiny = readPaybisQuote(
      "buy",
      buyResponse({
        amountFrom: { amount: "5.00", currencyCode: "EUR" },
        amountTo: { amount: "3.429908", currencyCode: "USDC" },
        fees: { totalFee: { amount: "2.02", currencyCode: "EUR" } },
      }),
    )!;
    expect(tiny.feeFraction).toBeGreaterThan(PAYBIS_FEE_WARN_FRACTION);
    expect(tiny.feeFraction).toBeCloseTo(0.404, 3);
  });

  it("does not confuse the two legs", () => {
    expect(readPaybisQuote("buy", sellResponse())).toBeNull();
    expect(readPaybisQuote("sell", buyResponse())).toBeNull();
  });
});

describe("below their minimum", () => {
  // Verified live: an under-minimum order comes back HTTP 200 with a 0.00 payout and
  // the reason tucked into a per-method error array. Reading the amount alone shows
  // a confident zero.
  const belowMinSell = {
    ...sellResponse({
      amountTo: { amount: "0.00", currencyCode: "UAH" },
      amountFromEquivalent: { amount: "22.34", currencyCode: "UAH" },
      fees: { totalFee: { amount: "168.34", currencyCode: "UAH" } },
    }),
    payoutMethodErrors: [
      { error: { message: "You have to buy or sell at least 5.001 USDC per order" }, payoutMethod: "credit-card-out" },
    ],
  };
  const belowMinBuy = {
    ...buyResponse(),
    paymentMethodErrors: [
      { error: { message: "You have to buy or sell at least 4.34 EUR per order" }, paymentMethod: "credit-card" },
    ],
  };

  it("surfaces their reason on both legs", () => {
    expect(readPaybisError("sell", belowMinSell)).toContain("5.001 USDC");
    expect(readPaybisError("buy", belowMinBuy)).toContain("4.34 EUR");
  });

  it("refuses to quote a zero payout as if it were a price", () => {
    expect(readPaybisQuote("sell", belowMinSell)).toBeNull();
    expect(readPaybisQuote("buy", belowMinBuy)).toBeNull();
  });

  it("ignores an error belonging to a different method", () => {
    const other = {
      ...sellResponse(),
      payoutMethodErrors: [{ error: { message: "nope" }, payoutMethod: "bridgerpay_skrill" }],
    };
    expect(readPaybisError("sell", other)).toBeNull();
    expect(readPaybisQuote("sell", other)).not.toBeNull();
  });
});

describe("junk in", () => {
  it("returns null rather than guessing", () => {
    for (const bad of [null, "nope", {}, { payoutMethods: [{ id: "other" }] }]) {
      expect(readPaybisQuote("sell", bad)).toBeNull();
      expect(readPaybisQuote("buy", bad)).toBeNull();
    }
  });

  it("rejects a zero basis rather than dividing by it", () => {
    expect(
      readPaybisQuote("sell", sellResponse({ amountFromEquivalent: { amount: "0", currencyCode: "EUR" } })),
    ).toBeNull();
  });
});

describe("links", () => {
  it("sells from the public Base page", () => {
    expect(paybisSellUrl()).toBe("https://paybis.com/sell-usdc-base/");
  });

  it("prefills the buy page — the one place their deep link works", () => {
    expect(paybisBuyUrl("EUR", 100)).toBe("https://paybis.com/buy-usd-coin-solana/?currency=EUR&amount=100");
    expect(paybisBuyUrl("UAH")).toBe("https://paybis.com/buy-usd-coin-solana/?currency=UAH");
  });
});
