import { describe, it, expect, beforeEach } from "vitest";

import { savePending, loadPending, clearPending, type PendingBridge } from "./pending";

class FakeStorage {
  private m = new Map<string, string>();
  getItem = (k: string) => this.m.get(k) ?? null;
  setItem = (k: string, v: string) => void this.m.set(k, v);
  removeItem = (k: string) => void this.m.delete(k);
}

const sample: PendingBridge = {
  providerId: "jupiter-lend-usdc",
  originChainId: 8453,
  originTxHash: "0xhash",
  expectedUsdc: "9869224",
  baselineUsdc: "1000000",
  receiver: "SoLReceiver",
  bridgeScan: "https://scan/x",
  createdAt: 1_700_000_000_000,
};

describe("pending bridge persistence", () => {
  let store: FakeStorage;
  beforeEach(() => {
    store = new FakeStorage();
  });

  it("round-trips a pending bridge", () => {
    savePending(sample, store);
    expect(loadPending(store)).toEqual(sample);
  });

  it("returns null when nothing is stored", () => {
    expect(loadPending(store)).toBeNull();
  });

  it("returns null on corrupt JSON", () => {
    store.setItem("oxar:pending-bridge", "{not json");
    expect(loadPending(store)).toBeNull();
  });

  it("clears", () => {
    savePending(sample, store);
    clearPending(store);
    expect(loadPending(store)).toBeNull();
  });
});
