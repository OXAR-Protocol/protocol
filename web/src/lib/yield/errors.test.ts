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

  it("falls back to a generic message for unknown raw errors", () => {
    expect(toFriendlyError(new Error("kaboom 12345"))).toBe("Something went wrong. Please try again.");
  });
});
