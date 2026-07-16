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
} from "@oxar/sdk";
import { getProviderApy } from "./yields-api";
import { UserFacingError } from "./errors";
import type {
  BuildIxParams,
  RedeemTxParams,
  YieldPosition,
  YieldProvider,
} from "./types";

/**
 * Factory for "swap-and-hold" yield sources — a token whose yield accrues in its
 * PRICE (no staking/lockup). A deposit swaps the user's USDC into the token (held
 * in their own wallet); a withdraw swaps it back. Funds never touch an OXAR
 * program — we reuse the proven Jupiter swap rail (`lib/swap/jupiter-swap`).
 *
 * The provider's `asset` is USDC (what the user deposits, withdraws, and sees
 * value in), so paying with USDC takes the router's "direct" path and the provider
 * does the USDC↔token swap itself. Swaps are built as LEGACY txs: external wallets
 * mishandle Jupiter's default v0 tx, and legacy is signable by every wallet.
 *
 * Ondo USDY and Maple syrupUSDC are both built from this — adding a similar token
 * is one config, no duplicated swap logic.
 */
export interface SwapHoldConfig {
  id: string;
  name: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  /** The token the deposit acquires and the user holds. */
  heldMint: string;
  heldDecimals: number;
  /** DefiLlama pool id for the APY. */
  defiLlamaPoolId: string;
}

/**
 * Held-token base units to swap to realize ~`requestedUsdc`, given a full position
 * of `held` worth `valueUsdc`. Proportional exact-in (a pure ratio, so it's
 * decimal-agnostic). Whole balance for full/over-withdraws; 0 for empty input.
 */
export function amountToSwapForWithdraw(
  held: bigint,
  valueUsdc: bigint,
  requestedUsdc: bigint,
): bigint {
  if (held <= BigInt(0)) return BigInt(0);
  if (valueUsdc <= BigInt(0) || requestedUsdc >= valueUsdc) return held;
  const portion = (held * requestedUsdc) / valueUsdc;
  return portion > held ? held : portion;
}

/** Build a LEGACY Jupiter exact-in swap tx, guarding against excessive price impact. */
async function buildSwapLegacy(params: {
  owner: PublicKey;
  inputMint: string;
  outputMint: string;
  amount: bigint;
}): Promise<Transaction> {
  const quote = await getSwapQuote({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    asLegacy: true,
  });
  if (priceImpactTooHigh(quote)) {
    throw new UserFacingError("Price impact too high — try a smaller amount");
  }
  const b64 = await buildSwapTx(quote, params.owner.toBase58(), { asLegacy: true });
  return deserializeSwapTx(b64, true) as Transaction;
}

export function createSwapHoldProvider(cfg: SwapHoldConfig): YieldProvider {
  const heldPk = new PublicKey(cfg.heldMint);
  const priceCacheKey = `swap-hold:${cfg.heldMint}:price`;
  const priceUrl = `https://lite-api.jup.ag/price/v3?ids=${cfg.heldMint}`;
  // value(USDC base) = held(base) × price × 10^(USDC_DECIMALS − heldDecimals).
  const decimalFactor = 10 ** (USDC_DECIMALS - cfg.heldDecimals);

  /** Current held-token mid-price in USD (Jupiter Price v3), cached 60s. 0 if down. */
  async function getPriceUsd(): Promise<number> {
    const cached = getCached<number>(priceCacheKey);
    if (cached !== null) return cached;
    try {
      const res = await fetch(priceUrl);
      if (!res.ok) return 0;
      const json = (await res.json()) as Record<string, { usdPrice?: number } | undefined>;
      const price = json[cfg.heldMint]?.usdPrice;
      if (typeof price === "number" && price > 0) {
        setCache(priceCacheKey, price);
        return price;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /** Total held-token balance of `owner`, in base units. 0 if no token account. */
  async function readBalance(owner: PublicKey, connection: Connection): Promise<bigint> {
    const { value } = await connection.getParsedTokenAccountsByOwner(owner, { mint: heldPk });
    let total = BigInt(0);
    for (const { account } of value) {
      const amount = (account.data as ParsedAccountData).parsed?.info?.tokenAmount?.amount;
      if (amount) total += BigInt(amount);
    }
    return total;
  }

  const valueInUsdc = (held: bigint, price: number): bigint =>
    BigInt(Math.round(Number(held) * price * decimalFactor));

  return {
    id: cfg.id,
    name: cfg.name,
    asset: new PublicKey(USDC_MINT),
    assetSymbol: "USDC",
    decimals: USDC_DECIMALS,
    description: cfg.description,
    riskLevel: cfg.riskLevel,
    chain: "solana",
    defiLlamaPoolId: cfg.defiLlamaPoolId,
    heldMint: cfg.heldMint,
    heldDecimals: cfg.heldDecimals,

    // Deposit: swap `amount` USDC (base units) → held token, into the user's wallet.
    async buildDepositTx({ owner, amount }: BuildIxParams) {
      return buildSwapLegacy({ owner, inputMint: USDC_MINT, outputMint: cfg.heldMint, amount });
    },

    // Partial withdraw: swap the held token worth ~`amount` USDC back to USDC.
    async buildWithdrawTx({ owner, amount, connection }: BuildIxParams) {
      const held = await readBalance(owner, connection);
      if (held <= BigInt(0)) throw new UserFacingError("Nothing to withdraw");
      const price = await getPriceUsd();
      if (price <= 0) throw new UserFacingError("Price unavailable — try again");

      const valueUsdc = valueInUsdc(held, price);
      const toSwap = amountToSwapForWithdraw(held, valueUsdc, amount);
      if (toSwap <= BigInt(0)) throw new UserFacingError("Amount too small to withdraw");

      return buildSwapLegacy({ owner, inputMint: cfg.heldMint, outputMint: USDC_MINT, amount: toSwap });
    },

    // Full exit: swap the entire held balance back to USDC.
    async buildRedeemTx({ owner, connection }: RedeemTxParams) {
      const held = await readBalance(owner, connection);
      if (held <= BigInt(0)) throw new UserFacingError("Nothing to withdraw");
      return buildSwapLegacy({ owner, inputMint: cfg.heldMint, outputMint: USDC_MINT, amount: held });
    },

    async getPosition(owner: PublicKey, connection: Connection): Promise<YieldPosition> {
      try {
        const held = await readBalance(owner, connection);
        if (held <= BigInt(0)) return { underlyingBalance: BigInt(0), shares: BigInt(0) };
        const price = await getPriceUsd();
        const valueUsdc = price > 0 ? valueInUsdc(held, price) : held;
        return { underlyingBalance: valueUsdc, shares: held };
      } catch {
        return { underlyingBalance: BigInt(0), shares: BigInt(0) };
      }
    },

    async getApy(): Promise<number> {
      return getProviderApy(cfg.defiLlamaPoolId);
    },
  };
}
