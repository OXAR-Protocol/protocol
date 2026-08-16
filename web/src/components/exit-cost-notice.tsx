"use client";

import { formatUsdAmount } from "@oxar/sdk";

import { useExitCost } from "@/hooks/use-exit-cost";
import { usePlatformFeeBps } from "@/hooks/use-platform-fee";
import { useT } from "@/lib/i18n";

interface Props {
  heldMint?: string;
  heldDecimals?: number;
  usdAmount: number;
  /** USD per unit — the same reference price the buy panel already shows
   *  (e.g. `sharePriceUsd`). Passing it in keeps this from adding a second
   *  price feed. */
  priceUsd?: number;
}

/**
 * One quiet line under the buy amount, for price-exposure assets only: what
 * leaving would cost right now, quoted live rather than assumed. Not a warning
 * that blocks anything — `marketLooksBroken` still catches a genuinely broken
 * route elsewhere. Nearly all of the cost belongs to the market: we don't set the
 * price. While we charge nothing the copy says so outright; once we do, the same
 * sentence would be crediting the market with a cut that is ours, so it changes.
 */
export function ExitCostNotice({ heldMint, heldDecimals, usdAmount, priceUsd }: Props) {
  const { t } = useT();
  const feeBps = usePlatformFeeBps();
  const exit = useExitCost({
    mint: heldMint,
    decimals: heldDecimals,
    usdAmount,
    priceUsd,
    enabled: !!heldMint && !!heldDecimals && !!priceUsd && usdAmount > 0,
  });

  if (!heldMint || !priceUsd || usdAmount <= 0) return null;
  if (exit.fraction === null && !exit.unavailable) return null; // nothing to say yet

  const warn = exit.unavailable || exit.band === "expensive";
  return (
    <p className={`mt-1 text-[11px] lowercase tracking-wide ${warn ? "text-[#a35b00]" : "text-ink/45"}`}>
      {exit.unavailable
        ? exit.ceilingUsd !== null
          ? t("rail.exitCostCeiling", { usd: `$${formatUsdAmount(exit.ceilingUsd, 0)}` })
          : t("rail.exitCostUnavailable")
        : t(feeBps > 0 ? "rail.exitCostNowFee" : "rail.exitCostNow", {
            pct: ((exit.fraction ?? 0) * 100).toFixed(1),
            fee: (feeBps / 100).toFixed(2),
          })}
    </p>
  );
}
