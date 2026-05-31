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

  it("prefers the built-in (embedded) wallet as the account", () => {
    expect(deriveSolanaWallets([phantom, embedded], null).active).toBe("EMBED111");
  });

  it("falls back to the only wallet (e.g. an external one) if no embedded", () => {
    expect(deriveSolanaWallets([phantom], null).active).toBe("PHANTOM22");
  });

  it("honors a valid override", () => {
    expect(deriveSolanaWallets([embedded, phantom], "PHANTOM22").active).toBe("PHANTOM22");
  });

  it("ignores a stale override → back to the embedded account", () => {
    expect(deriveSolanaWallets([embedded, phantom], "GONE999").active).toBe("EMBED111");
  });

  it("returns null active when there are no Solana wallets", () => {
    expect(deriveSolanaWallets([evm], null)).toEqual({ active: null, options: [] });
  });
});
