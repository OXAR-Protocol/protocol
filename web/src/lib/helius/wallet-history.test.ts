import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { forgetWalletHistory, getWalletHistory } from "./wallet-history";
import * as history from "./history";

/**
 * The shared read exists to stop three routes paging the same wallet separately.
 * These pin the two things that makes it worth having: a deeper read satisfies a
 * shallower question, and callers arriving together produce one request.
 */

const OWNER = "AkC8BHHNJQ61fXVsHVnWsferBm4PC6t8oT8YwRmrwDtB";
const KEY = "test-key";
const NOW = 1_780_000_000;

/** `n` transactions, newest first, one per hour. */
const page = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ signature: `s${i}`, timestamp: NOW - i * 3600 }));

let paged: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  forgetWalletHistory();
  paged = vi.spyOn(history, "fetchHistoryPaged");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getWalletHistory", () => {
  it("serves a shallow question from a deep read", async () => {
    paged.mockResolvedValue({ txs: page(292), exhausted: true, failed: false });

    const deep = await getWalletHistory(OWNER, KEY, { pages: 40, since: NOW - 365 * 86_400 });
    const shallow = await getWalletHistory(OWNER, KEY, { pages: 8, since: NOW - 7 * 86_400 });

    expect(deep.cached).toBe(false);
    expect(shallow.cached).toBe(true);
    expect(shallow.txs).toHaveLength(292);
    // The whole point: four ranges on one screen must not page four times.
    expect(paged).toHaveBeenCalledTimes(1);
  });

  it("reads again when the cached read is too shallow", async () => {
    paged.mockResolvedValueOnce({ txs: page(100), exhausted: false, failed: false });
    paged.mockResolvedValueOnce({ txs: page(292), exhausted: true, failed: false });

    await getWalletHistory(OWNER, KEY, { pages: 1, since: NOW - 7 * 86_400 });
    const deeper = await getWalletHistory(OWNER, KEY, { pages: 40, since: NOW - 365 * 86_400 });

    expect(deeper.cached).toBe(false);
    expect(deeper.txs).toHaveLength(292);
    expect(paged).toHaveBeenCalledTimes(2);
  });

  it("collapses callers that arrive together into one read", async () => {
    // `/you` mounts the chart, the earnings figures and the activity feed at once.
    let release: (() => void) | undefined;
    const gate = new Promise<void>((r) => (release = r));
    paged.mockImplementation(async () => {
      await gate;
      return { txs: page(292), exhausted: true, failed: false };
    });

    const all = Promise.all([
      getWalletHistory(OWNER, KEY, { pages: 40 }),
      getWalletHistory(OWNER, KEY, { pages: 25 }),
      getWalletHistory(OWNER, KEY, { pages: 8 }),
    ]);
    release!();
    const [a, b, c] = await all;

    expect(paged).toHaveBeenCalledTimes(1);
    for (const r of [a, b, c]) expect(r.txs).toHaveLength(292);
  });

  it("returns a truncated read without remembering it", async () => {
    // Caching a rate-limited page would turn one bad request into five minutes of
    // wrong charts — that is the bug this whole file exists downstream of.
    paged.mockResolvedValueOnce({ txs: page(200), exhausted: false, failed: true });
    paged.mockResolvedValueOnce({ txs: page(292), exhausted: true, failed: false });

    const bad = await getWalletHistory(OWNER, KEY, { pages: 40 });
    expect(bad.failed).toBe(true);
    expect(bad.txs).toHaveLength(200);

    const good = await getWalletHistory(OWNER, KEY, { pages: 40 });
    expect(good.cached).toBe(false);
    expect(good.exhausted).toBe(true);
    expect(paged).toHaveBeenCalledTimes(2);
  });

  it("keeps wallets apart", async () => {
    paged.mockResolvedValue({ txs: page(10), exhausted: true, failed: false });

    await getWalletHistory(OWNER, KEY, { pages: 8 });
    await getWalletHistory("So11111111111111111111111111111111111111112", KEY, { pages: 8 });

    expect(paged).toHaveBeenCalledTimes(2);
  });
});
