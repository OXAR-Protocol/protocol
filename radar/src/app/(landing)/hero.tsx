import Link from "next/link";

import { RadarSweep } from "./radar-sweep";

const TICKER_ITEMS: readonly string[] = [
  "BUIDL · $2.1B",
  "ONDO·USDY · $720M",
  "ONDO·OUSG · $251M",
  "BACKED · $245K",
  "MAPLE · $10.6M",
  "CENTRIFUGE · indexing",
  "OXAR · DEVNET",
];

export function Hero() {
  return (
    <section className="relative">
      <div className="relative grid grid-cols-1 gap-12 px-6 pt-10 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-12 lg:pt-14 lg:pb-28">
        <div className="relative flex flex-col">
          <span className="eyebrow">OXAR · Radar — RWA Intelligence Layer</span>

          <h1 className="mt-6 font-display text-[clamp(2.5rem,6.5vw,5.5rem)] leading-[1.02] tracking-tight">
            See every RWA.
            <br />
            <span className="text-[var(--color-text-muted)]">Across every chain.</span>
            <br />
            <span className="text-[var(--color-accent)]">Before everyone else.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)] lg:text-lg">
            Wallet analysis, protocol data, and AI-powered insights for the entire Real
            World Assets market — across Solana and Ethereum, refreshed every five
            minutes, queryable in JSON.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/analyze"
              className="group inline-flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-black transition hover:bg-white"
            >
              Try the analyzer
              <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--color-line-strong)] px-5 py-3 text-sm font-medium text-white transition hover:border-[var(--color-accent-edge)] hover:text-[var(--color-accent)]"
            >
              Get API access
            </Link>
          </div>

          <div className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-[var(--color-line)] pt-6">
            <Stat label="AUM tracked" value="$3.1B" />
            <Stat label="Protocols" value="6" />
            <Stat label="Chains" value="2" />
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,217,126,0.10)_0%,transparent_70%)]" />
          <RadarSweep />
        </div>
      </div>

      {/* Live ticker tape */}
      <div className="relative overflow-hidden border-y border-[var(--color-line)] bg-[var(--color-surface-1)] py-2.5">
        <div
          className="flex w-max gap-12 font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-muted)] whitespace-nowrap"
          style={{ animation: "ticker-scroll 40s linear infinite" }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <span className="text-[var(--color-accent)]">●</span>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-2xl text-white">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
        {label}
      </div>
    </div>
  );
}
