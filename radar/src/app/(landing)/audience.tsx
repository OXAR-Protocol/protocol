interface AudienceCard {
  number: string;
  title: string;
  problem: string;
  solution: string;
  accent: "green" | "cyan" | "amber";
}

const CARDS: readonly AudienceCard[] = [
  {
    number: "01",
    title: "RWA protocols",
    problem: "You read about competitor NAV moves on Twitter, hours late.",
    solution: "Monitor every issuer in real time. Set webhooks. Stop guessing.",
    accent: "green",
  },
  {
    number: "02",
    title: "DAO treasuries",
    problem: "Your stablecoin yield is split across six multisigs and zero dashboards.",
    solution: "Track every RWA position across signers in one place.",
    accent: "cyan",
  },
  {
    number: "03",
    title: "Crypto funds",
    problem: "You don't have historical NAV data to backtest yield strategies.",
    solution: "Five-minute snapshots since day one. Query as a time series.",
    accent: "amber",
  },
];

const ACCENT_COLOR: Record<AudienceCard["accent"], string> = {
  green: "var(--color-accent)",
  cyan: "var(--color-cyan)",
  amber: "var(--color-warn)",
};

export function Audience() {
  return (
    <section className="px-6 py-20 lg:px-12 lg:py-28">
      <div className="flex items-baseline gap-4 border-t border-[var(--color-line)] pt-4">
        <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-dim)]">
          03 /
        </span>
        <span className="eyebrow">Who uses Radar</span>
      </div>

      <h2 className="mt-8 max-w-2xl font-display text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] tracking-tight">
        Built for the people <span className="text-[var(--color-text-muted)]">who actually move RWA capital.</span>
      </h2>

      <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-line)] lg:grid-cols-3">
        {CARDS.map((card) => (
          <div
            key={card.number}
            className="group relative flex flex-col gap-6 bg-[var(--color-surface-1)] p-8 transition hover:bg-[var(--color-surface-2)]"
          >
            <div className="flex items-center justify-between">
              <span
                className="font-mono text-[11px] uppercase tracking-widest"
                style={{ color: ACCENT_COLOR[card.accent] }}
              >
                {card.number}
              </span>
              <span
                className="h-1.5 w-1.5 rounded-full transition group-hover:scale-150"
                style={{ background: ACCENT_COLOR[card.accent] }}
              />
            </div>

            <h3 className="font-display text-2xl tracking-tight">{card.title}</h3>

            <div className="space-y-3">
              <p className="text-sm text-[var(--color-text-muted)]">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-dim)]">
                  Pain
                </span>
                <br />
                {card.problem}
              </p>
              <p className="text-sm text-white">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-dim)]">
                  Fix
                </span>
                <br />
                {card.solution}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
