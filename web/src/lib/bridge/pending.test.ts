import { describe, it, expect, beforeEach } from "vitest";

import {
  savePending,
  loadPending,
  loadAllPending,
  loadActivePending,
  loadStuckPending,
  countPending,
  promotePending,
  clearPending,
  type PendingBridge,
} from "./pending";

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
  mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
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

  it("clears the head", () => {
    savePending(sample, store);
    clearPending(undefined, store);
    expect(loadPending(store)).toBeNull();
  });

  it("queues concurrent bridges instead of clobbering (the B7 bug)", () => {
    const second: PendingBridge = { ...sample, originTxHash: "0xhash2", providerId: "xstock-tsla" };
    savePending(sample, store);
    savePending(second, store);
    // Both survive; head is the first-queued.
    expect(loadAllPending(store)).toHaveLength(2);
    expect(loadPending(store)?.originTxHash).toBe("0xhash");
  });

  it("drains head-first; the next becomes head", () => {
    const second: PendingBridge = { ...sample, originTxHash: "0xhash2", providerId: "xstock-tsla" };
    savePending(sample, store);
    savePending(second, store);
    clearPending(undefined, store); // finish the head
    expect(loadAllPending(store)).toHaveLength(1);
    expect(loadPending(store)?.originTxHash).toBe("0xhash2");
  });

  it("upserts by originTxHash (attempts bump doesn't duplicate)", () => {
    savePending(sample, store);
    savePending({ ...sample, attempts: 1 }, store);
    expect(loadAllPending(store)).toHaveLength(1);
    expect(loadPending(store)?.attempts).toBe(1);
  });

  it("removes a specific bridge by originTxHash", () => {
    const second: PendingBridge = { ...sample, originTxHash: "0xhash2" };
    savePending(sample, store);
    savePending(second, store);
    clearPending("0xhash", store);
    expect(loadAllPending(store).map((r) => r.originTxHash)).toEqual(["0xhash2"]);
  });

  // The bug this all exists for: a bridge whose deposit failed waits for a human, and
  // while it sat at the head the watcher polled nothing — a healthy bridge behind it
  // never arrived and never deposited, and the banner never mentioned it either.
  it("skips a stuck bridge at the head when picking what to work next", () => {
    savePending({ ...sample, attempts: 1 }, store);
    savePending({ ...sample, originTxHash: "0xhash2" }, store);
    expect(loadPending(store)?.originTxHash).toBe("0xhash");
    expect(loadActivePending(store)?.originTxHash).toBe("0xhash2");
    expect(loadStuckPending(store)?.originTxHash).toBe("0xhash");
  });

  it("has nothing to work when every bridge is stuck", () => {
    savePending({ ...sample, attempts: 1 }, store);
    savePending({ ...sample, originTxHash: "0xhash2", attempts: 2 }, store);
    expect(loadActivePending(store)).toBeNull();
    expect(countPending(store)).toEqual({ active: 0, stuck: 2 });
  });

  it("counts moving and stuck bridges apart", () => {
    savePending(sample, store);
    savePending({ ...sample, originTxHash: "0xhash2", attempts: 1 }, store);
    savePending({ ...sample, originTxHash: "0xhash3" }, store);
    expect(countPending(store)).toEqual({ active: 2, stuck: 1 });
  });

  // Retry has to mean "now": the record is re-armed AND moved to the head, otherwise
  // it would queue behind bridges that may take minutes to land.
  it("promotes a bridge to the head", () => {
    savePending(sample, store);
    savePending({ ...sample, originTxHash: "0xhash2" }, store);
    savePending({ ...sample, originTxHash: "0xhash3" }, store);
    promotePending("0xhash3", store);
    expect(loadAllPending(store).map((r) => r.originTxHash)).toEqual(["0xhash3", "0xhash", "0xhash2"]);
  });

  it("leaves the order alone when promoting the head or an unknown hash", () => {
    savePending(sample, store);
    savePending({ ...sample, originTxHash: "0xhash2" }, store);
    promotePending("0xhash", store);
    promotePending("0xnope", store);
    expect(loadAllPending(store).map((r) => r.originTxHash)).toEqual(["0xhash", "0xhash2"]);
  });
});
