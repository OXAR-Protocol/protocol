"use client";

import { Copy, Layers, Settings, Wallet } from "lucide-react";

import { HoverChart } from "@/components/hover-chart";
import { LABELS, SERIES, YOU, signedUsd, usd } from "./data";

/** Shared pieces, so the four variants differ in composition rather than in content. */

export function Chart({ bleed = true }: { bleed?: boolean }) {
  return (
    <div className={`dot-field mt-4 ${bleed ? "-mx-5 sm:mx-0" : ""}`}>
      <HoverChart
        values={SERIES}
        labels={LABELS}
        format={(v) => usd(v)}
        height={150}
        className="text-loss"
        fill
      />
    </div>
  );
}

export function Ranges({ active = "30 days" }: { active?: string }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {["7 days", "30 days", "90 days", "1 year"].map((r) => (
        <span
          key={r}
          className={`rounded-full px-2.5 py-1 text-[11px] lowercase tracking-wide ${
            r === active ? "bg-ink text-paper" : "bg-ink/[0.05] text-ink/55"
          }`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

/** The big figure, with its period change beside it. */
export function Total({ size = "clamp(34px,9vw,52px)" }: { size?: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3">
      <p
        className="font-light leading-none tracking-[-0.03em] tabular-nums text-ink"
        style={{ fontSize: size }}
      >
        {usd(YOU.total)}
      </p>
      <p className="whitespace-nowrap text-[13px] tabular-nums text-loss">
        {signedUsd(YOU.changeUsd)}
        <span className="text-ink/40"> · {YOU.range}</span>
      </p>
    </div>
  );
}

export function Gear() {
  return (
    <span className="ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink/45">
      <Settings size={17} strokeWidth={1.5} />
    </span>
  );
}

export function EarlyRiser() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand)]/30 px-2.5 py-1 text-[11px] lowercase tracking-wide text-[var(--brand)]">
      early riser
    </span>
  );
}

/** The three facts, with and without the decorative icons. */
export function Facts({ icons = true }: { icons?: boolean }) {
  const items = [
    { icon: Wallet, text: `${usd(YOU.working)} working` },
    { icon: Layers, text: `${YOU.positions} positions` },
    { icon: null, text: `here since ${YOU.since}` },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-ink/50">
      {items.map((f) => (
        <span key={f.text} className="inline-flex items-center gap-1.5">
          {icons && f.icon && <f.icon size={13} strokeWidth={1.5} className="text-ink/35" />}
          {f.text}
        </span>
      ))}
    </div>
  );
}

/** The address, as a quiet line rather than as a heading. */
export function AddressLine({ size = "13px" }: { size?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 tabular-nums text-ink/45"
      style={{ fontSize: size }}
    >
      {YOU.short}
      <Copy size={12} strokeWidth={1.5} className="text-ink/30" />
    </span>
  );
}

/** earned / put in / took out / trades. `flat` drops the equal-weight grid. */
export function Figures({ flat = false }: { flat?: boolean }) {
  if (flat) {
    return (
      <div className="mt-8 border-t border-ink/10">
        {[
          ["earned · 30 days", signedUsd(YOU.changeUsd), `${YOU.changePct}% · cost to trade ${usd(YOU.tradeCost)}`],
          ["put in", usd(YOU.putIn), null],
          ["took out", usd(YOU.tookOut), null],
          ["trades", String(YOU.trades), `on ${YOU.tradeDays} days`],
        ].map(([label, value, note]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 border-b border-ink/10 py-3">
            <span className="text-[12px] lowercase tracking-wide text-ink/45">{label}</span>
            <span className="text-right">
              <span className="text-[15px] tabular-nums text-ink">{value}</span>
              {note && <span className="ml-2 text-[11px] tabular-nums text-ink/35">{note}</span>}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6">
      <Figure label="earned · 30 days" value={signedUsd(YOU.changeUsd)} note={`${YOU.changePct}%`} loss />
      <Figure label="put in" value={usd(YOU.putIn)} />
      <Figure label="took out" value={usd(YOU.tookOut)} />
      <Figure label="trades" value={String(YOU.trades)} note={`on ${YOU.tradeDays} days`} />
    </div>
  );
}

function Figure({ label, value, note, loss }: { label: string; value: string; note?: string; loss?: boolean }) {
  return (
    <div>
      <p className="text-[12px] lowercase tracking-wide text-ink/45">{label}</p>
      <p className={`mt-1 text-[22px] tabular-nums ${loss ? "text-loss" : "text-ink"}`}>{value}</p>
      {note && <p className="text-[11px] tabular-nums text-ink/35">{note}</p>}
    </div>
  );
}
