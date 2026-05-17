import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — OXAR Radar",
  description:
    "Four tiers for the RWA intelligence API. Pay with card via Stripe or USDC via Helio. Free tier ships with 10k requests a month.",
};

interface Tier {
  name: string;
  priceUsd: number | "custom";
  blurb: string;
  features: string[];
  cta: { label: string; href: string };
  highlight?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Free",
    priceUsd: 0,
    blurb: "For evaluation and side projects.",
    features: [
      "60 requests / minute",
      "10,000 requests / month",
      "All public endpoints",
      "Community support",
    ],
    cta: { label: "Get a free key", href: "/dashboard" },
  },
  {
    name: "Starter",
    priceUsd: 99,
    blurb: "For solo builders and small dapps.",
    features: [
      "600 requests / minute",
      "100,000 requests / month",
      "Historical snapshots (Phase 2.2)",
      "Email support",
    ],
    cta: { label: "Subscribe", href: "/dashboard?plan=starter" },
  },
  {
    name: "Pro",
    priceUsd: 499,
    blurb: "For DAO treasuries and small funds.",
    features: [
      "6,000 requests / minute",
      "1,000,000 requests / month",
      "WebSocket streams (Phase 2 roadmap)",
      "Priority support",
    ],
    cta: { label: "Subscribe", href: "/dashboard?plan=pro" },
    highlight: true,
  },
  {
    name: "Enterprise",
    priceUsd: "custom",
    blurb: "For institutional desks.",
    features: [
      "Custom rate + monthly limits",
      "SLA, white-label, on-prem",
      "Dedicated Slack channel",
      "Custom data feeds",
    ],
    cta: { label: "Talk to us", href: "mailto:hello@oxar.app?subject=OXAR%20Radar%20Enterprise" },
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
        OXAR Radar · Pricing
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Pay with card or USDC.
      </h1>
      <p className="mt-3 max-w-2xl text-[var(--color-text-muted)]">
        Every plan unlocks the same API. Pay monthly with a credit card via Stripe,
        or natively in USDC via Helio Pay — useful for DAO treasuries that don't
        want to off-ramp into fiat.
      </p>

      <div className="mt-12 grid gap-4 lg:grid-cols-4">
        {TIERS.map((tier) => (
          <TierCard key={tier.name} tier={tier} />
        ))}
      </div>

      <section className="mt-16">
        <h2 className="text-xl font-semibold tracking-tight">FAQ</h2>
        <div className="mt-4 space-y-4 text-sm text-[var(--color-text-muted)]">
          <Faq q="How does USDC payment work?">
            Helio Pay handles recurring USDC subscriptions on Solana. The first
            payment confirms in seconds; renewals are signed once and auto-pulled
            monthly from the wallet you authorise. Fees: ~1%.
          </Faq>
          <Faq q="Can I cancel anytime?">
            Yes. Subscriptions are month-to-month. Cancel in your dashboard or
            email us. No clawbacks on the current period.
          </Faq>
          <Faq q="Is this investment advice?">
            No. OXAR Radar provides analytics, risk metrics, and educational
            commentary. Nothing here is personalised investment advice or an
            offer to buy or sell securities.
          </Faq>
        </div>
      </section>
    </main>
  );
}

function TierCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={`flex flex-col rounded-lg border p-6 ${
        tier.highlight
          ? "border-[var(--color-accent)] bg-[var(--color-surface-1)]"
          : "border-white/10 bg-[var(--color-surface-1)]"
      }`}
    >
      <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">
        {tier.name}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">
        {tier.priceUsd === "custom" ? "Custom" : tier.priceUsd === 0 ? "$0" : `$${tier.priceUsd}`}
        {typeof tier.priceUsd === "number" && tier.priceUsd > 0 && (
          <span className="text-base font-normal text-[var(--color-text-muted)]"> / mo</span>
        )}
      </div>
      <p className="mt-3 text-sm text-[var(--color-text-muted)]">{tier.blurb}</p>
      <ul className="mt-6 flex-1 space-y-2 text-sm">
        {tier.features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-[var(--color-accent)]">·</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={tier.cta.href}
        className={`mt-6 rounded-lg px-4 py-2.5 text-center text-sm font-medium ${
          tier.highlight
            ? "bg-[var(--color-accent)] text-black hover:opacity-90"
            : "border border-white/10 hover:bg-white/5"
        }`}
      >
        {tier.cta.label}
      </Link>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-medium text-white">{q}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
