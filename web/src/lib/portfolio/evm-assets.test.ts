import { describe, it, expect } from "vitest";

import { buildEvmAssets, EVM_NATIVE_SENTINEL, type AlchemyToken } from "@oxar/sdk";

const USDC_BASE = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

describe("buildEvmAssets", () => {
  it("builds an ERC-20 holding with metadata + price, tagged as ethereum chain", () => {
    const tokens: AlchemyToken[] = [
      {
        address: "0xWALLET",
        network: "base-mainnet",
        tokenAddress: USDC_BASE,
        tokenBalance: "100.5",
        tokenMetadata: { decimals: 6, symbol: "USDC", name: "USD Coin", logo: "u" },
        tokenPrices: [{ currency: "usd", value: "0.9998" }],
      },
    ];
    const [a] = buildEvmAssets(tokens);
    expect(a).toMatchObject({
      mint: USDC_BASE,
      symbol: "USDC",
      decimals: 6,
      chain: "ethereum",
      network: "base-mainnet",
      uiAmount: 100.5,
    });
    expect(a.amount).toBe(100_500_000n);
    expect(a.usdValue).toBeCloseTo(100.48, 2);
  });

  it("represents native token (tokenAddress null) with the native sentinel", () => {
    const tokens: AlchemyToken[] = [
      {
        address: "0xWALLET",
        network: "eth-mainnet",
        tokenAddress: null,
        tokenBalance: "1.5",
        tokenMetadata: { decimals: 18, symbol: "ETH", name: "Ethereum" },
        tokenPrices: [{ currency: "usd", value: "4000" }],
      },
    ];
    const [eth] = buildEvmAssets(tokens);
    expect(eth.mint).toBe(EVM_NATIVE_SENTINEL);
    expect(eth.symbol).toBe("ETH");
    expect(eth.usdValue).toBeCloseTo(6000, 2);
  });

  it("handles native coin with null metadata (real Alchemy shape) — 18 decimals + network symbol", () => {
    const tokens: AlchemyToken[] = [
      {
        address: "0xW",
        network: "base-mainnet",
        tokenAddress: null,
        tokenBalance: "0x" + (2_000_000_000_000_000_000n).toString(16), // 2 ETH
        tokenMetadata: { symbol: null as unknown as undefined, decimals: null as unknown as undefined },
        tokenPrices: [{ currency: "usd", value: "4000" }],
      },
    ];
    const [eth] = buildEvmAssets(tokens);
    expect(eth).toMatchObject({ mint: EVM_NATIVE_SENTINEL, symbol: "ETH", decimals: 18, chain: "ethereum" });
    expect(eth.uiAmount).toBeCloseTo(2, 9);
    expect(eth.usdValue).toBeCloseTo(8000, 2);
  });

  it("parses a hex base-unit balance", () => {
    const tokens: AlchemyToken[] = [
      {
        address: "0xW",
        network: "eth-mainnet",
        tokenAddress: USDC_BASE,
        tokenBalance: "0x" + (250_000_000n).toString(16), // 250 USDC
        tokenMetadata: { decimals: 6, symbol: "USDC" },
        tokenPrices: [{ currency: "usd", value: "1" }],
      },
    ];
    const [a] = buildEvmAssets(tokens);
    expect(a.amount).toBe(250_000_000n);
    expect(a.uiAmount).toBeCloseTo(250, 6);
  });

  it("drops dust, zero, unpriced, and errored tokens; sorts by USD desc", () => {
    const tokens: AlchemyToken[] = [
      { address: "0xW", network: "eth-mainnet", tokenAddress: "0xa", tokenBalance: "1", tokenMetadata: { decimals: 18, symbol: "SMALL" }, tokenPrices: [{ currency: "usd", value: "0.001" }] }, // dust
      { address: "0xW", network: "eth-mainnet", tokenAddress: "0xb", tokenBalance: "0", tokenMetadata: { decimals: 18, symbol: "ZERO" }, tokenPrices: [{ currency: "usd", value: "5" }] }, // zero
      { address: "0xW", network: "eth-mainnet", tokenAddress: "0xc", tokenBalance: "10", tokenMetadata: { decimals: 18, symbol: "NOPRICE" }, tokenPrices: [] }, // unpriced
      { address: "0xW", network: "eth-mainnet", tokenAddress: "0xd", tokenBalance: "2", tokenMetadata: { decimals: 18, symbol: "BIG" }, tokenPrices: [{ currency: "usd", value: "100" }] },
      { address: "0xW", network: "eth-mainnet", tokenAddress: "0xe", tokenBalance: "5", tokenMetadata: { decimals: 18, symbol: "MID" }, tokenPrices: [{ currency: "usd", value: "10" }] },
      { address: "0xW", network: "eth-mainnet", tokenAddress: "0xf", tokenBalance: "1", tokenMetadata: null, tokenPrices: [{ currency: "usd", value: "9" }], error: "boom" }, // errored
    ];
    const out = buildEvmAssets(tokens);
    expect(out.map((a) => a.symbol)).toEqual(["BIG", "MID"]); // $200, $50
  });
});
