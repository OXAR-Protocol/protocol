import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  applyBasisDeltas,
  isBasisDeltaSettled,
  mergeBasisDelta,
  pruneBasisDeltas,
  PENDING_BASIS_MAX_AGE_MS,
  type PendingBasisDelta,
} from "@oxar/sdk";

import {
  recordBasisDelta,
  setIndexedBasis,
  effectiveBasis,
  hasIndexedBasis,
  resetPendingBasis,
  subscribeBasis,
  basisVersion,
} from "./pending-basis";

const OWNER = "akc8oxarTestWalletAddressForEarningsBasis00";
const SRC = "jupiter-lend-usdc";

const delta = (over: Partial<PendingBasisDelta> = {}): PendingBasisDelta => ({
  sourceId: SRC,
  deltaUsd: 50,
  serverBasisAtRecord: 51.75,
  at: 1_000,
  ...over,
});

describe("basis delta math", () => {
  it("treats a delta as unsettled while the indexed basis still lags", () => {
    expect(isBasisDeltaSettled(delta(), { [SRC]: 51.75 })).toBe(false);
  });

  it("settles once the indexed basis has moved by (almost) the delta", () => {
    // Indexed cost lands a hair under the requested amount (slippage) — still settled.
    expect(isBasisDeltaSettled(delta(), { [SRC]: 51.75 + 49.5 })).toBe(true);
  });

  it("settles a withdraw delta when the basis moves DOWN", () => {
    const d = delta({ deltaUsd: -50 });
    expect(isBasisDeltaSettled(d, { [SRC]: 51.75 })).toBe(false);
    expect(isBasisDeltaSettled(d, { [SRC]: 1.75 })).toBe(true);
  });

  it("prunes settled and expired deltas, keeps live ones", () => {
    const live = delta({ at: 5_000 });
    const expired = delta({ sourceId: "ondo-usdy", at: 5_000 });
    const now = 5_000 + PENDING_BASIS_MAX_AGE_MS + 1;
    expect(pruneBasisDeltas([live, expired], { [SRC]: 51.75 }, now)).toEqual([]);
    expect(pruneBasisDeltas([live], { [SRC]: 51.75 }, 6_000)).toEqual([live]);
  });

  it("adds the pending delta on top of the indexed basis", () => {
    expect(applyBasisDeltas({ [SRC]: 51.75 }, [delta()])[SRC]).toBeCloseTo(101.75);
  });

  it("covers a source the indexer has never seen (first-ever deposit)", () => {
    expect(applyBasisDeltas({}, [delta()])[SRC]).toBeCloseTo(50);
  });

  it("merges repeat deposits into one entry measured from the ORIGINAL basis", () => {
    const merged = mergeBasisDelta([delta()], delta({ deltaUsd: 25, at: 2_000 }));
    expect(merged).toHaveLength(1);
    expect(merged[0].deltaUsd).toBe(75);
    expect(merged[0].serverBasisAtRecord).toBe(51.75);
    expect(merged[0].at).toBe(2_000);
    // The indexer picking up only the FIRST deposit must not settle the pair.
    expect(isBasisDeltaSettled(merged[0], { [SRC]: 101.75 })).toBe(false);
  });
});

describe("pending-basis store", () => {
  beforeEach(() => resetPendingBasis());

  it("reports the indexed basis unchanged when nothing is pending", () => {
    setIndexedBasis(OWNER, { [SRC]: 51.75 });
    expect(effectiveBasis(OWNER)[SRC]).toBeCloseTo(51.75);
  });

  // The reported bug: value jumps to 102.51 while the basis is still 51.75, so
  // earned reads +50.75 — the top-up shown as profit.
  it("keeps earned honest right after a deposit the indexer hasn't seen", () => {
    setIndexedBasis(OWNER, { [SRC]: 51.75 });
    recordBasisDelta(OWNER, SRC, 50.75);
    const value = 102.51;
    expect(value - effectiveBasis(OWNER)[SRC]).toBeCloseTo(0.01, 2);
  });

  it("drops the delta once the indexer reports the deposit", () => {
    setIndexedBasis(OWNER, { [SRC]: 51.75 });
    recordBasisDelta(OWNER, SRC, 50.75);
    setIndexedBasis(OWNER, { [SRC]: 102.5 });
    expect(effectiveBasis(OWNER)[SRC]).toBeCloseTo(102.5);
  });

  it("subtracts a withdraw so the remaining position doesn't look like a loss", () => {
    setIndexedBasis(OWNER, { [SRC]: 100 });
    recordBasisDelta(OWNER, SRC, -40);
    expect(effectiveBasis(OWNER)[SRC]).toBeCloseTo(60);
  });

  it("keeps wallets separate", () => {
    setIndexedBasis(OWNER, { [SRC]: 100 });
    setIndexedBasis("otherWallet", { [SRC]: 10 });
    recordBasisDelta(OWNER, SRC, 50);
    expect(effectiveBasis("otherWallet")[SRC]).toBeCloseTo(10);
  });

  it("knows whether the indexer has answered for a wallet", () => {
    expect(hasIndexedBasis(OWNER)).toBe(false);
    setIndexedBasis(OWNER, {});
    expect(hasIndexedBasis(OWNER)).toBe(true);
  });

  it("does not re-render when a remount re-reports identical basis", () => {
    setIndexedBasis(OWNER, { [SRC]: 100 });
    const at = basisVersion();
    setIndexedBasis(OWNER, { [SRC]: 100 });
    expect(basisVersion()).toBe(at);
  });

  it("notifies subscribers so a mounted earnings view re-renders", () => {
    let hits = 0;
    const unsub = subscribeBasis(() => hits++);
    const before = basisVersion();
    setIndexedBasis(OWNER, { [SRC]: 100 });
    recordBasisDelta(OWNER, SRC, 50);
    unsub();
    expect(hits).toBe(2);
    expect(basisVersion()).toBeGreaterThan(before);
  });

  it("ignores a zero or non-finite delta", () => {
    setIndexedBasis(OWNER, { [SRC]: 100 });
    recordBasisDelta(OWNER, SRC, 0);
    recordBasisDelta(OWNER, SRC, Number.NaN);
    expect(effectiveBasis(OWNER)[SRC]).toBeCloseTo(100);
  });
});

describe("surviving a reload", () => {
  // The window a delta covers is the indexer's, so a reload inside it (the user
  // closing the tab after depositing and coming back) must not resurrect the bug.
  it("restores a pending delta from storage in a fresh module instance", async () => {
    const disk = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => disk.get(k) ?? null,
        setItem: (k: string, v: string) => void disk.set(k, v),
        removeItem: (k: string) => void disk.delete(k),
      },
    });

    vi.resetModules();
    const before = await import("./pending-basis");
    before.resetPendingBasis();
    before.setIndexedBasis(OWNER, { [SRC]: 51.75 });
    before.recordBasisDelta(OWNER, SRC, 50.75);

    // Reload: new module instance, same disk, indexer still answering the old basis.
    vi.resetModules();
    const after = await import("./pending-basis");
    after.setIndexedBasis(OWNER, { [SRC]: 51.75 });
    expect(after.effectiveBasis(OWNER)[SRC]).toBeCloseTo(102.5);

    after.resetPendingBasis();
    vi.unstubAllGlobals();
  });
});
