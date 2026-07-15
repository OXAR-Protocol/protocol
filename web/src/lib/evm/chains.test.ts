import { describe, it, expect } from "vitest";
import { mainnet, base, arbitrum, optimism, polygon } from "viem/chains";

import { viemChainById, publicClientFor } from "./chains";

describe("viemChainById", () => {
  it("maps the supported EVM chain ids", () => {
    expect(viemChainById(1)).toBe(mainnet);
    expect(viemChainById(10)).toBe(optimism);
    expect(viemChainById(137)).toBe(polygon);
    expect(viemChainById(8453)).toBe(base);
    expect(viemChainById(42161)).toBe(arbitrum);
  });

  it("returns null for unsupported chains", () => {
    expect(viemChainById(56)).toBeNull(); // BNB — not supported
    expect(viemChainById(999999)).toBeNull();
  });
});

describe("publicClientFor", () => {
  it("throws on an unsupported chain (before any network use)", () => {
    expect(() => publicClientFor(56)).toThrow(/Unsupported EVM chain/);
  });
});
