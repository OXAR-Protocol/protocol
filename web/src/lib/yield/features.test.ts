import { describe, it, expect } from "vitest";

import { isInsider, parseList, resolveFeatures, type FeatureConfig } from "@oxar/sdk";

import { PROVIDERS } from "./registry";

const config: FeatureConfig = {
  insiderEmails: ["pilot@oxar.app"],
  insiderWallets: ["akc8oxarWalletAddressExampleForFeatures1"],
  insiderFeatures: ["selling-v2", "portfolio-v2"],
  publicFeatures: ["intro"],
};

describe("who counts as an insider", () => {
  it("matches an allowlisted email regardless of case or padding", () => {
    expect(isInsider({ email: "  Pilot@OXAR.app " }, config)).toBe(true);
  });

  it("matches a wallet when the user signed in without an email", () => {
    expect(isInsider({ wallet: config.insiderWallets[0] }, config)).toBe(true);
  });

  // Base58 is case-sensitive: a lowercasing compare would admit a different address.
  it("does not match a wallet differing only in case", () => {
    expect(isInsider({ wallet: config.insiderWallets[0]!.toLowerCase() }, config)).toBe(false);
  });

  it("fails closed for a real user and for a session with no identity", () => {
    expect(isInsider({ email: "tester@example.com", wallet: "otherWallet" }, config)).toBe(false);
    expect(isInsider({}, config)).toBe(false);
    expect(isInsider({ email: null, wallet: null }, config)).toBe(false);
    expect(isInsider({ email: "", wallet: "" }, { ...config, insiderEmails: [""], insiderWallets: [""] })).toBe(false);
  });
});

describe("what a visitor may see", () => {
  it("gives a real user only the public keys", () => {
    expect(resolveFeatures({ email: "tester@example.com" }, config)).toEqual(["intro"]);
  });

  it("gives an insider the public keys plus the insider ones", () => {
    const seen = resolveFeatures({ email: "pilot@oxar.app" }, config);
    expect(seen).toContain("intro");
    expect(seen).toContain("selling-v2");
    expect(seen).toContain("portfolio-v2");
  });

  // Everything is dark unless a key is listed — that is the whole point.
  it("shows nothing at all when nothing is configured", () => {
    const empty: FeatureConfig = { insiderEmails: [], insiderWallets: [], insiderFeatures: [], publicFeatures: [] };
    expect(resolveFeatures({ email: "pilot@oxar.app" }, empty)).toEqual([]);
  });

  it("lists a key once when it is both public and insider", () => {
    const both = { ...config, publicFeatures: ["selling-v2"], insiderFeatures: ["selling-v2"] };
    expect(resolveFeatures({ email: "pilot@oxar.app" }, both)).toEqual(["selling-v2"]);
  });
});

describe("env parsing", () => {
  it("reads comma- and space-separated values, dropping blanks", () => {
    expect(parseList("a@x.com, b@x.com  c@x.com")).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
  });

  it("treats unset or blank env as nothing configured", () => {
    expect(parseList(undefined)).toEqual([]);
    expect(parseList("   ")).toEqual([]);
  });
});

describe("what ships on by default", () => {
  // Switching a key on lives in code because a Vercel env change only reaches the
  // NEXT deployment — so env is not a live switch, and code at least explains itself.
  it("serves selling-v2 to everyone", async () => {
    const { DEFAULT_PUBLIC_FEATURES } = await import("./default-features");
    expect(DEFAULT_PUBLIC_FEATURES).toContain("selling-v2");
  });
});

describe("gated sources", () => {
  // Asserted on purpose: a `feature` key left on by accident hides a source from
  // every real user, and that failure is silent. Currently gated: the Ondo-rail
  // stock pilot (AAPLon via Delora/DFlow) — un-gate after its real-money pass.
  it("gates exactly the Ondo stock pilot", () => {
    expect(PROVIDERS.filter((p) => p.feature).map((p) => p.id)).toEqual(["xstock-aapl-ondo"]);
  });

  it("still serves ONyc to everyone", () => {
    expect(PROVIDERS.some((p) => p.id === "onre-onyc")).toBe(true);
  });
});
