import { describe, it, expect, afterEach } from "vitest";
import { getWallets } from "@wallet-standard/app";

import { injectedBatchSign } from "./injected-batch";

const ADDRESS = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";
const OTHER = "6dNVEK3hqQAMe8tGoAyZzZgpX1J4iBGqhZ1L5V9dGRnE";

const wire = (n: number) => Uint8Array.from([n, n + 1, n + 2]);

/** A Wallet-Standard wallet, registered the way a real one registers itself. */
function register(opts: {
  address?: string;
  sign?: (...inputs: { transaction: Uint8Array }[]) => Promise<readonly { signedTransaction: unknown }[]>;
  feature?: string;
}) {
  const wallet = {
    version: "1.0.0",
    name: "Test Wallet",
    icon: "data:image/svg+xml;base64,",
    chains: ["solana:mainnet"],
    accounts: [{ address: opts.address ?? ADDRESS, publicKey: new Uint8Array(32), chains: [], features: [] }],
    features: opts.sign
      ? { [opts.feature ?? "solana:signTransaction"]: { version: "1.0.0", signTransaction: opts.sign } }
      : {},
  };
  return getWallets().register(wallet as never);
}

const cleanups: (() => void)[] = [];
afterEach(() => {
  while (cleanups.length) cleanups.pop()!();
});

describe("injectedBatchSign", () => {
  it("is absent when no registered wallet can sign", () => {
    cleanups.push(register({}));
    expect(injectedBatchSign(ADDRESS)).toBeNull();
  });

  it("is absent when the wallet holds a different account", () => {
    cleanups.push(register({ address: OTHER, sign: async () => [] }));
    expect(injectedBatchSign(ADDRESS)).toBeNull();
  });

  it("hands the wallet every transaction in ONE call, as bytes", async () => {
    let seen: { transaction: Uint8Array }[] = [];
    cleanups.push(
      register({
        sign: async (...inputs) => {
          seen = inputs;
          return inputs.map((i) => ({ signedTransaction: i.transaction }));
        },
      }),
    );

    const out = await injectedBatchSign(ADDRESS)!([wire(1), wire(9)]);

    // One call, both transactions — that IS the fix: two prompts became one.
    expect(seen).toHaveLength(2);
    expect(seen[0]!.transaction).toBeInstanceOf(Uint8Array);
    expect(out).toEqual([wire(1), wire(9)]);
  });

  // The standard says Uint8Array; an in-app browser's bridge is less careful. Every
  // shape the same bytes can arrive in has to survive — this is what broke a live
  // basket, which signed fine and then failed on every row.
  it.each([
    ["base64", (b: Uint8Array) => btoa(String.fromCharCode(...b))],
    ["a byte array", (b: Uint8Array) => Array.from(b)],
    ["a JSON'd Buffer", (b: Uint8Array) => ({ type: "Buffer", data: Array.from(b) })],
    ["a byte-keyed object", (b: Uint8Array) => ({ ...Array.from(b) })],
  ])("takes back a signature returned as %s", async (_name, shape) => {
    cleanups.push(
      register({ sign: async (...inputs) => inputs.map((i) => ({ signedTransaction: shape(i.transaction) })) }),
    );
    const out = await injectedBatchSign(ADDRESS)!([wire(4)]);
    expect(out[0]).toEqual(wire(4));
  });

  it("says which transaction came back in a shape it can't send", async () => {
    cleanups.push(register({ sign: async () => [{ signedTransaction: { mystery: true } }] }));
    await expect(injectedBatchSign(ADDRESS)!([wire(1)])).rejects.toThrow(/transaction 1 into a shape/);
  });

  it("refuses a wallet that gives back a different number of transactions", async () => {
    cleanups.push(register({ sign: async (...inputs) => inputs.slice(1).map((i) => ({ signedTransaction: i.transaction })) }));
    await expect(injectedBatchSign(ADDRESS)!([wire(1), wire(2)])).rejects.toThrow(/different number/);
  });
});
