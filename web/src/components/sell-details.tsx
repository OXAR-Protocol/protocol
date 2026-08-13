"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { formatUsdAmount } from "@oxar/sdk";

import { useT } from "@/lib/i18n";

/**
 * What the sale actually pays out, and where the difference went.
 *
 * The headline is the only line most people need: you asked for $X, you receive
 * $Y. The breakdown underneath exists for the moment that gap looks wrong — and on
 * a thin market it will, because the spread is the market's, not a fee we charge.
 * Folded away by default: an accordion nobody opens costs one line, an always-open
 * table costs the whole screen.
 */
export function SellDetails({
  asked,
  proceeds,
  costFraction,
  quoting,
}: {
  /** What the person typed, in dollars. */
  asked: number;
  /** What the quote says they'd receive, in dollars. Null while unknown. */
  proceeds: number | null;
  /** Share of the ask that doesn't arrive — spread plus fees. */
  costFraction: number | null;
  quoting: boolean;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  if (quoting) {
    return <p className="mt-2 text-center text-[12px] text-black/40">{t("deposit.quoting")}</p>;
  }
  if (proceeds === null) return null;

  const pct = ((costFraction ?? 0) * 100).toFixed(2);
  const gap = Math.max(0, asked - proceeds);

  return (
    <div className="mt-2">
      <p className="text-center text-[12px] tabular-nums text-black/55">
        {t("rail.youReceive")}: <span className="text-black/80">${formatUsdAmount(proceeds)}</span>{" "}
        <span className="text-black/40">(−{pct}%)</span>
      </p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1.5 flex w-full items-center justify-center gap-1 text-[11px] lowercase tracking-wide text-black/40 transition hover:text-black"
      >
        {t("sell.details")}
        <ChevronDown size={12} strokeWidth={1.5} className={open ? "rotate-180 transition" : "transition"} />
      </button>

      {open && (
        <div className="mt-2 space-y-1.5 rounded-[10px] border border-black/10 p-3">
          <Line label={t("sell.detail.asked")} value={`$${formatUsdAmount(asked)}`} />
          <Line label={t("sell.detail.cost")} value={`−$${formatUsdAmount(gap)}`} />
          <Line label={t("sell.detail.impact")} value={`−${pct}%`} />
          <Line label={t("sell.detail.output")} value={`$${formatUsdAmount(proceeds)}`} strong />
          {/* Whose money this is, said once: the gap is the market's price for
              getting out now, not a cut we take. */}
          <p className="pt-1 text-[10px] leading-snug text-black/35">{t("sell.detail.note")}</p>
        </div>
      )}
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12px]">
      <span className="text-black/45">{label}</span>
      <span className={`tabular-nums ${strong ? "text-black" : "text-black/70"}`}>{value}</span>
    </div>
  );
}
