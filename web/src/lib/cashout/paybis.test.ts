import { describe, it, expect } from "vitest";

import {
  PAYBIS_SELL_ASSET,
  PAYBIS_FEE_WARN_FRACTION,
  buildPaybisSellQuote,
  readPaybisCardError,
  readPaybisCardQuote,
  paybisSellUrl,
} from "@oxar/sdk";

/** Shape copied from a real response to api.paybis.com (100 USDC → EUR, card). */
const response = (over: Record<string, unknown> = {}) => ({
  currencyCodeFrom: "USDC-BASE",
  currencyCodeTo: "EUR",
  payoutMethods: [
    {
      id: "credit-card-out",
      name: "Credit/Debit Card",
      amountFrom: { amount: "100", currencyCode: "USDC" },
      amountTo: { amount: "83.08", currencyCode: "EUR" },
      amountFromEquivalent: { amount: "86.87", currencyCode: "EUR" },
      fees: {
        networkFee: { amount: "0.00", currencyCode: "EUR" },
        serviceFee: { amount: "3.79", currencyCode: "EUR" },
        totalFee: { amount: "3.79", currencyCode: "EUR" },
      },
      ...over,
    },
  ],
});

describe("buildPaybisSellQuote", () => {
  it("sells USDC on Base — their Solana USDC is buy-only", () => {
    const req = buildPaybisSellQuote("100.00", "UAH");
    expect(req.currencyCodeFrom).toBe(PAYBIS_SELL_ASSET);
    expect(PAYBIS_SELL_ASSET).toBe("USDC-BASE");
    expect(req.currencyCodeTo).toBe("UAH");
    expect(req.requestedAmount).toEqual({ amount: "100.00", currencyCode: "USDC-BASE" });
    expect(req.requestedAmountType).toBe("from");
  });
});

describe("readPaybisCardQuote", () => {
  it("reads the card leg and derives the fee share", () => {
    const q = readPaybisCardQuote(response());
    expect(q).not.toBeNull();
    expect(q!.receive).toBe(83.08);
    expect(q!.currency).toBe("EUR");
    expect(q!.marketValue).toBe(86.87);
    expect(q!.fee).toBe(3.79);
    expect(q!.feeFraction).toBeCloseTo(0.0436, 4);
  });

  it("flags a small sale as pricey and a large one as not", () => {
    // 20 USDC really does lose ~20% to their flat fee; 1000 loses under 1%.
    const small = readPaybisCardQuote(
      response({
        amountTo: { amount: "13.86", currencyCode: "EUR" },
        amountFromEquivalent: { amount: "17.37", currencyCode: "EUR" },
        fees: { totalFee: { amount: "3.51", currencyCode: "EUR" } },
      }),
    );
    const large = readPaybisCardQuote(
      response({
        amountTo: { amount: "861.82", currencyCode: "EUR" },
        amountFromEquivalent: { amount: "868.73", currencyCode: "EUR" },
        fees: { totalFee: { amount: "6.91", currencyCode: "EUR" } },
      }),
    );
    expect(small!.feeFraction).toBeGreaterThan(PAYBIS_FEE_WARN_FRACTION);
    expect(large!.feeFraction).toBeLessThan(PAYBIS_FEE_WARN_FRACTION);
  });

  it("returns null when no card payout is offered", () => {
    expect(readPaybisCardQuote({ payoutMethods: [{ id: "bridgerpay_skrill" }] })).toBeNull();
  });

  it("returns null on an error body or junk", () => {
    expect(readPaybisCardQuote({ message: "Currency UAH is not available for payout" })).toBeNull();
    expect(readPaybisCardQuote(null)).toBeNull();
    expect(readPaybisCardQuote("nope")).toBeNull();
  });

  it("rejects a zero market value rather than dividing by it", () => {
    const q = readPaybisCardQuote(
      response({ amountFromEquivalent: { amount: "0", currencyCode: "EUR" } }),
    );
    expect(q).toBeNull();
  });

  it("falls back to market minus payout when the fee is missing", () => {
    const q = readPaybisCardQuote(response({ fees: {} }));
    expect(q!.fee).toBeCloseTo(3.79, 2);
  });
});

describe("below their minimum", () => {
  // Verified live: 0.5 USDC comes back HTTP 200 with a 0.00 payout and the reason
  // tucked into payoutMethodErrors. Reading the amount alone shows a confident zero.
  const belowMin = {
    ...response({
      amountTo: { amount: "0.00", currencyCode: "UAH" },
      amountFromEquivalent: { amount: "22.34", currencyCode: "UAH" },
      fees: { totalFee: { amount: "168.34", currencyCode: "UAH" } },
    }),
    payoutMethodErrors: [
      {
        error: { message: "You have to buy or sell at least 5.001 USDC per order" },
        payoutMethod: "credit-card-out",
      },
    ],
  };

  it("surfaces their reason", () => {
    expect(readPaybisCardError(belowMin)).toBe("You have to buy or sell at least 5.001 USDC per order");
  });

  it("refuses to quote a zero payout as if it were a price", () => {
    expect(readPaybisCardQuote(belowMin)).toBeNull();
  });

  it("ignores an error belonging to a different payout method", () => {
    const other = { ...response(), payoutMethodErrors: [{ error: { message: "nope" }, payoutMethod: "bridgerpay_skrill" }] };
    expect(readPaybisCardError(other)).toBeNull();
    expect(readPaybisCardQuote(other)).not.toBeNull();
  });
});

describe("paybisSellUrl", () => {
  it("points at the public sell page for USDC on Base", () => {
    expect(paybisSellUrl()).toBe("https://paybis.com/sell-usdc-base/");
  });
});
