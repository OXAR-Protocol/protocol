import { describe, it, expect } from "vitest";

import {
  networkToChainId,
  bridgeFeeUsd,
  bridgeFeeTooHigh,
  bridgeNetOut,
  buildQuoteRequest,
  DELORA_SOLANA_CHAIN_ID,
  type BridgeQuote,
} from "./delora";
import { EVM_NATIVE_SENTINEL } from "@/lib/portfolio/evm-assets";

const USDC_SOL = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

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

describe("networkToChainId", () => {
  it("maps our supported Alchemy networks to Delora numeric chain ids", () => {
    expect(networkToChainId("eth-mainnet")).toBe(1);
    expect(networkToChainId("base-mainnet")).toBe(8453);
    expect(networkToChainId("arb-mainnet")).toBe(42161);
    expect(networkToChainId("opt-mainnet")).toBe(10);
    expect(networkToChainId("matic-mainnet")).toBe(137);
  });
  it("returns null for an unknown network", () => {
    expect(networkToChainId("zora-mainnet")).toBeNull();
  });
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

describe("bridgeNetOut", () => {
  it("returns the guaranteed-min output as bigint base units", () => {
    expect(bridgeNetOut(quote())).toBe(9869224n);
  });
});

describe("buildQuoteRequest", () => {
  it("builds an ERC-20 → Solana USDC request", () => {
    const req = buildQuoteRequest({
      senderAddress: "0xSENDER",
      originChainId: 8453,
      amount: 10_000_000n,
      originCurrency: USDC_BASE,
      receiverAddress: "SoLReceiver",
      destinationMint: USDC_SOL,
    });
    expect(req).toEqual({
      senderAddress: "0xSENDER",
      originChainId: 8453,
      destinationChainId: DELORA_SOLANA_CHAIN_ID,
      amount: "10000000",
      originCurrency: USDC_BASE,
      destinationCurrency: USDC_SOL,
      receiverAddress: "SoLReceiver",
    });
  });
  it("passes the native zero address through for native ETH", () => {
    const req = buildQuoteRequest({
      senderAddress: "0xSENDER",
      originChainId: 1,
      amount: 1_000_000_000_000_000_000n,
      originCurrency: EVM_NATIVE_SENTINEL,
      receiverAddress: "SoLReceiver",
      destinationMint: USDC_SOL,
    });
    expect(req.originCurrency).toBe(EVM_NATIVE_SENTINEL);
  });
});
