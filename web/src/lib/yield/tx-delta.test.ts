import { describe, it, expect } from "vitest";

import { tokenDelta, type TokenBalanceEntry } from "@oxar/sdk";

const OWNER = "akc8oxarWalletAddressExampleForDeltaTest1";
const OTHER = "someoneElseWalletAddressForDeltaTest00001";
const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const AVGO = "XsgSaSvNSqLTtFuyWPBhK9196Xb9Bbdyjj4fH3cPJGo";

const bal = (owner: string, mint: string, amount: string): TokenBalanceEntry => ({
  owner,
  mint,
  uiTokenAmount: { amount },
});

describe("what a transaction actually settled", () => {
  // The reported case: the screen said $4.94 (what was asked for) while $4.84 landed.
  it("reports the USDC that really arrived from a sell", () => {
    const delta = tokenDelta(
      [bal(OWNER, USDC, "360000"), bal(OWNER, AVGO, "1288000")],
      [bal(OWNER, USDC, "5200000"), bal(OWNER, AVGO, "0")],
      OWNER,
      USDC,
    );
    expect(Number(delta) / 1e6).toBeCloseTo(4.84, 6);
  });

  // A first-ever buy creates the token account inside the same transaction, so there
  // is no PRE entry — the whole post balance is what was received.
  it("counts an account created by this very transaction", () => {
    expect(tokenDelta([], [bal(OWNER, AVGO, "762518")], OWNER, AVGO)).toBe(BigInt(762518));
    expect(tokenDelta(undefined, [bal(OWNER, AVGO, "762518")], OWNER, AVGO)).toBe(BigInt(762518));
  });

  it("sums across several accounts holding the same mint", () => {
    const delta = tokenDelta(
      [bal(OWNER, USDC, "1000000")],
      [bal(OWNER, USDC, "1500000"), bal(OWNER, USDC, "250000")],
      OWNER,
      USDC,
    );
    expect(delta).toBe(BigInt(750000));
  });

  it("ignores other wallets and other mints in the same transaction", () => {
    const delta = tokenDelta(
      [bal(OTHER, USDC, "9000000"), bal(OWNER, AVGO, "5")],
      [bal(OTHER, USDC, "1000000"), bal(OWNER, AVGO, "5")],
      OWNER,
      USDC,
    );
    expect(delta).toBe(BigInt(0));
  });

  it("goes negative for the token being sold", () => {
    const delta = tokenDelta(
      [bal(OWNER, AVGO, "762518")],
      [bal(OWNER, AVGO, "0")],
      OWNER,
      AVGO,
    );
    expect(delta).toBe(BigInt(-762518));
  });

  it("skips malformed amounts instead of throwing", () => {
    const delta = tokenDelta(
      [bal(OWNER, USDC, "not-a-number")],
      [bal(OWNER, USDC, "2000000"), { owner: OWNER, mint: USDC }],
      OWNER,
      USDC,
    );
    expect(delta).toBe(BigInt(2000000));
  });
});
