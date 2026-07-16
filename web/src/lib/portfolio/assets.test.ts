import { describe, it, expect } from "vitest";

import {
  buildWalletAssets,
  spendableBase,
  assetUid,
  SOL_FEE_RESERVE,
  SOL_MINT,
  EVM_GAS_RESERVE_USD,
  type DasResult,
  type PriceMap,
  type WalletAsset,
} from "@oxar/sdk";

const EVM_NATIVE = "0x0000000000000000000000000000000000000000";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

describe("assetUid", () => {
  const nativeEth = (network: string): WalletAsset => ({
    mint: "0x0000000000000000000000000000000000000000",
    symbol: "ETH",
    decimals: 18,
    amount: BigInt(1),
    uiAmount: 1,
    usdValue: 3000,
    chain: "ethereum",
    network,
  });

  it("distinguishes native ETH across networks (same mint, different network)", () => {
    // The bug: native ETH shares one mint everywhere, so keying by mint collides.
    expect(assetUid(nativeEth("base-mainnet"))).not.toBe(assetUid(nativeEth("arb-mainnet")));
  });

  it("is stable, and unique vs an EVM asset", () => {
    const sol: WalletAsset = { mint: USDC, symbol: "USDC", decimals: 6, amount: BigInt(0), uiAmount: 0, usdValue: 0, chain: "solana" };
    expect(assetUid(sol)).toBe(assetUid(sol));
    expect(assetUid(sol)).not.toBe(assetUid(nativeEth("eth-mainnet")));
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

  // --- native EVM gas reserve (fixes the "Insufficient Ethereum (ETH)" bug) ---
  const nativeEvm = (network: string, amountWei: bigint, uiEth: number, usdValue: number): WalletAsset =>
    asset({ mint: EVM_NATIVE, amount: amountWei, decimals: 18, uiAmount: uiEth, usdValue, chain: "ethereum", network });
  const usdOf = (wei: bigint, pricePerEth: number) => (Number(wei) / 1e18) * pricePerEth;

  it("reserves L1 gas for native ETH on Ethereum — the insufficient-ETH bug", () => {
    // 0.0013 ETH ≈ $2.53 (the screenshot): must NOT spend it all — leave gas for
    // the ~$0.56 Ethereum fee, or the wallet rejects the bridge tx.
    const eth = nativeEvm("eth-mainnet", 1_300_000_000_000_000n, 0.0013, 2.53);
    const spend = spendableBase(eth);
    expect(spend).toBeGreaterThan(0n);
    expect(spend).toBeLessThan(eth.amount);
    const reservedUsd = usdOf(eth.amount - spend, eth.usdValue / eth.uiAmount);
    expect(reservedUsd).toBeCloseTo(EVM_GAS_RESERVE_USD["eth-mainnet"], 1); // ~$1.50
  });

  it("reserves a small gas buffer on cheap L2s (Base)", () => {
    const eth = nativeEvm("base-mainnet", 10_000_000_000_000_000n, 0.01, 19.46); // 0.01 ETH
    const spend = spendableBase(eth);
    const reservedUsd = usdOf(eth.amount - spend, eth.usdValue / eth.uiAmount);
    expect(reservedUsd).toBeCloseTo(EVM_GAS_RESERVE_USD["base-mainnet"], 1); // ~$0.10
  });

  it("does NOT reserve for ERC-20 tokens (gas is paid in the native coin)", () => {
    const usdcOnBase = asset({ mint: "0xUSDC", amount: 50_000_000n, decimals: 6, chain: "ethereum", network: "base-mainnet" });
    expect(spendableBase(usdcOnBase)).toBe(50_000_000n);
  });

  it("returns 0 when native ETH is below the gas reserve", () => {
    const eth = nativeEvm("eth-mainnet", 100_000_000_000_000n, 0.0001, 0.19); // $0.19 < $1.50
    expect(spendableBase(eth)).toBe(0n);
  });
});
