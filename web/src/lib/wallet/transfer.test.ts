import { describe, it, expect } from "vitest";

import { isValidSolanaAddress, maxSendable, validateSend, SOL_SEND_RESERVE } from "./transfer";
import { SOL_MINT, type WalletAsset } from "@/lib/portfolio/assets";

const asset = (over: Partial<WalletAsset> & { mint: string; amount: bigint }): WalletAsset => ({
  symbol: "X",
  decimals: 9,
  uiAmount: 1,
  usdValue: 1,
  chain: "solana",
  ...over,
});

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const VALID = "AkC8BHHNJQ61fXVsHVnWsferBm4PC6t8oT8YwRmrwDtB";

describe("isValidSolanaAddress", () => {
  it("accepts a real base58 address", () => {
    expect(isValidSolanaAddress(VALID)).toBe(true);
  });
  it("trims surrounding whitespace", () => {
    expect(isValidSolanaAddress(`  ${VALID}  `)).toBe(true);
  });
  it("rejects junk / EVM addresses", () => {
    expect(isValidSolanaAddress("not-an-address")).toBe(false);
    expect(isValidSolanaAddress("0x70d5000000000000000000000000000000000000")).toBe(false);
    expect(isValidSolanaAddress("")).toBe(false);
  });
});

describe("maxSendable", () => {
  it("reserves SOL for the fee on native sends", () => {
    expect(maxSendable(asset({ mint: SOL_MINT, amount: BigInt(5_000_000) }))).toBe(BigInt(5_000_000) - SOL_SEND_RESERVE);
  });
  it("returns 0 when SOL is below the reserve", () => {
    expect(maxSendable(asset({ mint: SOL_MINT, amount: BigInt(500_000) }))).toBe(BigInt(0));
  });
  it("sends the full balance for SPL tokens", () => {
    expect(maxSendable(asset({ mint: USDC, decimals: 6, amount: BigInt(2_731_219) }))).toBe(BigInt(2_731_219));
  });
});

describe("validateSend", () => {
  const usdc = asset({ mint: USDC, symbol: "USDC", decimals: 6, amount: BigInt(2_731_219) });
  it("passes a good request", () => {
    expect(validateSend({ asset: usdc, to: VALID, amountBase: BigInt(1_000_000) })).toBeNull();
  });
  it("flags a bad address", () => {
    expect(validateSend({ asset: usdc, to: "nope", amountBase: BigInt(1) })).toMatch(/valid Solana address/);
  });
  it("flags zero amount", () => {
    expect(validateSend({ asset: usdc, to: VALID, amountBase: BigInt(0) })).toMatch(/amount/i);
  });
  it("flags over-balance", () => {
    expect(validateSend({ asset: usdc, to: VALID, amountBase: BigInt(9_000_000) })).toMatch(/Not enough USDC/);
  });
  it("requires an asset", () => {
    expect(validateSend({ asset: null, to: VALID, amountBase: BigInt(1) })).toMatch(/Pick an asset/);
  });
});
