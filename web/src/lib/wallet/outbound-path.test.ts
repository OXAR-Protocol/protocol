import { describe, it, expect } from "vitest";

import { chooseOutboundPath } from "./outbound-path";
import { isValidEvmAddress, isValidAddressForChain } from "./transfer";

const USDC_SOL = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL = "So11111111111111111111111111111111111111112";
const SOL_ADDR = "AkC8BHHNJQ61fXVsHVnWsferBm4PC6t8oT8YwRmrwDtB";
const EVM_ADDR = "0xdfa8ec34bab1f63606afa24616775f0bcc729356";

describe("chooseOutboundPath", () => {
  it("transfer: same asset on Solana", () => {
    expect(chooseOutboundPath({ sourceMint: USDC_SOL, destChain: "solana", destMint: USDC_SOL })).toBe("transfer");
  });
  it("swap: different asset on Solana", () => {
    expect(chooseOutboundPath({ sourceMint: USDC_SOL, destChain: "solana", destMint: SOL })).toBe("swap");
  });
  it("bridge: any EVM destination", () => {
    expect(chooseOutboundPath({ sourceMint: USDC_SOL, destChain: "ethereum", destMint: "0xabc" })).toBe("bridge");
  });
});

describe("isValidEvmAddress", () => {
  it("accepts a 0x40-hex address (trimmed)", () => {
    expect(isValidEvmAddress(EVM_ADDR)).toBe(true);
    expect(isValidEvmAddress(`  ${EVM_ADDR}  `)).toBe(true);
  });
  it("rejects non-EVM", () => {
    expect(isValidEvmAddress(SOL_ADDR)).toBe(false);
    expect(isValidEvmAddress("0x123")).toBe(false);
  });
});

describe("isValidAddressForChain", () => {
  it("validates per chain", () => {
    expect(isValidAddressForChain(EVM_ADDR, "ethereum")).toBe(true);
    expect(isValidAddressForChain(SOL_ADDR, "ethereum")).toBe(false);
    expect(isValidAddressForChain(SOL_ADDR, "solana")).toBe(true);
    expect(isValidAddressForChain(EVM_ADDR, "solana")).toBe(false);
  });
});
