import { describe, it, expect } from "vitest";

import {
  buildWalletAssets,
  priceableMints,
  spendableBase,
  assetUid,
  SOL_FEE_RESERVE,
  SOL_MINT,
  type DasResult,
  type PriceMap,
  type WalletAsset,
} from "@oxar/sdk";


const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

describe("assetUid", () => {
  it("is the mint — one chain, so nothing else can collide", () => {
    const a = asset({ mint: "So111" });
    expect(assetUid(a)).toBe("So111");
  });
});

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

  it("keeps a stablecoin at $1 when the price feed skips it", () => {
    const das: DasResult = {
      items: [
        {
          interface: "FungibleToken",
          id: USDC,
          content: { metadata: { symbol: "USDC" } },
          token_info: { balance: 76_850_000, decimals: 6 },
        },
      ],
    };
    // The price round came back without USDC — rate-limited, truncated, whatever.
    // Dollars must not vanish from the wallet because a third party didn't answer.
    const [usdc] = buildWalletAssets(das, {}, { assumeUsdOne: new Set([USDC]) });
    expect(usdc).toBeDefined();
    expect(usdc!.usdValue).toBeCloseTo(76.85, 2);
  });

  it("still prefers the quoted price over the assumed dollar", () => {
    const das: DasResult = {
      items: [
        {
          interface: "FungibleToken",
          id: USDC,
          content: { metadata: { symbol: "USDC" } },
          token_info: { balance: 100_000_000, decimals: 6 },
        },
      ],
    };
    const [usdc] = buildWalletAssets(das, { [USDC]: { usdPrice: 0.99 } }, { assumeUsdOne: new Set([USDC]) });
    expect(usdc!.usdValue).toBeCloseTo(99, 2);
  });

  it("leaves an unpriced non-cash token out, assumption or not", () => {
    const das: DasResult = {
      items: [{ interface: "FungibleToken", id: "spam", token_info: { balance: 1_000_000_000, decimals: 6 } }],
    };
    expect(buildWalletAssets(das, {}, { assumeUsdOne: new Set([USDC]) })).toEqual([]);
  });
});

describe("priceableMints", () => {
  const fungible = (id: string, balance: number): NonNullable<DasResult["items"]>[number] => ({
    interface: "FungibleToken",
    id,
    token_info: { balance, decimals: 6 },
  });

  it("skips empty token accounts — a traded wallet is full of them", () => {
    const das: DasResult = { items: [fungible("empty", 0), fungible("real", 1_000_000)] };
    expect(priceableMints(das)).toEqual(["real"]);
  });

  it("skips positions the app already counts", () => {
    const das: DasResult = { items: [fungible("jlUSDC", 5), fungible("real", 5)] };
    expect(priceableMints(das, { skip: new Set(["jlUSDC"]) })).toEqual(["real"]);
  });

  it("puts cash first, so a cut can never drop the dollars", () => {
    const das: DasResult = {
      items: [fungible("spam1", 5), fungible("spam2", 5), fungible(USDC, 5)],
    };
    expect(priceableMints(das, { first: new Set([USDC]), max: 2 })).toEqual([USDC, "spam1"]);
  });

  it("keeps every real holding when there's no ceiling", () => {
    const items = Array.from({ length: 60 }, (_, i) => fungible(`mint${i}`, 5));
    expect(priceableMints({ items })).toHaveLength(60);
  });

  it("ignores NFTs", () => {
    const das: DasResult = { items: [{ interface: "V1_NFT", id: "nft" }, fungible("real", 5)] };
    expect(priceableMints(das)).toEqual(["real"]);
  });
});

const asset = (over: Partial<WalletAsset> & { mint: string; amount: bigint }): WalletAsset => ({
  symbol: "X",
  decimals: 9,
  uiAmount: 1,
  usdValue: 1,
  chain: "solana",
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

  it("spends the full balance for SPL (non-SOL) assets", () => {
    const usdc = asset({ mint: "EPjFW", amount: BigInt(50_000_000) });
    expect(spendableBase(usdc)).toBe(BigInt(50_000_000));
  });


  it("does NOT reserve for ERC-20 tokens (gas is paid in the native coin)", () => {
    const usdcOnBase = asset({ mint: "0xUSDC", amount: 50_000_000n, decimals: 6, chain: "solana" });
    expect(spendableBase(usdcOnBase)).toBe(50_000_000n);
  });

});
