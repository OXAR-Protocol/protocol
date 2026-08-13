"use client";

import { useT } from "@/lib/i18n";

/**
 * How much to put on the card before the provider takes over.
 *
 * The deposit panel could skip this — it already knew the amount, because there it
 * doubles as "how much of this asset". Funding on its own has no such number, and
 * sending someone into a payment widget with a blank field is where they stop.
 */
export function FundCardAmount({
  value,
  min,
  onChange,
  onContinue,
}: {
  value: string;
  min: number;
  onChange: (v: string) => void;
  onContinue: () => void;
}) {
  const { t } = useT();
  const usd = Number(value);
  const belowMin = !Number.isFinite(usd) || usd < min;

  return (
    <div>
      <label className="block text-[11px] lowercase tracking-wide text-black/40">
        {t("fund.card.amount")}
      </label>
      <div className="mt-2 flex items-center gap-2 rounded-[10px] border border-black/15 px-4 py-3">
        <span className="text-[18px] text-black/35">$</span>
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
          className="w-full bg-transparent text-[18px] tabular-nums text-black outline-none"
        />
      </div>

      <div className="mt-3 flex gap-2">
        {[50, 100, 250].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(String(preset))}
            className="rounded-full border border-black/15 px-3 py-1.5 text-[12px] tabular-nums text-black/60 transition hover:border-black/40 hover:text-black"
          >
            ${preset}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={belowMin}
        className="mt-5 w-full rounded-full bg-black px-4 py-3 text-[14px] lowercase tracking-wide text-white transition hover:bg-black/85 disabled:opacity-40"
      >
        {t("fund.card.continue")}
      </button>
      {belowMin && (
        <p className="mt-2 text-center text-[12px] text-black/45">
          {t("fund.card.min", { min: String(min) })}
        </p>
      )}
    </div>
  );
}
