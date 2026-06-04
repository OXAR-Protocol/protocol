import { describe, it, expect } from "vitest";

import { alchemySubdomainFor } from "./rpc-proxy";

describe("alchemySubdomainFor", () => {
  it("maps every supported EVM chain id to its Alchemy JSON-RPC subdomain", () => {
    expect(alchemySubdomainFor(1)).toBe("eth-mainnet");
    expect(alchemySubdomainFor(10)).toBe("opt-mainnet");
    expect(alchemySubdomainFor(137)).toBe("polygon-mainnet");
    expect(alchemySubdomainFor(8453)).toBe("base-mainnet");
    expect(alchemySubdomainFor(42161)).toBe("arb-mainnet");
  });

  it("returns null for unsupported / invalid chain ids", () => {
    expect(alchemySubdomainFor(999)).toBeNull();
    expect(alchemySubdomainFor(0)).toBeNull();
    expect(alchemySubdomainFor(NaN)).toBeNull();
  });
});
