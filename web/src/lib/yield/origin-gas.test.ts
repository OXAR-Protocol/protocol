import { describe, it, expect } from "vitest";

import {
  checkOriginGas,
  nativeSymbolFor,
  originGasReserveUsd,
  EVM_NATIVE_SENTINEL,
  type WalletAsset,
} from "@oxar/sdk";

const evm = (over: Partial<WalletAsset>): WalletAsset => ({
  mint: "0xToken",
  symbol: "USDC",
  decimals: 6,
  amount: BigInt(100_000_000),
  uiAmount: 100,
  usdValue: 100,
  chain: "ethereum",
  network: "base-mainnet",
  ...over,
});

const native = (network: string, usd: number): WalletAsset =>
  evm({ mint: EVM_NATIVE_SENTINEL, symbol: "ETH", decimals: 18, network, usdValue: usd, uiAmount: usd / 3000 });

const sol: WalletAsset = {
  mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  symbol: "USDC",
  decimals: 6,
  amount: BigInt(50_000_000),
  uiAmount: 50,
  usdValue: 50,
  chain: "solana",
};

describe("nativeSymbolFor", () => {
  it("names the coin that actually pays the fee", () => {
    expect(nativeSymbolFor("matic-mainnet")).toBe("POL");
    expect(nativeSymbolFor("base-mainnet")).toBe("ETH");
    expect(nativeSymbolFor("eth-mainnet")).toBe("ETH");
  });
});

describe("originGasReserveUsd", () => {
  it("charges L1 more than the L2s", () => {
    expect(originGasReserveUsd("eth-mainnet")).toBeGreaterThan(originGasReserveUsd("base-mainnet"));
  });

  it("falls back for a network we have no figure for", () => {
    expect(originGasReserveUsd("unknown-net")).toBe(0.5);
  });
});

describe("checkOriginGas", () => {
  // The Solana leg is relayer-sponsored, so holding no SOL is not a problem there.
  it("says nothing about Solana pay-assets", () => {
    expect(checkOriginGas(sol, [sol]).kind).toBe("ok");
    expect(checkOriginGas(null, []).kind).toBe("ok");
  });

  // The case that used to fail silently: paying with an ERC-20 and holding no ETH.
  it("flags an ERC-20 payment with no native coin on that chain", () => {
    const r = checkOriginGas(evm({}), [evm({})]);
    expect(r).toMatchObject({ kind: "missing", network: "base-mainnet", symbol: "ETH" });
  });

  it("flags a native balance that's under the likely fee", () => {
    const r = checkOriginGas(evm({}), [evm({}), native("base-mainnet", 0.02)]);
    expect(r).toMatchObject({ kind: "low", haveUsd: 0.02 });
    expect((r as { neededUsd: number }).neededUsd).toBe(0.1);
  });

  it("is happy once there's enough of the native coin", () => {
    expect(checkOriginGas(evm({}), [evm({}), native("base-mainnet", 5)]).kind).toBe("ok");
  });

  // Gas is per-chain: ETH sitting on Arbitrum cannot pay a fee on Base.
  it("only counts the native coin on the SAME chain", () => {
    const r = checkOriginGas(evm({ network: "base-mainnet" }), [
      evm({ network: "base-mainnet" }),
      native("arb-mainnet", 50),
    ]);
    expect(r.kind).toBe("missing");
  });

  it("still reports when the native coin is itself the pay-asset and too small", () => {
    const tiny = native("eth-mainnet", 0.4);
    expect(checkOriginGas(tiny, [tiny])).toMatchObject({ kind: "low", neededUsd: 1.5 });
  });

  it("names POL on Polygon rather than ETH", () => {
    const r = checkOriginGas(evm({ network: "matic-mainnet" }), [evm({ network: "matic-mainnet" })]);
    expect(r).toMatchObject({ kind: "missing", symbol: "POL", neededUsd: 0.05 });
  });
});
