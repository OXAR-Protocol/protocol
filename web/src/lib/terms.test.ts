import { describe, it, expect } from "vitest";

import { TERMS_VERSION } from "@oxar/sdk";
import { parseTermsWallet } from "./terms";

describe("TERMS_VERSION", () => {
  it("is a UTC date string of the shape YYYY-MM-DD", () => {
    expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("parses as a real calendar date", () => {
    expect(Number.isNaN(new Date(`${TERMS_VERSION}T00:00:00Z`).getTime())).toBe(false);
  });
});

describe("parseTermsWallet", () => {
  const VALID = "AkC8BHHNJQ61fXVsHVnWsferBm4PC6t8oT8YwRmrwDtB";

  it("accepts a real base58 Solana address", () => {
    expect(parseTermsWallet(VALID)).toBe(VALID);
  });

  it("trims surrounding whitespace", () => {
    expect(parseTermsWallet(`  ${VALID}  `)).toBe(VALID);
  });

  it("rejects junk, empty, and non-Solana addresses", () => {
    expect(parseTermsWallet("not-an-address")).toBeNull();
    expect(parseTermsWallet("")).toBeNull();
    expect(parseTermsWallet("0x70d5000000000000000000000000000000000000")).toBeNull();
  });

  it("rejects non-string input", () => {
    expect(parseTermsWallet(undefined)).toBeNull();
    expect(parseTermsWallet(null)).toBeNull();
    expect(parseTermsWallet(123)).toBeNull();
    expect(parseTermsWallet({ wallet: VALID })).toBeNull();
  });
});
