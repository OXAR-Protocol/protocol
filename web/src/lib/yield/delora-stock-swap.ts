import type { PublicKey, VersionedTransaction } from "@solana/web3.js";

import { USDC_DECIMALS } from "@/lib/constants";
import { getCached, setCache } from "@/lib/cache";
import {
  DELORA_SOLANA_CHAIN_ID,
  buildQuoteRequest,
  deserializeSwapTx,
  quoteDeliveryRatio,
  marketLooksBroken,
  type BridgeQuote,
} from "@oxar/sdk";
import { UserFacingError } from "./errors";

/**
 * Same-chain Solana swap through Delora (adapter: DFlow) — the rail for Ondo
 * Global Markets tokenized stocks, which Jupiter does not route at all. Reuses
 * the existing `/api/bridge-quote` proxy (origin = destination = Solana is a
 * valid Delora quote); the response carries a fully-built v0 transaction the
 * wallet signs as-is.
 *
 * DFlow quotes US equities against live market-maker liquidity, so outside US
 * market hours quotes shrink or disappear (422 NO_AVAILABLE_QUOTES) — that is a
 * market state, not a bug.
 */

/**
 * USD price per RAW-decimal token for the delivery guard. Jupiter's `usdPrice`
 * is per SCALED ui token; Ondo mints carry a scaled-ui multiplier after stock
 * splits (NFLXon is already 10×), and quote amounts are raw base units — so the
 * guard needs the prescaled figure. Cached 60s; 0 if the feed is down (the
 * guard then skips rather than blocks).
 */
async function prescaledPriceUsd(mint: string): Promise<number> {
  const cacheKey = `delora-stock:${mint}:prescaled-price`;
  const cached = getCached<number>(cacheKey);
  if (cached !== null) return cached;
  try {
    const res = await fetch(`https://lite-api.jup.ag/price/v3?ids=${mint}`);
    if (!res.ok) return 0;
    const json = (await res.json()) as Record<
      string,
      { usdPrice?: number; scaledUiConfig?: { usdPricePrescaled?: number } } | undefined
    >;
    const p = json[mint];
    const price = p?.scaledUiConfig?.usdPricePrescaled ?? p?.usdPrice ?? 0;
    if (price > 0) setCache(cacheKey, price);
    return price;
  } catch {
    return 0;
  }
}

/** Build a Delora USDC↔stock swap tx (v0), guarding against a broken route. */
export async function buildDeloraStockSwapTx(params: {
  owner: PublicKey;
  inputMint: string;
  outputMint: string;
  /** Base units of `inputMint` to swap (exact-in). */
  amount: bigint;
  stockMint: string;
  stockDecimals: number;
}): Promise<VersionedTransaction> {
  // The reference price only judges the quote afterwards — fetch both together.
  const pricePromise = prescaledPriceUsd(params.stockMint);
  const res = await fetch("/api/bridge-quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      buildQuoteRequest({
        senderAddress: params.owner.toBase58(),
        originChainId: DELORA_SOLANA_CHAIN_ID,
        amount: params.amount,
        originCurrency: params.inputMint,
        receiverAddress: params.owner.toBase58(),
        destinationMint: params.outputMint,
      }),
    ),
  });
  if (!res.ok) {
    throw new UserFacingError(
      res.status === 422
        ? "No quotes for this stock right now — trading follows US market hours"
        : "Couldn't price this trade — try again",
    );
  }
  const quote = (await res.json()) as BridgeQuote;

  const buying = params.outputMint === params.stockMint;
  const price = await pricePromise;
  const ratio = quoteDeliveryRatio({
    inAmount: BigInt(quote.inputAmount),
    outAmount: BigInt(quote.outputAmount),
    inDecimals: buying ? USDC_DECIMALS : params.stockDecimals,
    outDecimals: buying ? params.stockDecimals : USDC_DECIMALS,
    inPriceUsd: buying ? 1 : price,
    outPriceUsd: buying ? price : 1,
  });
  if (marketLooksBroken(ratio)) {
    // "Broken" reads as OUR fault. On this rail it almost never is: the Ondo
    // mints have very little on-chain depth (AAPLon: ~$500, against ~$87k for the
    // xStocks Apple), and DFlow only quotes during US market hours — so a quote
    // far below the reference price means there's no market to sell into yet,
    // not that we failed. Say the thing that's actually true.
    throw new UserFacingError(
      "That quote came back far below the price — this one is thinly traded and follows US market hours",
    );
  }

  return deserializeSwapTx(quote.calldata.data, false) as VersionedTransaction;
}
