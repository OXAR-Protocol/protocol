import Link from "next/link";

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
    a: "Yes. /api/v1/protocols/:slug/history returns time-series snapshots since the indexer started. Range parameter accepts 7d / 30d / 90d.",
  },
  {
    q: "Do you support custom integrations or white-label?",
    a: "Yes, on Enterprise. We can ship custom data feeds, branded dashboards, or on-prem deployments. Email hello@oxar.app.",
  },
  {
    q: "Why USDC payments?",
    a: "Our customers are DAO treasuries and crypto funds — they hold USDC, not bank accounts. Helio Pay handles recurring USDC subscriptions on Solana; first payment in seconds, ~1% fees.",
  },
];

export function FaqFooter() {
  return (
    <>
      <section className="px-6 py-20 lg:px-12 lg:py-28">
        <div className="flex items-baseline gap-4 border-t border-[var(--color-line)] pt-4">
          <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-dim)]">
            07 /
          </span>
          <span className="eyebrow">Questions</span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] tracking-tight">
            Frequently asked.
          </h2>

          <div className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                  <span className="text-base font-medium text-white">{item.q}</span>
                  <span className="font-mono text-lg text-[var(--color-text-muted)] transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--color-line)] bg-[var(--color-surface-1)] px-6 py-12 lg:px-12">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1">
            <div className="font-display text-xl">Radar</div>
            <p className="mt-2 max-w-xs text-sm text-[var(--color-text-muted)]">
              RWA intelligence layer. Built by{" "}
              <a
                href="https://oxar.app"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[var(--color-accent)]"
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
              { href: "mailto:hello@oxar.app", label: "Contact" },
              { href: "https://oxar.app/terms", label: "Terms", external: true },
            ]}
            note="Not investment advice. Educational analytics only."
          />
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-[var(--color-line)] pt-6 text-xs text-[var(--color-text-dim)] sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} OXAR · Radar v0.1</span>
          <span className="font-mono uppercase tracking-widest">
            Built with Solana + Ethereum
          </span>
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
      <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-dim)]">
        {title}
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.href}>
            {item.external ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-text-muted)] hover:text-white"
              >
                {item.label}
              </a>
            ) : (
              <Link href={item.href} className="text-[var(--color-text-muted)] hover:text-white">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
      {note && <p className="mt-4 text-xs text-[var(--color-text-dim)]">{note}</p>}
    </div>
  );
}
