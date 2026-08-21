import { describe, it, expect } from "vitest";

import { excludePaySources } from "@/lib/pay/exclude";
import type { Cashable } from "@/hooks/use-cashable";
import type { ProviderView } from "@/hooks/use-yield-positions";
import type { WalletAsset } from "@oxar/sdk";

const AAPL_MINT = "XsAAPLxMint1111111111111111111111111111111";
const SPCX_MINT = "XsSPCXxMint1111111111111111111111111111111";

function position(id: string, heldMint?: string, usd = 100): Cashable {
  const view = { id, heldMint, name: id, assetSymbol: id } as ProviderView;
  return { kind: "position", key: `position:${id}`, symbol: id, usd, detail: id, view };
}

function coin(mint: string, symbol: string, usd = 40): Cashable {
  const asset = { mint, symbol, decimals: 6, amount: BigInt(0), uiAmount: 0, usdValue: usd } as WalletAsset;
  return { kind: "coin", key: `coin:${mint}`, symbol, usd, detail: symbol, asset };
}

describe("excludePaySources", () => {
  const items = [position("stock-aapl", AAPL_MINT), position("stock-spcx", SPCX_MINT), coin(SPCX_MINT, "SPCXx")];

  it("returns everything when nothing is being bought", () => {
    expect(excludePaySources(items)).toHaveLength(3);
    expect(excludePaySources(items, {})).toHaveLength(3);
  });

  it("drops the position in the very asset being bought", () => {
    const left = excludePaySources(items, { viewIds: ["stock-aapl"], mints: [AAPL_MINT] });
    expect(left.map((i) => i.key)).toEqual(["position:stock-spcx", `coin:${SPCX_MINT}`]);
  });

  it("drops a loose coin of the same mint — the round trip is the same either way", () => {
    const left = excludePaySources(items, { viewIds: ["stock-spcx"], mints: [SPCX_MINT] });
    expect(left.map((i) => i.key)).toEqual(["position:stock-aapl"]);
  });

  it("drops a second provider holding the same mint, not just the one named", () => {
    const twins = [position("stock-aapl", AAPL_MINT), position("stock-aapl-alt", AAPL_MINT)];
    expect(excludePaySources(twins, { viewIds: ["stock-aapl"], mints: [AAPL_MINT] })).toEqual([]);
  });

  it("ignores undefined mints — a yield source has no held mint", () => {
    const left = excludePaySources(items, { viewIds: ["jupiter-usdc"], mints: [undefined] });
    expect(left).toHaveLength(3);
  });

  it("empties the list when the only holding IS what's being bought", () => {
    expect(excludePaySources([position("stock-aapl", AAPL_MINT)], { viewIds: ["stock-aapl"] })).toEqual([]);
  });

  it("excludes every asset in a basket, not only the first", () => {
    const left = excludePaySources(items, {
      viewIds: ["stock-aapl", "stock-spcx"],
      mints: [AAPL_MINT, SPCX_MINT],
    });
    expect(left).toEqual([]);
  });
});
