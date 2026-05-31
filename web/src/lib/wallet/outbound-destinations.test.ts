import { describe, it, expect } from "vitest";

import { outboundKind, getDestChain } from "./outbound-destinations";

const solana = getDestChain("solana");
const base = getDestChain("base");

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDG = "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH";

describe("outboundKind", () => {
  it("bridges for any EVM destination, regardless of source", () => {
    expect(outboundKind(USDG, base, base.assets[0].mint)).toBe("bridge");
    expect(outboundKind(USDC, base, base.assets[1].mint)).toBe("bridge");
  });
  it("transfers same Solana asset", () => {
    expect(outboundKind(USDC, solana, USDC)).toBe("transfer");
  });
  it("swaps a different Solana asset (e.g. USDG → USDC, or → SOL)", () => {
    expect(outboundKind(USDG, solana, USDC)).toBe("swap");
    expect(outboundKind(USDG, solana, solana.assets[1].mint)).toBe("swap");
  });
});
