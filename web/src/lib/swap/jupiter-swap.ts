/**
 * Jupiter swap (in-Solana) for the deposit router: quote an exact-in swap of any
 * SPL/SOL into USDC, then build the swap transaction. The wallet signs+sends it;
 * the router then deposits the realized USDC.
 *
 * `asLegacy`: build a LEGACY (non-versioned) transaction. External wallets
 * (Phantom/Trust, esp. mobile) mishandle Jupiter's default v0 tx and broadcast
 * malformed bytes ("failed to deserialize VersionedTransaction"); legacy txs are
 * universally signable. The embedded wallet keeps v0 (better routing, no size cap).
 */
import { Transaction, VersionedTransaction } from "@solana/web3.js";

import { fetchWithRetry } from "@/lib/net/fetch-retry";

const QUOTE_URL = "https://lite-api.jup.ag/swap/v1/quote";
const SWAP_URL = "https://lite-api.jup.ag/swap/v1/swap";

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  /** Min out after slippage — guaranteed available, so deposit this (leaves dust). */
  otherAmountThreshold: string;
  priceImpactPct: string;
  slippageBps: number;
  swapMode: string;
}

/** Net output in UI units (e.g. USDC received) from a quote. */
export function swapNetOut(quote: SwapQuote, outDecimals: number): number {
  return Number(quote.outAmount) / 10 ** outDecimals;
}

/** Price impact as a fraction (0.01 = 1%). */
export function swapPriceImpact(quote: SwapQuote): number {
  const pct = Number(quote.priceImpactPct);
  return Number.isFinite(pct) ? pct : 0;
}

/** True if the swap's price impact exceeds the cap (default 1.5%). */
export function priceImpactTooHigh(quote: SwapQuote, maxFraction = 0.015): boolean {
  return swapPriceImpact(quote) > maxFraction;
}

/** Quote an exact-in swap `inputMint → outputMint` for `amount` (base units). */
export async function getSwapQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: bigint;
  slippageBps?: number;
  /** Constrain the route so it fits a legacy transaction (for external wallets). */
  asLegacy?: boolean;
}): Promise<SwapQuote> {
  const { inputMint, outputMint, amount, slippageBps = 50, asLegacy = false } = params;
  let url = `${QUOTE_URL}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount.toString()}&slippageBps=${slippageBps}`;
  if (asLegacy) url += "&asLegacyTransaction=true";
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Swap quote failed (${res.status})`);
  return (await res.json()) as SwapQuote;
}

/** Build the swap transaction (base64) for a quote + owner. v0 by default; legacy when asked. */
export async function buildSwapTx(
  quote: SwapQuote,
  ownerBase58: string,
  opts?: { asLegacy?: boolean },
): Promise<string> {
  const body: Record<string, unknown> = {
    quoteResponse: quote,
    userPublicKey: ownerBase58,
    dynamicComputeUnitLimit: true,
    dynamicSlippage: false,
  };
  if (opts?.asLegacy) body.asLegacyTransaction = true;
  const res = await fetchWithRetry(SWAP_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Swap build failed (${res.status})`);
  const json = (await res.json()) as { swapTransaction?: string };
  if (!json.swapTransaction) throw new Error("Swap build returned no transaction");
  return json.swapTransaction;
}

/** Deserialize Jupiter's base64 swap tx — legacy `Transaction` or v0 `VersionedTransaction`. */
export function deserializeSwapTx(b64: string, asLegacy: boolean): Transaction | VersionedTransaction {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return asLegacy ? Transaction.from(bytes) : VersionedTransaction.deserialize(bytes);
}
