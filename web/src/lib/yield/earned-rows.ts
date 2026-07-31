import { isDustUsd } from "@oxar/sdk";

import { isCashMint, nameOfMint, sourceIdOfMint } from "./mint-names";

export interface EarnedRow {
  label: string;
  amount: number;
  /** Drives the icon — the same mark the positions list uses. Null for cash and for
   *  the catch-all row, which are not one holding. */
  sourceId: string | null;
  /** False for a position closed inside the range. It still earned or lost money
   *  while it was held, so it stays in the list and in the sum — it just says so. */
  held: boolean;
}

/**
 * One line per holding, biggest first.
 *
 * Every dollar the wallet holds collapses into a single row — "USDC −$0.00, USDG
 * −$0.01, USDT $0.00" is noise standing where an explanation should be. Anything too
 * small to print keeps its money in a catch-all row rather than being dropped, so the
 * lines still add up to the figure they are explaining.
 *
 * A holding sold inside the range stays too. It moved real money while it was held,
 * and removing it would break that sum — but it is marked, because a list that mixes
 * it in silently reads as "these are your positions", and the reply to that is
 * "I don't own half of these".
 */
export function byHolding(
  perMint: Record<string, number>,
  held: ReadonlySet<string>,
  labels: { cash: string; other: string },
): EarnedRow[] {
  const named = new Map<string, Omit<EarnedRow, "label">>();
  let unnamed = 0;

  for (const [mint, amount] of Object.entries(perMint)) {
    const cash = isCashMint(mint);
    const label = cash ? labels.cash : nameOfMint(mint);
    if (label === null) {
      unnamed += amount;
      continue;
    }
    const at = named.get(label);
    named.set(label, {
      amount: (at?.amount ?? 0) + amount,
      sourceId: at?.sourceId ?? (cash ? null : sourceIdOfMint(mint)),
      // Cash is never "closed"; a holding counts as still held if any of the mints
      // behind its row is.
      held: (at?.held ?? false) || cash || held.has(mint),
    });
  }

  const rows: EarnedRow[] = [];
  for (const [label, rest] of named) {
    if (isDustUsd(Math.abs(rest.amount))) unnamed += rest.amount;
    else rows.push({ label, ...rest });
  }
  rows.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

  if (!isDustUsd(Math.abs(unnamed))) {
    rows.push({ label: labels.other, amount: unnamed, sourceId: null, held: true });
  }
  return rows;
}
