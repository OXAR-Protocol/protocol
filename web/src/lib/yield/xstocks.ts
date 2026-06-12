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
 * Tokenized US stocks/ETFs (Backed "xStocks", Token-2022). Same swap-and-hold
 * model as Ondo USDY — buy = swap USDC→xStock, sell = swap back. No APY (price
 * exposure); P&L = current value − on-chain cost basis (earnings engine).
 *
 * Scales to many tickers via SHARED batched reads: one `getParsedTokenAccountsByOwner`
 * (Token-2022) covers every holding, and one Jupiter Price v3 call covers every
 * price — both deduped — so N providers cost ~2 network calls, not 2N.
 */
const USDC = new PublicKey(USDC_MINT);
const TOKEN_2022 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

export interface XStockConfig {
  symbol: string; // ticker, e.g. "AAPL"
  token: string; // on-chain symbol, e.g. "AAPLx"
  name: string; // display name
  mint: string; // xStock mint (Token-2022)
}
export interface XStockMeta extends XStockConfig {
  id: string; // matches `xstock-${symbol.toLowerCase()}`
}

// Catalog — the most liquid xStocks (mints verified via the Jupiter token registry,
// official Backed "Xs…" tokens; tickers that don't route a small USDC swap are left
// out). Extend = append a row (P&L follows automatically via /api/earnings).
export const XSTOCKS: readonly XStockMeta[] = [
  { id: "xstock-spy", symbol: "SPY", token: "SPYx", name: "S&P 500", mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W" },
  { id: "xstock-qqq", symbol: "QQQ", token: "QQQx", name: "Nasdaq 100", mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ" },
  { id: "xstock-nvda", symbol: "NVDA", token: "NVDAx", name: "NVIDIA", mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh" },
  { id: "xstock-tsla", symbol: "TSLA", token: "TSLAx", name: "Tesla", mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB" },
  { id: "xstock-aapl", symbol: "AAPL", token: "AAPLx", name: "Apple", mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp" },
  { id: "xstock-msft", symbol: "MSFT", token: "MSFTx", name: "Microsoft", mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX" },
  { id: "xstock-googl", symbol: "GOOGL", token: "GOOGLx", name: "Alphabet", mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN" },
  { id: "xstock-amzn", symbol: "AMZN", token: "AMZNx", name: "Amazon", mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg" },
  { id: "xstock-meta", symbol: "META", token: "METAx", name: "Meta", mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu" },
  { id: "xstock-avgo", symbol: "AVGO", token: "AVGOx", name: "Broadcom", mint: "XsgSaSvNSqLTtFuyWPBhK9196Xb9Bbdyjj4fH3cPJGo" },
  { id: "xstock-lly", symbol: "LLY", token: "LLYx", name: "Eli Lilly", mint: "Xsnuv4omNoHozR6EEW5mXkw8Nrny5rB3jVfLqi6gKMH" },
  { id: "xstock-jpm", symbol: "JPM", token: "JPMx", name: "JPMorgan Chase", mint: "XsMAqkcKsUewDrzVkait4e5u4y8REgtyS7jWgCpLV2C" },
  { id: "xstock-v", symbol: "V", token: "Vx", name: "Visa", mint: "XsqgsbXwWogGJsNcVZ3TyVouy2MbTkfCFhCGGGcQZ2p" },
  { id: "xstock-unh", symbol: "UNH", token: "UNHx", name: "UnitedHealth", mint: "XszvaiXGPwvk2nwb3o9C1CX4K6zH8sez11E6uyup6fe" },
  { id: "xstock-coin", symbol: "COIN", token: "COINx", name: "Coinbase", mint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu" },
  { id: "xstock-hood", symbol: "HOOD", token: "HOODx", name: "Robinhood", mint: "XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg" },
  { id: "xstock-mstr", symbol: "MSTR", token: "MSTRx", name: "MicroStrategy", mint: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ" },
  { id: "xstock-crcl", symbol: "CRCL", token: "CRCLx", name: "Circle", mint: "XsueG8BtpquVJX9LVLLEGuViXUungE6WmK5YZ3p3bd1" },
  { id: "xstock-pltr", symbol: "PLTR", token: "PLTRx", name: "Palantir", mint: "XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4" },
  { id: "xstock-amd", symbol: "AMD", token: "AMDx", name: "AMD", mint: "XsXcJ6GZ9kVnjqGsjBnktRcuwMBmvKWh8S93RefZ1rF" },
  { id: "xstock-nflx", symbol: "NFLX", token: "NFLXx", name: "Netflix", mint: "XsEH7wWfJJu2ZT3UCFeVfALnVA6CP5ur7Ee11KmzVpL" },
  { id: "xstock-orcl", symbol: "ORCL", token: "ORCLx", name: "Oracle", mint: "XsjFwUPiLofddX5cWFHW35GCbXcSu1BCUGfxoQAQjeL" },
  { id: "xstock-wmt", symbol: "WMT", token: "WMTx", name: "Walmart", mint: "Xs151QeqTCiuKtinzfRATnUESM2xTU6V9Wy8Vy538ci" },
  { id: "xstock-ko", symbol: "KO", token: "KOx", name: "Coca-Cola", mint: "XsaBXg8dU5cPM6ehmVctMkVqoiRG2ZjMo1cyBJ3AykQ" },
  { id: "xstock-mcd", symbol: "MCD", token: "MCDx", name: "McDonald's", mint: "XsqE9cRRpzxcGKDXj1BJ7Xmg4GRhZoyY1KpmGSxAWT2" },
  { id: "xstock-gld", symbol: "GLD", token: "GLDx", name: "Gold", mint: "Xsv9hRk1z5ystj9MhnA7Lq4vjSsLwzL2nxrwmwtD3re" },
  { id: "xstock-spcx", symbol: "SPCX", token: "SPCXx", name: "SpaceX", mint: "Xs3oZwbHvqis4NYcf4YKWmEia2eC84wSiVrcYcTqpH8" },
];

const STOCK_MINTS = XSTOCKS.map((s) => s.mint);

/** True for a tokenized-stock provider id (vs a yield source). */
export function isXStock(id: string): boolean {
  return id.startsWith("xstock-");
}

// --- Shared, deduped batch reads (one network call covers all tickers) ---
interface Holding {
  raw: bigint;
  ui: number;
}
const holdingsInflight = new Map<string, Promise<Record<string, Holding>>>();

/** All xStock balances for `owner` in ONE Token-2022 account scan. raw = base units
 *  (for swaps), ui = scaled human amount (for value). Cached 30s + deduped. */
async function allHoldings(owner: PublicKey, connection: Connection): Promise<Record<string, Holding>> {
  const key = owner.toBase58();
  const cacheKey = `xstock-holdings:${key}`;
  const cached = getCached<Record<string, Holding>>(cacheKey);
  if (cached) return cached;
  const pending = holdingsInflight.get(key);
  if (pending) return pending;
  const promise = (async () => {
    const { value } = await connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022 });
    const map: Record<string, Holding> = {};
    for (const { account } of value) {
      const info = (account.data as ParsedAccountData).parsed?.info;
      const mint: string | undefined = info?.mint;
      const ta = info?.tokenAmount;
      if (!mint || !ta?.amount) continue;
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

/** USD price per xStock mint in ONE Jupiter Price v3 call. Cached 60s + deduped. */
async function allPrices(): Promise<Record<string, number>> {
  const cacheKey = "xstock-prices-all";
  const cached = getCached<Record<string, number>>(cacheKey);
  if (cached) return cached;
  if (pricesInflight) return pricesInflight;
  pricesInflight = (async () => {
    try {
      const res = await fetch(`https://lite-api.jup.ag/price/v3?ids=${STOCK_MINTS.join(",")}`);
      if (!res.ok) return {};
      const json = (await res.json()) as Record<string, { usdPrice?: number } | undefined>;
      const out: Record<string, number> = {};
      for (const m of STOCK_MINTS) {
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

export function createXStockProvider(cfg: XStockMeta): YieldProvider {
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
    description: `Tokenized ${cfg.symbol} · buy/sell in USDC · non-US only`,
    riskLevel: "medium",
    chain: "solana",
    group: "xstocks",
    heldMint,
    heldDecimals: 8, // xStocks are Token-2022 with 8 decimals

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

export const xstockProviders: readonly YieldProvider[] = XSTOCKS.map(createXStockProvider);
