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
import { getProviderApy } from "./yields-api";
import { UserFacingError } from "./errors";
import type {
  BuildIxParams,
  RedeemTxParams,
  YieldPosition,
  YieldProvider,
} from "./types";

/**
 * Ondo USDY — tokenized US Treasuries, the first RWA on OXAR. USDY is a classic
 * SPL (6 decimals) whose yield (~3.5% T-bill rate) accrues by the token's PRICE
 * rising over time — holding it earns, no staking or lockup. So this is a
 * "swap-and-hold" provider: a deposit swaps the user's USDC into USDY (held in
 * their own wallet), a withdraw swaps USDY back to USDC. We reuse the proven
 * Jupiter swap rail (`lib/swap/jupiter-swap`); funds never touch an OXAR program.
 *
 * The provider's `asset` is USDC — the unit the user deposits, withdraws, and
 * sees value in — so paying with USDC takes the router's "direct" path and this
 * provider does the USDC↔USDY swap itself. The position value is the held USDY
 * priced in USDC.
 *
 * Swaps are built as LEGACY transactions: external wallets mishandle Jupiter's
 * default v0 tx (broadcast malformed bytes), and legacy is universally signable
 * by both embedded and external wallets. The USDC↔USDY route is short (2 hops),
 * so it fits a legacy tx with room to spare.
 */
const USDY_MINT = "A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6";
const USDY = new PublicKey(USDY_MINT);
const USDC = new PublicKey(USDC_MINT);

// DefiLlama pool — Ondo USDY on Solana (project "ondo-yield-assets"). APY source.
const DEFILLAMA_POOL = "00b83068-9f87-4411-b5d7-5d2ff48c40c4";

const PRICE_URL = `https://lite-api.jup.ag/price/v3?ids=${USDY_MINT}`;
const PRICE_CACHE_KEY = "ondo-usdy:price";

/** Current USDY mid-price in USD (Jupiter Price v3), cached 60s. 0 if unavailable. */
async function getUsdyPriceUsd(): Promise<number> {
  const cached = getCached<number>(PRICE_CACHE_KEY);
  if (cached !== null) return cached;
  try {
    const res = await fetch(PRICE_URL);
    if (!res.ok) return 0;
    const json = (await res.json()) as Record<string, { usdPrice?: number } | undefined>;
    const price = json[USDY_MINT]?.usdPrice;
    if (typeof price === "number" && price > 0) {
      setCache(PRICE_CACHE_KEY, price);
      return price;
    }
    return 0;
  } catch {
    return 0;
  }
}

/** Total USDY held by `owner`, in base units (6 decimals). 0 if no token account. */
async function readUsdyBalance(owner: PublicKey, connection: Connection): Promise<bigint> {
  const { value } = await connection.getParsedTokenAccountsByOwner(owner, { mint: USDY });
  let total = BigInt(0);
  for (const { account } of value) {
    const amount = (account.data as ParsedAccountData).parsed?.info?.tokenAmount?.amount;
    if (amount) total += BigInt(amount);
  }
  return total;
}

/**
 * USDY (base units) to swap to realize ~`requestedUsdc` USDC out, given a full
 * position of `usdy` base units worth `valueUsdc`. Proportional exact-in — the
 * realized USDC lands within slippage of the request (the codebase's existing
 * tolerance). Returns the whole balance for full/over-withdraws; 0 for degenerate
 * input (caller rejects). USDY and USDC are both 6-decimal, so the ratio is direct.
 */
export function usdyToSwapForWithdraw(
  usdy: bigint,
  valueUsdc: bigint,
  requestedUsdc: bigint,
): bigint {
  if (usdy <= BigInt(0)) return BigInt(0);
  if (valueUsdc <= BigInt(0) || requestedUsdc >= valueUsdc) return usdy;
  const portion = (usdy * requestedUsdc) / valueUsdc;
  return portion > usdy ? usdy : portion;
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

export const ondoUsdyProvider: YieldProvider = {
  id: "ondo-usdy",
  name: "Ondo USDY",
  asset: USDC,
  assetSymbol: "USDC",
  decimals: USDC_DECIMALS,
  description: "Tokenized US Treasuries · yield accrues in price · swap out anytime",
  riskLevel: "low",
  chain: "solana",
  defiLlamaPoolId: DEFILLAMA_POOL,
  heldMint: USDY_MINT,
  heldDecimals: 6,

  // Deposit: swap `amount` USDC (base units) → USDY, held in the user's wallet.
  async buildDepositTx({ owner, amount }: BuildIxParams) {
    return buildSwapLegacy({
      owner,
      inputMint: USDC_MINT,
      outputMint: USDY_MINT,
      amount,
    });
  },

  // Partial withdraw: swap the USDY worth ~`amount` USDC back to USDC. Full exits
  // route through buildRedeemTx (the withdraw planner sends those to redeemAll).
  async buildWithdrawTx({ owner, amount, connection }: BuildIxParams) {
    const usdy = await readUsdyBalance(owner, connection);
    if (usdy <= BigInt(0)) throw new UserFacingError("Nothing to withdraw");
    const price = await getUsdyPriceUsd();
    if (price <= 0) throw new UserFacingError("Price unavailable — try again");

    // USDY and USDC are both 6 decimals, so value(base) = usdy(base) × price.
    const valueUsdc = BigInt(Math.round(Number(usdy) * price));
    const usdyToSwap = usdyToSwapForWithdraw(usdy, valueUsdc, amount);
    if (usdyToSwap <= BigInt(0)) throw new UserFacingError("Amount too small to withdraw");

    return buildSwapLegacy({
      owner,
      inputMint: USDY_MINT,
      outputMint: USDC_MINT,
      amount: usdyToSwap,
    });
  },

  // Full exit: swap the entire USDY balance back to USDC.
  async buildRedeemTx({ owner, connection }: RedeemTxParams) {
    const usdy = await readUsdyBalance(owner, connection);
    if (usdy <= BigInt(0)) throw new UserFacingError("Nothing to withdraw");
    return buildSwapLegacy({
      owner,
      inputMint: USDY_MINT,
      outputMint: USDC_MINT,
      amount: usdy,
    });
  },

  async getPosition(owner: PublicKey, connection: Connection): Promise<YieldPosition> {
    try {
      const usdy = await readUsdyBalance(owner, connection);
      if (usdy <= BigInt(0)) return { underlyingBalance: BigInt(0), shares: BigInt(0) };
      const price = await getUsdyPriceUsd();
      // Value the held USDY in USDC base units; shares = raw USDY (drives withdraw).
      const valueUsdc = price > 0 ? BigInt(Math.round(Number(usdy) * price)) : usdy;
      return { underlyingBalance: valueUsdc, shares: usdy };
    } catch {
      return { underlyingBalance: BigInt(0), shares: BigInt(0) };
    }
  },

  async getApy(): Promise<number> {
    return getProviderApy(DEFILLAMA_POOL);
  },
};
