import { describe, it, expect } from "vitest";

import { groupProviderViews } from "./group-views";
import type { ProviderView } from "@/hooks/use-yield-positions";

function view(p: Partial<ProviderView> & { id: string }): ProviderView {
  return {
    id: p.id,
    name: p.name ?? "Jupiter Lend",
    assetSymbol: p.assetSymbol ?? "USDC",
    assetMint: p.assetMint ?? "mint",
    decimals: p.decimals ?? 6,
    description: p.description ?? "",
    riskLevel: p.riskLevel ?? "low",
    chain: p.chain ?? "solana",
    apy: p.apy ?? 0,
    group: p.group,
    underlyingBalance: p.underlyingBalance ?? BigInt(0),
    shares: p.shares ?? BigInt(0),
  };
}

describe("groupProviderViews", () => {
  it("collapses providers sharing a group into one group, keeps singletons", () => {
    const views = [
      view({ id: "jupiter-lend-usdc", group: "jupiter-lend", apy: 0.0529 }),
      view({ id: "jupiter-lend-usdt", group: "jupiter-lend", apy: 0.0407, assetSymbol: "USDT" }),
      view({ id: "jupiter-lend-usdg", group: "jupiter-lend", apy: 0.0569, assetSymbol: "USDG" }),
      view({ id: "kamino-lend-usdc", name: "Kamino Lend", apy: 0.0563 }),
    ];
    const groups = groupProviderViews(views);

    expect(groups.map((g) => g.key)).toEqual(["jupiter-lend", "kamino-lend-usdc"]);
    expect(groups[0].views).toHaveLength(3);
    expect(groups[0].name).toBe("Jupiter Lend");
    expect(groups[1].views).toHaveLength(1);
  });

  it("computes maxApy across members", () => {
    const groups = groupProviderViews([
      view({ id: "a", group: "g", apy: 0.0407 }),
      view({ id: "b", group: "g", apy: 0.0569 }),
    ]);
    expect(groups[0].maxApy).toBeCloseTo(0.0569, 9);
  });

  it("flags hasPosition when any member holds a balance", () => {
    const groups = groupProviderViews([
      view({ id: "a", group: "g" }),
      view({ id: "b", group: "g", underlyingBalance: BigInt(1_000_000) }),
    ]);
    expect(groups[0].hasPosition).toBe(true);
  });

  it("preserves the input order of first appearance", () => {
    const groups = groupProviderViews([
      view({ id: "kamino", name: "Kamino Lend" }),
      view({ id: "j1", group: "jupiter-lend" }),
    ]);
    expect(groups.map((g) => g.key)).toEqual(["kamino", "jupiter-lend"]);
  });
});
