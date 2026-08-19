"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { formatUsdAmount } from "@oxar/sdk";

import type { BulkTradeOutcome, BulkTradeState } from "@/hooks/use-bulk-trade";
import { AssetIcon } from "@/components/asset-icon";
import { SwipeToConfirm } from "@/components/swipe-to-confirm";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";
import { useT } from "@/lib/i18n";

interface Props {
  /** The picked positions, for the stacked icons — a set you can see. */
  picked: { id: string; symbol: string }[];
  selectedCount: number;
  /** What the picked things are worth to you today. 0 when you hold none of them. */
  heldUsd: number;
  state: BulkTradeState;
  done: readonly BulkTradeOutcome[];
  /** The words for this basket — "buy"/"sell" for a share, "deposit"/"withdraw" for
   *  a lending market, something neutral when it holds both. Already translated. */
  verbs: { buy: string; sell: string };
  /** Off when nothing picked is actually held — there is nothing to sell. */
  canSell: boolean;
  /** Which of the two is the filled button — the likelier errand on this screen. */
  primary?: "buy" | "sell";
  progress?: string | null;
  onBuy: () => void;
  /** Sell every picked position, whole. The bar's own confirm. */
  onSellAll: () => void;
  /** Sell some of each — opens the sheet that asks how much. */
  onSellAmounts: () => void;
  onClear: () => void;
}

/**
 * The bar that appears once things are picked, and it offers BOTH directions.
 *
 * It used to offer one: the market could only buy, the portfolio could only sell. So
 * wanting more of something you already hold meant leaving the page you were holding
 * it on. A basket is a set of things you have opinions about; which way the money
 * goes is the last decision, not the first.
 *
 * Pressing a direction doesn't do it — it arms it. Selling then finishes on the bar
 * itself, held down, because "sell everything picked" needs no further questions and
 * asking them in a sheet was a screen in the way. Buying opens the sheet, because
 * "how much" has no obvious answer.
 */
export function PickBar({
  picked,
  selectedCount,
  heldUsd,
  state,
  done,
  verbs,
  canSell,
  primary = "buy",
  progress,
  onBuy,
  onSellAll,
  onSellAmounts,
  onClear,
}: Props) {
  const { t } = useT();
  // Which direction is being confirmed. Null = the basket is just sitting there.
  const [arming, setArming] = useState<"sell" | null>(null);

  // Emptying the basket un-arms it: the thing the confirm referred to is gone. Read,
  // not stored — the set changing is not an event this has to react to.
  const armed = arming === "sell" && canSell && selectedCount > 0;

  const failed = done.filter((d) => !d.ok);
  // The bar exists to hold a selection or to report on one. After a run where
  // everything went through, it has neither — the set is cleared and there is
  // nothing left to say, so it should leave rather than sit there reading
  // "0 in multi".
  if (selectedCount === 0 && failed.length === 0) return null;
  // Stopping is not failing: it gets a plain line, not a red one.
  const cancelled = failed.some((f) => f.cancelled);
  const realFailures = failed.filter((f) => !f.cancelled);
  const busy = state === "running";

  return (
    // Above the tab bar, INCLUDING the home indicator it sits on. The tab bar is
    // 4rem of content plus `env(safe-area-inset-bottom)`, so a fixed 6rem cleared it
    // on a laptop and landed exactly on it on a phone — which is where this lives.
    // Written as one expression so both get the same 2rem of air.
    <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-fit max-w-[calc(100vw-1.5rem)] -translate-x-1/2">
    {/* One row, always. It used to wrap on a phone, which turns a pill into a blob
        and stacked the icons on top of each other. Nothing here may grow the bar:
        the label truncates, the icons stand down on narrow screens. */}
    <div className="flex flex-nowrap items-center gap-2 rounded-full border border-ink/10 bg-paper/95 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.10)] backdrop-blur sm:gap-3">
      {armed ? (
        <>
          <button
            type="button"
            onClick={() => setArming(null)}
            disabled={busy}
            aria-label={t("fund.back")}
            className="shrink-0 text-ink/40 transition hover:text-ink disabled:opacity-40"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
          {/* The whole width, because this is the one thing left to do. */}
          <div className="min-w-[180px] flex-1 sm:min-w-[240px]">
            <SwipeToConfirm
              size="bar"
              label={t("bulk.actionUsd", { verb: verbs.sell, usd: `$${formatUsdAmount(heldUsd)}` })}
              busyLabel={progress ?? undefined}
              busy={busy}
              onConfirm={onSellAll}
            />
          </div>
          <button
            type="button"
            onClick={onSellAmounts}
            disabled={busy}
            className="shrink-0 text-[12px] lowercase tracking-wide text-ink/45 underline decoration-dotted underline-offset-2 transition hover:text-ink disabled:opacity-40"
          >
            {t("bulk.amounts")}
          </button>
        </>
      ) : (
        <>
          {/* The set, shown as itself: overlapping marks rather than a count alone. */}
          {picked.length > 0 && (
            <span className="hidden shrink-0 items-center pl-1 sm:flex">
              {picked.slice(0, 4).map((p, i) => (
                // Inline spans align on the TEXT BASELINE, so a picture icon and a
                // letter-fallback icon sat at different heights. A fixed box each,
                // centred, makes them line up whatever they contain.
                <span
                  key={p.id}
                  className={`flex h-[22px] w-[22px] items-center justify-center ${i === 0 ? "" : "-ml-2"}`}
                >
                  <AssetIcon src={assetLogoSrc(p.id)} label={assetIconLabel(p.id, p.symbol)} size={22} />
                </span>
              ))}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-[13px] tabular-nums text-ink/70">
            {busy && progress
              ? progress
              : heldUsd > 0.005
                ? t("bulk.setLabel", { n: String(selectedCount), usd: `$${formatUsdAmount(heldUsd)}` })
                : t("bulk.setLabelBuy", { n: String(selectedCount) })}
          </span>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              disabled={busy}
              className="text-[12px] lowercase tracking-wide text-ink/45 transition hover:text-ink disabled:opacity-40"
            >
              {t("bulk.clear")}
            </button>
            {canSell && (
              <Action
                label={verbs.sell}
                filled={primary === "sell"}
                busy={busy && primary === "sell"}
                disabled={busy || selectedCount === 0}
                onClick={() => setArming("sell")}
              />
            )}
            <Action
              label={verbs.buy}
              filled={primary === "buy"}
              busy={busy && primary === "buy"}
              disabled={busy || selectedCount === 0}
              onClick={onBuy}
            />
          </div>
        </>
      )}
    </div>

    {/* Outside the pill: a message inside a rounded-full container stretched it into
        a blob. Naming what didn't go through, and why — "some failed" can't be acted on. */}
    {state === "done" && (cancelled || realFailures.length > 0) && (
      <p className={`mt-2 px-4 text-center text-[12px] ${realFailures.length ? "text-loss" : "text-ink/50"}`}>
        {realFailures.length > 0
          ? realFailures.map((f) => `${f.id}${f.error ? ` — ${f.error}` : ""}`).join(" · ")
          : t("bulk.stopped")}
      </p>
    )}
    </div>
  );
}

/** One of the two directions. The same button either way; one of them is filled. */
function Action({
  label,
  filled,
  busy,
  disabled,
  onClick,
}: {
  label: string;
  filled: boolean;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-full py-2 text-[13px] lowercase tracking-wide transition disabled:opacity-40 ${
        filled
          ? "bg-ink px-4 text-paper hover:bg-ink/85"
          : "border border-ink/15 px-3.5 text-ink/70 hover:border-ink/40 hover:text-ink"
      }`}
    >
      {busy && <Loader2 size={13} className="animate-spin" />}
      {label}
    </button>
  );
}
