import { describe, it, expect, vi } from "vitest";

import { pollArrival } from "@oxar/sdk";

describe("pollArrival", () => {
  it("returns the realized delta once the balance rises past minDelta", async () => {
    const getCurrent = vi
      .fn()
      .mockResolvedValueOnce(100) // still at baseline
      .mockResolvedValueOnce(150); // arrived

    const delta = await pollArrival(getCurrent, 100, 40, () => false, 60_000, 0);
    expect(delta).toBe(50);
    expect(getCurrent).toHaveBeenCalledTimes(2);
  });

  it("stops as soon as stopped() reports true, without waiting out the timeout", async () => {
    let stopped = false;
    const getCurrent = vi.fn().mockResolvedValue(100); // never arrives

    const promise = pollArrival(getCurrent, 100, 40, () => stopped, 10 * 60 * 1000, 0);
    // Simulate the caller cancelling on the very next tick — this is the case a
    // user backing out of an on-ramp window hits: nothing ever arrives, and the
    // poll must not run out the full 10-minute timeout waiting for it.
    stopped = true;
    const delta = await promise;
    expect(delta).toBe(0);
  });

  it("gives up at the timeout and returns whatever arrived (possibly 0)", async () => {
    const getCurrent = vi.fn().mockResolvedValue(105); // arrived a little, not enough

    const delta = await pollArrival(getCurrent, 100, 40, () => false, 0, 0);
    expect(delta).toBe(5);
  });

  it("never returns a negative delta if the balance somehow dips below baseline", async () => {
    const getCurrent = vi.fn().mockResolvedValue(90);

    const delta = await pollArrival(getCurrent, 100, 40, () => false, 0, 0);
    expect(delta).toBe(0);
  });
});
