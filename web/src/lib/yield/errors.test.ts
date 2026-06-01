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

  it("appends the raw detail to the generic fallback (so unknown errors are diagnosable)", () => {
    const out = toFriendlyError(new Error("kaboom 12345"));
    expect(out).toMatch(/^Something went wrong\. Please try again\./);
    expect(out).toContain("kaboom 12345");
  });

  it("does not crash on a non-Error value and still surfaces it", () => {
    expect(toFriendlyError("plain string boom")).toContain("plain string boom");
  });

  it("extracts a message from a thrown object (not [object Object])", () => {
    const out = toFriendlyError({ code: 4001, message: "user rejected the request" });
    expect(out).not.toContain("[object Object]");
    expect(out).toMatch(/cancelled/i);
  });

  it("JSON-stringifies an object that has no message field", () => {
    const out = toFriendlyError({ code: -32603, detail: "boom" });
    expect(out).not.toContain("[object Object]");
    expect(out).toContain("-32603");
  });
});
