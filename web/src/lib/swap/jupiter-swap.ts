/**
 * Jupiter swap (in-Solana) for the deposit router: quote an exact-in swap of any
 * SPL/SOL into USDC, then build the swap transaction. The wallet signs+sends it
 * (the Privy adapter handles the v0 tx); the router then deposits the realized USDC.
 */

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
}): Promise<SwapQuote> {
  const { inputMint, outputMint, amount, slippageBps = 50 } = params;
  const url = `${QUOTE_URL}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount.toString()}&slippageBps=${slippageBps}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Swap quote failed (${res.status})`);
  return (await res.json()) as SwapQuote;
}

/** Build the swap transaction (base64-encoded v0) for a quote + owner. */
export async function buildSwapTx(quote: SwapQuote, ownerBase58: string): Promise<string> {
  const res = await fetch(SWAP_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: ownerBase58,
      dynamicComputeUnitLimit: true,
      dynamicSlippage: false,
    }),
  });
  if (!res.ok) throw new Error(`Swap build failed (${res.status})`);
  const json = (await res.json()) as { swapTransaction?: string };
  if (!json.swapTransaction) throw new Error("Swap build returned no transaction");
  return json.swapTransaction;
}
