"use client";

import Link from "next/link";

import { AnimatedSection } from "@/components/animated-section";
import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";

interface Faq {
  q: string;
  a: string;
}

const FAQ: readonly Faq[] = [
  {
    q: "How fresh is the data?",
    a: "Every protocol gets a fresh snapshot every 5 minutes via Vercel Cron. On-chain reads (totalSupply, holders) are not cached past their TTL. Wallet analyses are computed on demand and cached for 5 minutes per address.",
  },
  {
    q: "What's the free tier limit?",
    a: "60 requests/minute, 10,000 requests/month, AI explanations excluded. Enough to build and ship a hobby integration. No credit card or wallet required to mint a key.",
  },
  {
    q: "Can I get historical NAV time series?",
    a: "Not yet. The indexer already keeps every 5-minute snapshot in Postgres, but the historical read endpoint is on the roadmap. Today the API returns only the latest snapshot inline with /protocols/:slug.",
  },
  {
    q: "Do you support custom integrations or white-label?",
    a: "Yes, on Enterprise. We can ship custom data feeds, branded dashboards, or on-prem deployments. Email support@oxar.app.",
  },
  {
    q: "When are paid tiers coming?",
    a: "Not yet. Radar is free during the public preview while we add more chains and per-protocol fetchers. When paid tiers ship we'll honour existing free keys for at least 30 days so nothing breaks overnight.",
  },
];

export function FaqFooter() {
  return (
    <>
      <section className="relative py-20 px-6">
        <div className="mx-auto max-w-[1200px]">
          <AnimatedSection>
            <SectionLabel>Questions</SectionLabel>
            <div className="mt-4">
              <SectionTitle>Frequently asked.</SectionTitle>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                    <span className="font-sans text-base text-white">{item.q}</span>
                    <span className="font-mono text-lg text-white/30 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-2xl font-mono text-sm leading-relaxed text-white/50">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-surface-1 px-6 py-12">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
            <div className="col-span-2 lg:col-span-1">
              <div className="font-mono text-sm uppercase tracking-[0.15em] text-white">
                RADAR
              </div>
              <p className="mt-3 max-w-xs font-mono text-sm text-white/50">
                RWA intelligence layer. Built by{" "}
                <a
                  href="https://oxar.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline-offset-2 hover:underline"
                >
                  OXAR Protocol
                </a>
                .
              </p>
            </div>
            <FooterCol
              title="Product"
              items={[
                { href: "/analyze", label: "Analyzer" },
                { href: "/docs", label: "API docs" },
                { href: "/pricing", label: "Pricing" },
                { href: "/dashboard", label: "Dashboard" },
              ]}
            />
            <FooterCol
              title="Reference"
              items={[
                { href: "/api/openapi", label: "OpenAPI spec" },
                { href: "https://oxar.app", label: "OXAR Protocol ↗", external: true },
              ]}
            />
            <FooterCol
              title="Legal"
              items={[
                { href: "mailto:support@oxar.app", label: "Contact" },
                { href: "https://oxar.app/terms", label: "Terms", external: true },
              ]}
              note="Not investment advice. Educational analytics only."
            />
          </div>
          <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 font-mono text-xs uppercase tracking-[0.15em] text-white/30 sm:flex-row sm:justify-between">
            <span>© {new Date().getFullYear()} OXAR · Radar v0.1</span>
            <span>Built with Solana + Ethereum</span>
          </div>
        </div>
      </footer>
    </>
  );
}

interface FooterColProps {
  title: string;
  items: readonly { href: string; label: string; external?: boolean }[];
  note?: string;
}

function FooterCol({ title, items, note }: FooterColProps) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
        {title}
      </div>
      <ul className="mt-3 space-y-2 font-mono text-sm">
        {items.map((item) => (
          <li key={item.href}>
            {item.external ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white"
              >
                {item.label}
              </a>
            ) : (
              <Link href={item.href} className="text-white/50 hover:text-white">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
      {note && <p className="mt-4 font-mono text-xs text-white/30">{note}</p>}
    </div>
  );
}
