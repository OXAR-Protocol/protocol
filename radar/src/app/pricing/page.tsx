import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — OXAR Radar",
  description:
    "OXAR Radar is free during the public preview. Mint a key, query the API, share what you build.",
};

const FREE_INCLUDES: readonly string[] = [
  "60 requests per minute",
  "10,000 requests per month",
  "All v1 endpoints (protocols, snapshots, wallet analyze)",
  "AI explanations via the public /analyze demo",
  "API key managed in your dashboard",
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <span className="font-mono text-xs font-semibold tracking-[0.15em] uppercase text-white/30">
        [ Pricing ]
      </span>

      <h1 className="mt-6 text-[clamp(2rem,5vw,3.5rem)] font-sans font-normal leading-tight">
        Free during preview.
        <br />
        <span className="text-white/50">No card, no wallet, no plan.</span>
      </h1>

      <p className="mt-6 max-w-xl font-mono text-base leading-relaxed text-white/55 [&>strong]:font-normal [&>strong]:text-white">
        Radar is in public preview while we add more chains and per-protocol
        fetchers. <strong>You can use everything for free.</strong> When we
        introduce paid tiers later, your data and keys come with you.
      </p>

      <div className="mt-12 rounded-[5px] border border-white/10 bg-surface-1 p-8">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
              Preview tier
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-4xl font-sans font-normal text-white">$0</span>
              <span className="font-mono text-sm text-white/50">/ everything</span>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded bg-white px-5 py-2.5 font-mono text-sm uppercase tracking-wide text-surface-0 hover:bg-white/90"
          >
            Get a key
          </Link>
        </div>

        <ul className="mt-8 space-y-3">
          {FREE_INCLUDES.map((item) => (
            <li key={item} className="flex items-start gap-3 font-mono text-sm text-white/80">
              <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-white/60" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 rounded-[5px] border border-white/10 bg-surface-0 p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
          Need more
        </div>
        <p className="mt-2 font-mono text-sm leading-relaxed text-white/70">
          Higher rate limits, white-label, SLA, on-prem, or custom data feeds —
          tell us what you need.
        </p>
        <a
          href="mailto:support@oxar.app?subject=OXAR%20Radar%20enterprise"
          className="mt-4 inline-flex items-center gap-2 font-mono text-sm uppercase tracking-wide text-white hover:underline"
        >
          support@oxar.app →
        </a>
      </div>

      <p className="mt-10 font-mono text-xs uppercase tracking-[0.15em] text-white/30">
        Not investment advice · Educational analytics
      </p>
    </main>
  );
}
