import Link from "next/link";

interface Tier {
  name: string;
  price: string;
  unit?: string;
  feature: string;
  rpm: string;
  highlight?: boolean;
}

const TIERS: readonly Tier[] = [
  { name: "Free", price: "$0", feature: "Eval + side projects", rpm: "60 / min" },
  { name: "Starter", price: "$99", unit: "USDC / mo", feature: "Solo builders, small dapps", rpm: "600 / min" },
  { name: "Pro", price: "$499", unit: "USDC / mo", feature: "DAO treasuries, small funds", rpm: "6k / min", highlight: true },
  { name: "Enterprise", price: "Custom", feature: "Institutional desks", rpm: "Unlimited" },
];

export function PricingTeaser() {
  return (
    <section className="bg-[var(--color-surface-1)] px-6 py-20 lg:px-12 lg:py-28">
      <div className="flex items-baseline gap-4 border-t border-[var(--color-line)] pt-4">
        <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-dim)]">
          05 /
        </span>
        <span className="eyebrow">Pricing</span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <h2 className="max-w-3xl font-display text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] tracking-tight">
          Pay in USDC. Settle in seconds.{" "}
          <span className="text-[var(--color-text-muted)]">
            No bank, no off-ramp, no fiat-only gatekeeping.
          </span>
        </h2>
        <span className="inline-flex items-center gap-2 self-start rounded-md border border-[var(--color-accent-edge)] bg-[var(--color-accent-soft)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--color-accent)] lg:self-end">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
          Helio Pay · USDC subscriptions
        </span>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`relative flex flex-col rounded-lg border p-6 ${
              tier.highlight
                ? "border-[var(--color-accent-edge)] bg-[var(--color-surface-2)]"
                : "border-[var(--color-line-strong)] bg-[var(--color-surface-2)]"
            }`}
          >
            {tier.highlight && (
              <span className="absolute -top-2.5 right-4 rounded bg-[var(--color-accent)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-black">
                Recommended
              </span>
            )}
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
              {tier.name}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl">{tier.price}</span>
              {tier.unit && <span className="text-xs text-[var(--color-text-muted)]">{tier.unit}</span>}
            </div>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">{tier.feature}</p>
            <div className="mt-auto pt-6 font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">
              {tier.rpm}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] hover:text-white"
        >
          See full pricing →
        </Link>
      </div>
    </section>
  );
}
