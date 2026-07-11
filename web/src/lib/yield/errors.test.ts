import { describe, it, expect } from "vitest";

import { toFriendlyError, UserFacingError } from "./errors";

describe("toFriendlyError", () => {
  it("passes a UserFacingError message through verbatim (no clobbering)", () => {
    const msg = "Fees are too high for $0.30 — try a larger amount or a cheaper chain (Base).";
    expect(toFriendlyError(new UserFacingError(msg))).toBe(msg);
  });

  it("maps a user rejection to a calm message", () => {
    expect(toFriendlyError(new Error("User rejected the request"))).toMatch(/cancelled/i);
  });

  it("maps an on-chain revert to a clear retry hint", () => {
    expect(toFriendlyError(new Error("execution reverted: TRANSFER_FROM_FAILED"))).toMatch(
      /on-chain|try a (larger|different)/i,
    );
  });

  it("maps a wrong-network error", () => {
    expect(toFriendlyError(new Error("Unsupported chain id"))).toMatch(/network/i);
  });

  it("gives a calm generic message for an unknown error — no scary raw dump", () => {
    const out = toFriendlyError(new Error("kaboom 12345"));
    expect(out).toBe("Something went wrong. Please try again.");
    expect(out).not.toContain("kaboom");
  });

  it("does not crash on a non-Error value and never leaks it to the user", () => {
    const out = toFriendlyError("plain string boom");
    expect(out).toBe("Something went wrong. Please try again.");
    expect(out).not.toContain("plain string boom");
  });

  it("recognises a rejection inside a thrown object (not [object Object])", () => {
    const out = toFriendlyError({ code: 4001, message: "user rejected the request" });
    expect(out).not.toContain("[object Object]");
    expect(out).toMatch(/cancelled/i);
  });

  it("maps a Solana on-chain failure to a friendly message — no logs shown", () => {
    const out = toFriendlyError(new Error("Transaction simulation failed: custom program error: 0x1788"));
    expect(out).toMatch(/didn't go through/i);
    expect(out).not.toContain("0x1788");
    expect(out).not.toMatch(/program|instruction|logs/i);
  });

  it("maps a slippage/price-move error to a clear retry hint", () => {
    const byCode = toFriendlyError(new Error("Transaction simulation failed: custom program error: 0x1771"));
    expect(byCode).toMatch(/price moved/i);
    const byLog = Object.assign(new Error("Transaction simulation failed"), {
      logs: ["Program log: AnchorError: SlippageToleranceExceeded", "Program failed"],
    });
    expect(toFriendlyError(byLog)).toMatch(/price moved/i);
  });
});
