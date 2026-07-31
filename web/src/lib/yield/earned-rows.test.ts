import { describe, it, expect } from "vitest";

import { byHolding } from "./earned-rows";
import { CASH_MINTS, JL_USDC } from "./position-mints";
import { PROVIDERS } from "./registry";

const LABELS = { cash: "dollars", other: "everything else" };
const [USDC] = [...CASH_MINTS];
const stock = PROVIDERS.find((p) => p.id.startsWith("xstock-"))!;
const STOCK = stock.heldMint as string;

const total = (perMint: Record<string, number>) =>
  Object.values(perMint).reduce((n, v) => n + v, 0);
const shown = (rows: { amount: number }[]) => rows.reduce((n, r) => n + r.amount, 0);

describe("the rows under the earned figure", () => {
  it("adds up to the figure it is explaining", () => {
    const perMint = { [STOCK]: -0.36, [JL_USDC]: 0.05, [USDC!]: -0.16, unknownMint: -0.02 };
    const rows = byHolding(perMint, new Set([STOCK]), LABELS);
    expect(shown(rows)).toBeCloseTo(total(perMint), 9);
  });

  it("keeps money too small to print rather than dropping it", () => {
    // Four dust lines are worth a real number together; losing them would put the
    // rows and the total quietly out of step.
    const perMint = { [STOCK]: 0.004, [JL_USDC]: 0.004, unknownA: 0.004, unknownB: 0.004 };
    const rows = byHolding(perMint, new Set(), LABELS);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.label).toBe(LABELS.other);
    expect(shown(rows)).toBeCloseTo(total(perMint), 9);
  });

  it("marks a holding closed inside the range, and keeps it", () => {
    const rows = byHolding({ [STOCK]: -0.36, [JL_USDC]: 0.5 }, new Set([JL_USDC]), LABELS);
    const sold = rows.find((r) => r.label !== "Jupiter Lend USDC")!;
    expect(sold.held).toBe(false);
    expect(rows.find((r) => r.label === "Jupiter Lend USDC")!.held).toBe(true);
  });

  it("never calls dollars closed — cash isn't a position you exit", () => {
    const rows = byHolding({ [USDC!]: -0.16 }, new Set(), LABELS);
    expect(rows[0]!.label).toBe(LABELS.cash);
    expect(rows[0]!.held).toBe(true);
    expect(rows[0]!.sourceId).toBeNull();
  });

  it("leads with what moved the money most", () => {
    const rows = byHolding({ [STOCK]: -0.36, [JL_USDC]: 0.05, [USDC!]: -0.16 }, new Set(), LABELS);
    expect(rows.map((r) => Math.abs(r.amount))).toEqual([0.36, 0.16, 0.05]);
  });

  it("gives a real holding the mark its position row wears", () => {
    const rows = byHolding({ [STOCK]: -0.36 }, new Set([STOCK]), LABELS);
    expect(rows[0]!.sourceId).toBe(stock.id);
  });
});
