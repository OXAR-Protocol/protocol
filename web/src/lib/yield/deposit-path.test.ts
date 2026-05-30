import { describe, it, expect } from "vitest";

import { chooseDepositPath } from "./deposit-path";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL = "So11111111111111111111111111111111111111112";

describe("chooseDepositPath", () => {
  it("direct when paying with the product's own asset on Solana", () => {
    expect(chooseDepositPath({ payMint: USDC, payChain: "solana", productMint: USDC })).toBe("direct");
  });

  it("swap for a different Solana asset", () => {
    expect(chooseDepositPath({ payMint: SOL, payChain: "solana", productMint: USDC })).toBe("swap");
  });

  it("bridge for any non-Solana chain", () => {
    expect(chooseDepositPath({ payMint: "0xabc", payChain: "ethereum", productMint: USDC })).toBe("bridge");
  });
});
