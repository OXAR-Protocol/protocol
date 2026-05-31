import { describe, it, expect } from "vitest";

import { deriveSolanaWallets } from "./solana-wallets";

const embedded = { type: "wallet", chainType: "solana", address: "EMBED111", walletClientType: "privy" };
const phantom = { type: "wallet", chainType: "solana", address: "PHANTOM22", walletClientType: "phantom" };
const evm = { type: "wallet", chainType: "ethereum", address: "0xabc", walletClientType: "metamask" };

describe("deriveSolanaWallets", () => {
  it("returns only Solana wallets, labeled by kind", () => {
    const { options } = deriveSolanaWallets([embedded, phantom, evm], null);
    expect(options).toEqual([
      { address: "EMBED111", label: "Built-in wallet", isExternal: false },
      { address: "PHANTOM22", label: "Phantom", isExternal: true },
    ]);
  });

  it("prefers an external wallet when no override", () => {
    expect(deriveSolanaWallets([embedded, phantom], null).active).toBe("PHANTOM22");
  });

  it("falls back to the only (embedded) wallet", () => {
    expect(deriveSolanaWallets([embedded], null).active).toBe("EMBED111");
  });

  it("honors a valid override over the external preference", () => {
    expect(deriveSolanaWallets([embedded, phantom], "EMBED111").active).toBe("EMBED111");
  });

  it("ignores a stale override that is no longer linked", () => {
    expect(deriveSolanaWallets([embedded, phantom], "GONE999").active).toBe("PHANTOM22");
  });

  it("returns null active when there are no Solana wallets", () => {
    expect(deriveSolanaWallets([evm], null)).toEqual({ active: null, options: [] });
  });
});
