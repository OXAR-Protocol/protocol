"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const AI_RESPONSE =
  "This wallet holds $153.4k in RWA exposure: 65% in Ondo USDY (US treasuries) and 35% in Maple Finance (private credit). Weighted yield 6.12% APY. Concentration is medium; counterparty risk leans toward Maple's pool composition. Diversifying into a third issuer would reduce single-protocol risk.";

const POSITIONS: readonly { name: string; value: string; share: string; risk: "low" | "med" }[] =
  [
    { name: "Ondo USDY", value: "$99,000", share: "64.5%", risk: "low" },
    { name: "Maple Finance", value: "$54,400", share: "35.5%", risk: "med" },
  ];

export function DemoPreview() {
  const [chars, setChars] = useState(0);

  useEffect(() => {
    if (chars >= AI_RESPONSE.length) return;
    const t = setTimeout(() => setChars((c) => c + 1), 18);
    return () => clearTimeout(t);
  }, [chars]);

  return (
    <section className="px-6 pt-20 pb-16 lg:px-12 lg:pt-32 lg:pb-24">
      <SectionLabel index="02" title="Live AI analysis" />

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
        <div className="self-center">
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] tracking-tight">
            Paste a wallet. Get the answer.
          </h2>
          <p className="mt-5 max-w-md text-[var(--color-text-muted)]">
            Claude explains every RWA position in plain English. Risk score, concentration,
            counterparty exposure — without you parsing six issuer disclosures by hand.
          </p>
          <Link
            href="/analyze"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] hover:text-white"
          >
            Run on your wallet →
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface-1)] shadow-[0_30px_80px_-30px_rgba(0,217,126,0.18)]">
          <div className="flex items-center gap-2 border-b border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-3 font-mono text-[11px] text-[var(--color-text-muted)]">
              radar.oxar.app/analyze?wallet=0xdead…beef
            </span>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid grid-cols-3 gap-3">
              <Tile label="Total RWA" value="$153,400" />
              <Tile label="Weighted APY" value="6.12%" />
              <Tile label="Risk" value="6 / 10" highlight />
            </div>

            <div className="divide-y divide-[var(--color-line)] rounded-md border border-[var(--color-line)]">
              {POSITIONS.map((p) => (
                <div key={p.name} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">
                      {p.share} · risk {p.risk}
                    </div>
                  </div>
                  <div className="font-mono text-sm">{p.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                Claude Haiku · explanation
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-text-primary)]">
                {AI_RESPONSE.slice(0, chars)}
                <span
                  className="ml-0.5 inline-block h-3.5 w-[2px] -mb-[2px] bg-[var(--color-accent)]"
                  style={{ animation: "cursor-blink 0.9s steps(2) infinite" }}
                />
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Tile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-md border p-3 ${
        highlight
          ? "border-[var(--color-accent-edge)] bg-[var(--color-accent-soft)]"
          : "border-[var(--color-line)] bg-[var(--color-surface-2)]"
      }`}
    >
      <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="mt-1 font-display text-lg">{value}</div>
    </div>
  );
}

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 border-t border-[var(--color-line)] pt-4">
      <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-dim)]">
        {index} /
      </span>
      <span className="eyebrow">{title}</span>
    </div>
  );
}
