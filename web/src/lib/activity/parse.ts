import type { EnhancedTx } from "@/lib/helius/history";

/**
 * Recent activity, derived from the wallet's on-chain history (Helius enhanced
 * transactions) — true to the chain, survives device changes, no self-tracking.
 *
 * We classify each transaction by the owner's net token movement:
 *   - a known held asset moved → Bought / Sold (or Received / Sent if no USDC leg)
 *   - only USDC moved → Deposited / Withdrew (a lending vault receipt token moved
 *     the other way) or Received / Sent USDC (bridge arrival / plain transfer)
 * `usd` is |the USDC delta| (USDC ≈ $1). Transactions that touch neither USDC nor
 * a known asset are dropped as noise.
 */
export type ActivityKind = "buy" | "sell" | "deposit" | "withdraw" | "receive" | "send";

export interface ActivityEvent {
  signature: string;
  /** Unix seconds. */
  timestamp: number;
  kind: ActivityKind;
  label: string;
  /** USD moved (|USDC delta|), or null when there was no USDC leg. */
  usd: number | null;
  /** Held asset this row is about, when one moved — lets a view show only its own. */
  mint?: string;
  /** How many units of that asset moved (always positive; `kind` carries direction).
   *  "Bought $50" doesn't tell you what you own — "0.0076 AVGOx" does. */
  units?: number;
  /** USD paid or received per unit. Absent when there was no USDC leg to divide. */
  unitPriceUsd?: number;
}

const DUST = 0.005; // ignore sub-cent USDC deltas (fees / rounding)

/**
 * A per-unit price is only worth printing if the unit count is precise enough to
 * carry one. Token amounts are quantised at 10^-decimals, so a trade of 63 base
 * units of a 6-decimal token knows its own size to ±0.8% — on gold that is ±$32 an
 * ounce, and a buy and a sell straddling it look ~$65 apart for no reason. Above
 * this error we print no price rather than a confident wrong one.
 */
const MAX_UNIT_PRICE_ERROR = 0.005;

/** Can `units` of a token with `decimals` support quoting a price per unit? */
export function unitPriceIsMeaningful(units: number, decimals?: number): boolean {
  if (units <= 0) return false;
  if (decimals === undefined) return true; // nothing to judge with — unchanged
  return 10 ** -decimals / 2 / units <= MAX_UNIT_PRICE_ERROR;
}
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Parse `owner`'s enhanced transactions into a recent-activity feed (newest first,
 * preserving input order). `assetNames` maps a held mint → display name; `usdcMint`
 * is the cost/settlement token.
 */
export function parseActivity(
  txs: EnhancedTx[],
  owner: string,
  usdcMint: string,
  assetNames: Record<string, string>,
  /** Held mint → token decimals. Used only to decide whether a per-unit price can
   *  be quoted at all; omit and one is always quoted (the previous behaviour). */
  assetDecimals: Record<string, number> = {},
  /** Held mint → whether it's something you BUY (a stock, gold) or somewhere you
   *  PUT money (a savings source). Without it every entry reads as a purchase, and
   *  a Jupiter Lend deposit says "Bought Jupiter Lend USDC" — which isn't a thing. */
  assetIsPrice: Record<string, boolean> = {},
): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const tx of txs) {
    let usdcDelta = 0;
    const assetDelta: Record<string, number> = {};
    let sentOther = false; // owner sent a non-USDC, non-known token (e.g. vault receipt)
    let receivedOther = false;

    for (const t of tx.tokenTransfers ?? []) {
      if (!t.mint || typeof t.tokenAmount !== "number") continue;
      const sign = t.toUserAccount === owner ? 1 : t.fromUserAccount === owner ? -1 : 0;
      if (sign === 0) continue;
      if (t.mint === usdcMint) {
        usdcDelta += sign * t.tokenAmount;
      } else if (assetNames[t.mint]) {
        assetDelta[t.mint] = (assetDelta[t.mint] ?? 0) + sign * t.tokenAmount;
      } else if (sign > 0) {
        receivedOther = true;
      } else {
        sentOther = true;
      }
    }

    // The known held asset with the largest absolute movement drives the label.
    let primaryMint: string | null = null;
    let primaryVal = 0;
    for (const [mint, delta] of Object.entries(assetDelta)) {
      if (Math.abs(delta) > Math.abs(primaryVal)) {
        primaryVal = delta;
        primaryMint = mint;
      }
    }

    // Rounded for display. The per-unit price below divides the RAW figure instead:
    // on a small trade, cents are a large share of the total, and dividing a
    // cent-rounded amount by a tiny unit count turns that rounding into hundreds of
    // dollars per ounce. A $0.25 buy and a $0.25 sell of gold came out $158/oz apart
    // on rounding alone — a spread the user never paid.
    const usdRaw = Math.abs(usdcDelta) >= DUST ? Math.abs(usdcDelta) : null;
    const usd = usdRaw !== null ? round2(usdRaw) : null;

    let kind: ActivityKind;
    let label: string;

    if (primaryMint) {
      const name = assetNames[primaryMint];
      // A stock is bought and sold; a savings source is put into and taken out of.
      // Same on-chain shape, different thing to a person — and the whole point of a
      // history is that it explains itself.
      const isPrice = assetIsPrice[primaryMint] ?? true;
      if (primaryVal > 0) {
        if (usdcDelta < -DUST) {
          kind = isPrice ? "buy" : "deposit";
          label = isPrice ? `Bought ${name}` : `Deposited to ${name}`;
        } else {
          kind = "receive";
          label = `Received ${name}`;
        }
      } else {
        if (usdcDelta > DUST) {
          kind = isPrice ? "sell" : "withdraw";
          label = isPrice ? `Sold ${name}` : `Withdrew from ${name}`;
        } else {
          kind = "send";
          label = `Sent ${name}`;
        }
      }
    } else if (usdcDelta < -DUST) {
      // USDC left and something we don't recognise came back. That's a swap, not a
      // deposit — calling it "Deposited" claimed knowledge of a destination we don't
      // have.
      kind = receivedOther ? "deposit" : "send";
      label = receivedOther ? "Swapped from USDC" : "Sent USDC";
    } else if (usdcDelta > DUST) {
      // The mirror: something unrecognised left, USDC came back.
      kind = sentOther ? "withdraw" : "receive";
      label = sentOther ? "Swapped to USDC" : "USDC arrived";
    } else {
      continue; // no USDC and no known asset moved — noise
    }

    // Units and the price per unit, so history reads as a trade rather than a
    // dollar figure. Only when a known asset actually moved; the price needs a
    // USDC leg to divide by, so a plain transfer has units without one.
    const units = primaryMint ? Math.abs(primaryVal) : undefined;
    events.push({
      signature: tx.signature ?? "",
      timestamp: tx.timestamp ?? 0,
      kind,
      label,
      usd,
      ...(primaryMint ? { mint: primaryMint } : {}),
      ...(units ? { units } : {}),
      ...(units && usdRaw && unitPriceIsMeaningful(units, assetDecimals[primaryMint ?? ""])
        ? { unitPriceUsd: usdRaw / units }
        : {}),
    });
  }

  return events;
}
