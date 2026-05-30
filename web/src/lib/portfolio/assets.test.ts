import { describe, it, expect } from "vitest";

import {
  buildWalletAssets,
  spendableBase,
  SOL_FEE_RESERVE,
  SOL_MINT,
  type DasResult,
  type PriceMap,
  type WalletAsset,
} from "./assets";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

describe("buildWalletAssets", () => {
  it("includes native SOL priced by Helius total_price", () => {
    const das: DasResult = { nativeBalance: { lamports: 2_000_000_000, total_price: 165.92 } };
    const [sol] = buildWalletAssets(das, {});
    expect(sol).toMatchObject({ mint: SOL_MINT, symbol: "SOL", decimals: 9, uiAmount: 2 });
    expect(sol.usdValue).toBeCloseTo(165.92, 2);
    expect(sol.amount).toBe(2_000_000_000n);
  });

  it("values fungibles via the price map and reads symbol from content metadata", () => {
    const das: DasResult = {
      items: [
        {
          interface: "FungibleToken",
          id: USDC,
          content: { metadata: { symbol: "USDC" } },
          token_info: { balance: 50_000_000, decimals: 6 },
        },
      ],
    };
    const prices: PriceMap = { [USDC]: { usdPrice: 0.9997 } };
    const [usdc] = buildWalletAssets(das, prices);
    expect(usdc).toMatchObject({ mint: USDC, symbol: "USDC", decimals: 6, uiAmount: 50 });
    expect(usdc.usdValue).toBeCloseTo(49.985, 3);
  });

  it("falls back to a shortened mint when symbol metadata is missing", () => {
    const das: DasResult = {
      items: [{ interface: "FungibleToken", id: "ABCDEFGH123", token_info: { balance: 1_000_000, decimals: 6 } }],
    };
    const [a] = buildWalletAssets(das, { ABCDEFGH123: { usdPrice: 1 } });
    expect(a.symbol).toBe("ABCD…");
  });

  it("drops dust, zero balances, NFTs, and sorts by USD desc", () => {
    const das: DasResult = {
      nativeBalance: { lamports: 1_000_000_000, total_price: 80 },
      items: [
        { interface: "V1_NFT", id: "nft1" },
        { interface: "FungibleToken", id: USDC, content: { metadata: { symbol: "USDC" } }, token_info: { balance: 200_000_000, decimals: 6 } },
        { interface: "FungibleToken", id: "dust", token_info: { balance: 1, decimals: 6 } }, // ~$0
        { interface: "FungibleToken", id: "zero", token_info: { balance: 0, decimals: 6 } },
      ],
    };
    const assets = buildWalletAssets(das, { [USDC]: { usdPrice: 1 }, dust: { usdPrice: 1 } });
    expect(assets.map((a) => a.symbol)).toEqual(["USDC", "SOL"]); // $200, then $80; dust/zero/nft gone
  });
});

const asset = (over: Partial<WalletAsset> & { mint: string; amount: bigint }): WalletAsset => ({
  symbol: "X",
  decimals: 9,
  uiAmount: 1,
  usdValue: 1,
  ...over,
});

describe("spendableBase", () => {
  it("reserves SOL for fees on native SOL", () => {
    const sol = asset({ mint: SOL_MINT, amount: BigInt(2_000_000_000) }); // 2 SOL
    expect(spendableBase(sol)).toBe(BigInt(2_000_000_000) - SOL_FEE_RESERVE);
  });

  it("returns 0 when SOL balance is below the reserve", () => {
    expect(spendableBase(asset({ mint: SOL_MINT, amount: BigInt(5_000_000) }))).toBe(BigInt(0));
  });

  it("spends the full balance for non-SOL assets", () => {
    const usdc = asset({ mint: "EPjFW", amount: BigInt(50_000_000) });
    expect(spendableBase(usdc)).toBe(BigInt(50_000_000));
  });
});
