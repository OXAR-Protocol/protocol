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
 * Tokenized US stocks/ETFs (Backed Finance "xStocks", e.g. AAPLx, SPYx). Same
 * swap-and-hold model as Ondo USDY — buy = swap USDC→xStock, sell = swap back —
 * so OXAR is a thin UI over Backed's rails; funds stay in the user's wallet.
 *
 * Differences from a yield source (handled below):
 *  - No APY. A stock is PRICE exposure, not yield → `getApy` returns 0; the real
 *    P&L is current value − cost basis (the on-chain earnings engine), not a rate.
 *  - Token-2022 with a `scaledUiAmount` config: the true balance = raw × multiplier,
 *    so we value via the RPC `uiAmount` (which applies decimals + the multiplier),
 *    while swaps use the raw base amount.
 *
 * Compliance (NOT enforced here — product/legal gate before public launch): these
 * are Reg S securities, non-US only; needs a geoblock + terms. See
 * project_compliance_requirements.
 */
const USDC = new PublicKey(USDC_MINT);

export interface XStockConfig {
  /** Underlying ticker, e.g. "AAPL". */
  symbol: string;
  /** On-chain token symbol, e.g. "AAPLx". */
  token: string;
  /** Display name, e.g. "Apple". */
  name: string;
  /** xStock mint (Token-2022). */
  mint: string;
}

export function createXStockProvider(cfg: XStockConfig): YieldProvider {
  const heldMint = cfg.mint;
  const held = new PublicKey(heldMint);
  const priceUrl = `https://lite-api.jup.ag/price/v3?ids=${heldMint}`;
  const priceKey = `xstock-price:${heldMint}`;

  /** Mid-price in USD (Jupiter Price v3), cached 60s. 0 if unavailable. */
  async function price(): Promise<number> {
    const cached = getCached<number>(priceKey);
    if (cached !== null) return cached;
    try {
      const res = await fetch(priceUrl);
      if (!res.ok) return 0;
      const json = (await res.json()) as Record<string, { usdPrice?: number } | undefined>;
      const p = json[heldMint]?.usdPrice;
      if (typeof p === "number" && p > 0) {
        setCache(priceKey, p);
        return p;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /** Held balance: `raw` base units (for swaps) + `ui` human count (decimals +
   *  scaledUi multiplier already applied by the RPC). */
  async function readBalance(owner: PublicKey, connection: Connection): Promise<{ raw: bigint; ui: number }> {
    const { value } = await connection.getParsedTokenAccountsByOwner(owner, { mint: held });
    let raw = BigInt(0);
    let ui = 0;
    for (const { account } of value) {
      const ta = (account.data as ParsedAccountData).parsed?.info?.tokenAmount;
      if (ta?.amount) raw += BigInt(ta.amount);
      if (typeof ta?.uiAmount === "number") ui += ta.uiAmount;
    }
    return { raw, ui };
  }

  /** Held value in USDC base units (6 decimals). */
  function valueUsdcBase(ui: number, p: number): bigint {
    return p > 0 ? BigInt(Math.round(ui * p * 10 ** USDC_DECIMALS)) : BigInt(0);
  }

  /** Build a LEGACY Jupiter swap, guarding against excessive price impact. */
  async function swap(owner: PublicKey, inputMint: string, outputMint: string, amount: bigint): Promise<Transaction> {
    const quote = await getSwapQuote({ inputMint, outputMint, amount, asLegacy: true, slippageBps: 100 });
    if (priceImpactTooHigh(quote)) {
      throw new UserFacingError("Price impact too high — try a smaller amount");
    }
    const b64 = await buildSwapTx(quote, owner.toBase58(), { asLegacy: true });
    return deserializeSwapTx(b64, true) as Transaction;
  }

  return {
    id: `xstock-${cfg.symbol.toLowerCase()}`,
    name: `${cfg.name} (${cfg.token})`,
    asset: USDC,
    assetSymbol: "USDC",
    decimals: USDC_DECIMALS,
    description: `Tokenized ${cfg.symbol} · buy/sell in USDC · non-US only`,
    riskLevel: "medium", // equities = price risk, not yield
    chain: "solana",
    group: "xstocks", // collapse all stocks into one "Stocks" card with a ticker picker

    // Buy: swap `amount` USDC → xStock, held in the user's wallet.
    async buildDepositTx({ owner, amount }: BuildIxParams) {
      return swap(owner, USDC_MINT, heldMint, amount);
    },

    // Sell ~`amount` USDC worth back to USDC (proportional). Full exits route via redeem.
    async buildWithdrawTx({ owner, amount, connection }: BuildIxParams) {
      const { raw, ui } = await readBalance(owner, connection);
      if (raw <= BigInt(0)) throw new UserFacingError("Nothing to sell");
      const p = await price();
      if (p <= 0) throw new UserFacingError("Price unavailable — try again");
      const value = valueUsdcBase(ui, p);
      let toSwap = value <= amount ? raw : (raw * amount) / value;
      if (toSwap <= BigInt(0) || toSwap > raw) toSwap = raw;
      return swap(owner, heldMint, USDC_MINT, toSwap);
    },

    // Full exit: sell the entire holding back to USDC.
    async buildRedeemTx({ owner, connection }: RedeemTxParams) {
      const { raw } = await readBalance(owner, connection);
      if (raw <= BigInt(0)) throw new UserFacingError("Nothing to sell");
      return swap(owner, heldMint, USDC_MINT, raw);
    },

    async getPosition(owner: PublicKey, connection: Connection): Promise<YieldPosition> {
      try {
        const { raw, ui } = await readBalance(owner, connection);
        if (raw <= BigInt(0)) return { underlyingBalance: BigInt(0), shares: BigInt(0) };
        const p = await price();
        return { underlyingBalance: valueUsdcBase(ui, p), shares: raw };
      } catch {
        return { underlyingBalance: BigInt(0), shares: BigInt(0) };
      }
    },

    // A stock has no yield — value moves with the share price. P&L comes from the
    // earnings engine (current value − cost basis), not an APY.
    async getApy(): Promise<number> {
      return 0;
    },
  };
}

/** True for a tokenized-stock provider id (vs a yield source). */
export function isXStock(id: string): boolean {
  return id.startsWith("xstock-");
}

// --- Catalog (top-10 tickers; extend by appending a row). Mints verified via the
//     Jupiter token registry — the official Backed xStocks (vanity "Xs…" prefix). ---
export interface XStockMeta extends XStockConfig {
  /** Provider id — matches `xstock-${symbol.toLowerCase()}`. */
  id: string;
}

export const XSTOCKS: readonly XStockMeta[] = [
  { id: "xstock-spy", symbol: "SPY", token: "SPYx", name: "S&P 500", mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W" },
  { id: "xstock-qqq", symbol: "QQQ", token: "QQQx", name: "Nasdaq 100", mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ" },
  { id: "xstock-nvda", symbol: "NVDA", token: "NVDAx", name: "NVIDIA", mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh" },
  { id: "xstock-aapl", symbol: "AAPL", token: "AAPLx", name: "Apple", mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp" },
  { id: "xstock-msft", symbol: "MSFT", token: "MSFTx", name: "Microsoft", mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX" },
  { id: "xstock-tsla", symbol: "TSLA", token: "TSLAx", name: "Tesla", mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB" },
  { id: "xstock-googl", symbol: "GOOGL", token: "GOOGLx", name: "Alphabet", mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN" },
  { id: "xstock-amzn", symbol: "AMZN", token: "AMZNx", name: "Amazon", mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg" },
  { id: "xstock-meta", symbol: "META", token: "METAx", name: "Meta", mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu" },
  { id: "xstock-coin", symbol: "COIN", token: "COINx", name: "Coinbase", mint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu" },
];

export const xstockProviders: readonly YieldProvider[] = XSTOCKS.map(createXStockProvider);
