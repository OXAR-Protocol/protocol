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

    const usd = Math.abs(usdcDelta) >= DUST ? round2(Math.abs(usdcDelta)) : null;

    let kind: ActivityKind;
    let label: string;

    if (primaryMint) {
      const name = assetNames[primaryMint];
      if (primaryVal > 0) {
        kind = usdcDelta < -DUST ? "buy" : "receive";
        label = `${kind === "buy" ? "Bought" : "Received"} ${name}`;
      } else {
        kind = usdcDelta > DUST ? "sell" : "send";
        label = `${kind === "sell" ? "Sold" : "Sent"} ${name}`;
      }
    } else if (usdcDelta < -DUST) {
      kind = receivedOther ? "deposit" : "send";
      label = receivedOther ? "Deposited" : "Sent USDC";
    } else if (usdcDelta > DUST) {
      kind = sentOther ? "withdraw" : "receive";
      label = sentOther ? "Withdrew" : "Received USDC";
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
      ...(units && usd ? { unitPriceUsd: usd / units } : {}),
    });
  }

  return events;
}
