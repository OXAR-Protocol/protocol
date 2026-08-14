import {
  Connection,
  PublicKey,
  Transaction,
  type ParsedAccountData,
} from "@solana/web3.js";

import { USDC_MINT, USDC_DECIMALS } from "@/lib/constants";
import { getCached, setCache } from "@/lib/cache";
import {
  getSwapQuote,
  buildSwapTx,
  deserializeSwapTx,
  quoteDeliveryRatio,
  marketLooksBroken,
} from "@oxar/sdk";
import { UserFacingError } from "./errors";
import { METALS, METAL_MINTS, METAL_PROGRAMS, type MetalMeta } from "./metals-catalog";
import type {
  BuildIxParams,
  RedeemTxParams,
  YieldPosition,
  YieldProvider,
} from "./types";

/**
 * Tokenized physical metal — same swap-and-hold model as Ondo/xStocks: buy = swap
 * USDC→metal, sell = swap back, held in the user's own wallet. No APY (price
 * exposure); P&L = current value − on-chain cost basis (earnings engine).
 *
 * Metals span both token programs (gold is classic SPL, Dominion Silver is
 * Token-2022), so balances are read with one scan per program in the catalog.
 * A metal is a commodity, not a US security, so it is NOT behind the Reg S
 * stock geoblock.
 */
const USDC = new PublicKey(USDC_MINT);

// --- Shared, deduped batch reads (one round covers every metal) ---
interface Holding {
  raw: bigint;
  ui: number;
}
const holdingsInflight = new Map<string, Promise<Record<string, Holding>>>();

/** All metal balances for `owner`, one scan per token program, filtered to METAL_MINTS.
 *  raw = base units (for swaps), ui = human amount (for value). Cached 30s + deduped. */
async function allHoldings(owner: PublicKey, connection: Connection): Promise<Record<string, Holding>> {
  const key = owner.toBase58();
  const cacheKey = `metal-holdings:${key}`;
  const cached = getCached<Record<string, Holding>>(cacheKey);
  if (cached) return cached;
  const pending = holdingsInflight.get(key);
  if (pending) return pending;
  const promise = (async () => {
    const scans = await Promise.all(
      METAL_PROGRAMS.map((programId) => connection.getParsedTokenAccountsByOwner(owner, { programId })),
    );
    const map: Record<string, Holding> = {};
    for (const { value } of scans) {
      for (const { account } of value) {
        const info = (account.data as ParsedAccountData).parsed?.info;
        const mint: string | undefined = info?.mint;
        if (!mint || !METAL_MINTS.includes(mint)) continue;
        const ta = info?.tokenAmount;
        if (!ta?.amount) continue;
        const cur = map[mint] ?? { raw: BigInt(0), ui: 0 };
        map[mint] = { raw: cur.raw + BigInt(ta.amount), ui: cur.ui + (ta.uiAmount ?? 0) };
      }
    }
    setCache(cacheKey, map);
    return map;
  })().finally(() => {
    if (holdingsInflight.get(key) === promise) holdingsInflight.delete(key);
  });
  holdingsInflight.set(key, promise);
  return promise;
}

let pricesInflight: Promise<Record<string, number>> | null = null;

/** USD price per metal mint in ONE Jupiter Price v3 call. Cached 60s + deduped. */
async function allPrices(): Promise<Record<string, number>> {
  const cacheKey = "metal-prices-all";
  const cached = getCached<Record<string, number>>(cacheKey);
  if (cached) return cached;
  if (pricesInflight) return pricesInflight;
  pricesInflight = (async () => {
    try {
      const res = await fetch(`https://lite-api.jup.ag/price/v3?ids=${METAL_MINTS.join(",")}`);
      if (!res.ok) return {};
      const json = (await res.json()) as Record<string, { usdPrice?: number } | undefined>;
      const out: Record<string, number> = {};
      for (const m of METAL_MINTS) {
        const p = json[m]?.usdPrice;
        if (typeof p === "number" && p > 0) out[m] = p;
      }
      setCache(cacheKey, out);
      return out;
    } catch {
      return {};
    } finally {
      pricesInflight = null;
    }
  })();
  return pricesInflight;
}

export function createMetalProvider(cfg: MetalMeta): YieldProvider {
  const heldMint = cfg.mint;

  function valueUsdcBase(ui: number, price: number): bigint {
    return price > 0 ? BigInt(Math.round(ui * price * 10 ** USDC_DECIMALS)) : BigInt(0);
  }

  async function swap(owner: PublicKey, inputMint: string, outputMint: string, amount: bigint): Promise<Transaction> {
    const quote = await getSwapQuote({ inputMint, outputMint, amount, asLegacy: true, slippageBps: 100 });
    // Cost is shown before signing, so it's the user's call — we only stop a route that
    // loses most of the value. Judged on the amounts, never on `priceImpactPct`, which
    // misreports thin tokens badly.
    const metalPrice = (await allPrices())[heldMint] ?? 0;
    const buying = outputMint === heldMint;
    const ratio = quoteDeliveryRatio({
      inAmount: BigInt(quote.inAmount),
      outAmount: BigInt(quote.outAmount),
      inDecimals: buying ? USDC_DECIMALS : cfg.decimals,
      outDecimals: buying ? cfg.decimals : USDC_DECIMALS,
      inPriceUsd: buying ? 1 : metalPrice,
      outPriceUsd: buying ? metalPrice : 1,
    });
    if (marketLooksBroken(ratio)) {
      throw new UserFacingError("This market looks broken right now — try again later");
    }
    const b64 = await buildSwapTx(quote, owner.toBase58(), { asLegacy: true });
    return deserializeSwapTx(b64, true) as Transaction;
  }

  return {
    id: cfg.id,
    name: `${cfg.name} (${cfg.token})`,
    asset: USDC,
    assetSymbol: "USDC",
    decimals: USDC_DECIMALS,
    description: `Tokenized physical ${cfg.metal} · 1 token ≈ 1 oz · buy/sell in USDC`,
    riskLevel: "medium",
    chain: "solana",
    heldMint,
    heldDecimals: cfg.decimals,

    async buildDepositTx({ owner, amount }: BuildIxParams) {
      return swap(owner, USDC_MINT, heldMint, amount);
    },

    async buildWithdrawTx({ owner, amount, connection }: BuildIxParams) {
      const held = (await allHoldings(owner, connection))[heldMint];
      if (!held || held.raw <= BigInt(0)) throw new UserFacingError("Nothing to sell");
      const price = (await allPrices())[heldMint] ?? 0;
      if (price <= 0) throw new UserFacingError("Price unavailable — try again");
      const value = valueUsdcBase(held.ui, price);
      let toSwap = value <= amount ? held.raw : (held.raw * amount) / value;
      if (toSwap <= BigInt(0) || toSwap > held.raw) toSwap = held.raw;
      return swap(owner, heldMint, USDC_MINT, toSwap);
    },

    async buildRedeemTx({ owner, connection }: RedeemTxParams) {
      const held = (await allHoldings(owner, connection))[heldMint];
      if (!held || held.raw <= BigInt(0)) throw new UserFacingError("Nothing to sell");
      return swap(owner, heldMint, USDC_MINT, held.raw);
    },

    async getPosition(owner: PublicKey, connection: Connection): Promise<YieldPosition> {
      try {
        const held = (await allHoldings(owner, connection))[heldMint];
        if (!held || held.raw <= BigInt(0)) return { underlyingBalance: BigInt(0), shares: BigInt(0) };
        const price = (await allPrices())[heldMint] ?? 0;
        return { underlyingBalance: valueUsdcBase(held.ui, price), shares: held.raw };
      } catch {
        return { underlyingBalance: BigInt(0), shares: BigInt(0) };
      }
    },

    async getApy(): Promise<number> {
      return 0;
    },
  };
}

export const metalProviders: readonly YieldProvider[] = METALS.map(createMetalProvider);
