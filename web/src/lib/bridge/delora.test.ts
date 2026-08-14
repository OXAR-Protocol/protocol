import { describe, it, expect } from "vitest";

import {
  bridgeFeeUsd,
  bridgeFeeTooHigh,
  type BridgeQuote,
} from "@oxar/sdk";


const quote = (over: Partial<BridgeQuote> = {}): BridgeQuote => ({
  inputAmount: "10000000",
  outputAmount: "9918818",
  minOutputAmount: "9869224",
  estimatedTimeSec: 1,
  adapter: "RELAY",
  calldata: { to: "0xDIAMOND", value: "0x00", data: "0xabcd" },
  approvalAddress: "0xDIAMOND",
  fees: {
    breakdown: [
      { type: "gas", amountUsd: "0.0003" },
      { type: "relayer", amountUsd: "0.056" },
    ],
  },
  ...over,
});

describe("bridgeFeeUsd", () => {
  it("sums the USD fee breakdown", () => {
    expect(bridgeFeeUsd(quote())).toBeCloseTo(0.0563, 4);
  });
  it("is 0 when no breakdown", () => {
    expect(bridgeFeeUsd(quote({ fees: { breakdown: [] } }))).toBe(0);
  });
});

describe("bridgeFeeTooHigh", () => {
  it("blocks when fees exceed 30% of the deposit", () => {
    const q = quote({ fees: { breakdown: [{ type: "relayer", amountUsd: "4" }] } });
    expect(bridgeFeeTooHigh(q, 10)).toBe(true); // $4 fee on $10
  });
  it("allows a reasonable fee", () => {
    expect(bridgeFeeTooHigh(quote(), 10)).toBe(false); // ~$0.056 on $10
  });
});

