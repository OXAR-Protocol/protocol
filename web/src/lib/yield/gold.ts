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
  priceImpactTooHigh,
} from "@/lib/swap/jupiter-swap";
import { UserFacingError } from "./errors";
import type {
  BuildIxParams,
  RedeemTxParams,
  YieldPosition,
  YieldProvider,
} from "./types";

/**
 * Tokenized physical gold — same swap-and-hold model as Ondo/xStocks: buy = swap
 * USDC→gold, sell = swap back, held in the user's own wallet. No APY (price
 * exposure); P&L = current value − on-chain cost basis (earnings engine).
 *
 * Unlike xStocks (Token-2022), gold tokens are CLASSIC SPL (the Token program,
 * 6 decimals), so holdings are read with a Token-program scan and value uses the
 * token's own decimals. Gold is a commodity, not a US security, so it is NOT
 * behind the Reg S stock geoblock.
 */
const USDC = new PublicKey(USDC_MINT);
const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

export interface GoldMeta {
  id: string; // "gold-<symbol>"
  symbol: string; // ticker, e.g. "XAUT"
  token: string; // display symbol, e.g. "XAUt0"
  name: string; // display name, e.g. "Tether Gold"
  mint: string; // gold token mint (classic SPL)
  decimals: number; // token decimals (XAUt0 = 6)
}

// Catalog — physically-backed gold tokens with usable Solana liquidity (verified via
// Jupiter). XAUt0 (Tether Gold) is the deepest, 1 token ≈ 1 troy oz. Extend = append
// a row (P&L follows automatically via /api/earnings).
export const GOLD: readonly GoldMeta[] = [
  {
    id: "gold-xaut",
    symbol: "XAUT",
    token: "XAUt0",
    name: "Tether Gold",
    mint: "AymATz4TCL9sWNEEV9Kvyz45CHVhDZ6kUgjTJPzLpU9P",
    decimals: 6,
  },
];

const GOLD_MINTS = GOLD.map((g) => g.mint);

/** True for a gold provider id (vs a yield source). */
export function isGold(id: string): boolean {
  return id.startsWith("gold-");
}

// --- Shared, deduped batch reads (one network call covers all gold tokens) ---
interface Holding {
  raw: bigint;
  ui: number;
}
const holdingsInflight = new Map<string, Promise<Record<string, Holding>>>();

/** All gold balances for `owner` in ONE Token-program scan, filtered to GOLD mints.
 *  raw = base units (for swaps), ui = human amount (for value). Cached 30s + deduped. */
async function allHoldings(owner: PublicKey, connection: Connection): Promise<Record<string, Holding>> {
  const key = owner.toBase58();
  const cacheKey = `gold-holdings:${key}`;
  const cached = getCached<Record<string, Holding>>(cacheKey);
  if (cached) return cached;
  const pending = holdingsInflight.get(key);
  if (pending) return pending;
  const promise = (async () => {
    const { value } = await connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM });
    const map: Record<string, Holding> = {};
    for (const { account } of value) {
      const info = (account.data as ParsedAccountData).parsed?.info;
      const mint: string | undefined = info?.mint;
      if (!mint || !GOLD_MINTS.includes(mint)) continue;
      const ta = info?.tokenAmount;
      if (!ta?.amount) continue;
      const cur = map[mint] ?? { raw: BigInt(0), ui: 0 };
      map[mint] = { raw: cur.raw + BigInt(ta.amount), ui: cur.ui + (ta.uiAmount ?? 0) };
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

/** USD price per gold mint in ONE Jupiter Price v3 call. Cached 60s + deduped. */
async function allPrices(): Promise<Record<string, number>> {
  const cacheKey = "gold-prices-all";
  const cached = getCached<Record<string, number>>(cacheKey);
  if (cached) return cached;
  if (pricesInflight) return pricesInflight;
  pricesInflight = (async () => {
    try {
      const res = await fetch(`https://lite-api.jup.ag/price/v3?ids=${GOLD_MINTS.join(",")}`);
      if (!res.ok) return {};
      const json = (await res.json()) as Record<string, { usdPrice?: number } | undefined>;
      const out: Record<string, number> = {};
      for (const m of GOLD_MINTS) {
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

export function createGoldProvider(cfg: GoldMeta): YieldProvider {
  const heldMint = cfg.mint;

  function valueUsdcBase(ui: number, price: number): bigint {
    return price > 0 ? BigInt(Math.round(ui * price * 10 ** USDC_DECIMALS)) : BigInt(0);
  }

  async function swap(owner: PublicKey, inputMint: string, outputMint: string, amount: bigint): Promise<Transaction> {
    const quote = await getSwapQuote({ inputMint, outputMint, amount, asLegacy: true, slippageBps: 100 });
    if (priceImpactTooHigh(quote)) {
      throw new UserFacingError("Price impact too high — try a smaller amount");
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
    description: `Tokenized physical gold · 1 token ≈ 1 oz · buy/sell in USDC`,
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

export const goldProviders: readonly YieldProvider[] = GOLD.map(createGoldProvider);
