import { describe, it, expect } from "vitest";

import { isBetaIdentity, parseBetaList, type BetaAccessConfig } from "@oxar/sdk";

import { PROVIDERS } from "./registry";
import { onreOnycProvider } from "./onre";

const config: BetaAccessConfig = {
  emails: ["pilot@oxar.app"],
  wallets: ["akc8oxarWalletAddressExampleForBetaGate1"],
};

describe("beta identity matching", () => {
  it("matches an allowlisted email regardless of case or padding", () => {
    expect(isBetaIdentity({ email: "  Pilot@OXAR.app " }, config)).toBe(true);
  });

  it("matches an allowlisted wallet when the user signed in without an email", () => {
    expect(isBetaIdentity({ wallet: config.wallets[0] }, config)).toBe(true);
  });

  // Base58 is case-sensitive: a lowercasing compare would let a different address in.
  it("does not match a wallet that differs only in case", () => {
    expect(isBetaIdentity({ wallet: config.wallets[0]!.toLowerCase() }, config)).toBe(false);
  });

  it("fails closed for a tester, and for an identity-less session", () => {
    expect(isBetaIdentity({ email: "tester@example.com", wallet: "someOtherWallet" }, config)).toBe(false);
    expect(isBetaIdentity({}, config)).toBe(false);
    expect(isBetaIdentity({ email: null, wallet: null }, config)).toBe(false);
  });

  it("fails closed when nothing is allowlisted", () => {
    expect(isBetaIdentity({ email: "pilot@oxar.app" }, { emails: [], wallets: [] })).toBe(false);
  });

  it("ignores an empty-string identity (unset env, blank form field)", () => {
    expect(isBetaIdentity({ email: "", wallet: "" }, { emails: [""], wallets: [""] })).toBe(false);
  });
});

describe("beta list parsing", () => {
  it("reads comma- and space-separated values, dropping blanks", () => {
    expect(parseBetaList("a@x.com, b@x.com  c@x.com")).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
  });

  it("treats unset or empty env as no allowlist", () => {
    expect(parseBetaList(undefined)).toEqual([]);
    expect(parseBetaList("   ")).toEqual([]);
  });
});

describe("gated sources", () => {
  // ONyc was the first source piloted this way and is now public. The gate stays —
  // it is how the next one ships to a few people before everyone. Nothing is gated
  // today, and this asserts that on purpose: a `beta` flag left on by accident hides
  // a source from every real user, which is silent and easy to miss.
  it("has no source gated right now", () => {
    expect(PROVIDERS.filter((p) => p.beta).map((p) => p.id)).toEqual([]);
    expect(onreOnycProvider.beta).toBeUndefined();
  });

  it("still serves ONyc to everyone", () => {
    expect(PROVIDERS.some((p) => p.id === "onre-onyc")).toBe(true);
  });
});
