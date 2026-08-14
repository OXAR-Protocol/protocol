import { describe, it, expect } from "vitest";

import { chooseDepositPath } from "@oxar/sdk";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL = "So11111111111111111111111111111111111111112";

/**
 * The router answers with a path something actually executes. It used to have a
 * third one — bridge — that the executor met with "coming soon"; the test that
 * asserted it was asserting a dead end.
 */
describe("chooseDepositPath", () => {
  it("pays straight in when the wallet already holds the product's asset", () => {
    expect(chooseDepositPath({ payMint: USDC, productMint: USDC })).toBe("direct");
  });

  it("swaps when it doesn't", () => {
    expect(chooseDepositPath({ payMint: SOL, productMint: USDC })).toBe("swap");
  });
});
