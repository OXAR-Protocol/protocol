import { describe, it, expect, vi, afterEach } from "vitest";

import { fetchWithRetry, isRetryableStatus } from "./fetch-retry";

const res = (status: number) => new Response("{}", { status });

afterEach(() => vi.unstubAllGlobals());

describe("isRetryableStatus", () => {
  it("retries 429 and 5xx, not other 4xx / 2xx", () => {
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(404)).toBe(false);
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(200)).toBe(false);
  });
});

describe("fetchWithRetry", () => {
  it("retries a 429 then returns the eventual 200", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(429))
      .mockResolvedValueOnce(res(200));
    vi.stubGlobal("fetch", fetchMock);

    const r = await fetchWithRetry("https://x", undefined, { backoffMs: 1 });
    expect(r.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry a non-retryable 4xx", async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(404));
    vi.stubGlobal("fetch", fetchMock);

    const r = await fetchWithRetry("https://x", undefined, { backoffMs: 1 });
    expect(r.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up after `retries` and returns the final retryable response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(res(503));
    vi.stubGlobal("fetch", fetchMock);

    const r = await fetchWithRetry("https://x", undefined, { retries: 2, backoffMs: 1 });
    expect(r.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 + 2 retries
  });

  it("retries network errors then throws if they persist", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchWithRetry("https://x", undefined, { retries: 1, backoffMs: 1 }),
    ).rejects.toThrow("network down");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
