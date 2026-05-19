"use client";

import { AnimatedSection } from "@/components/animated-section";
import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";

interface ProductCard {
  eyebrow: string;
  name: string;
  pitch: string;
  bullets: readonly string[];
  status: { label: string; tone: "live" | "preview" | "build" };
  cta: { label: string; href: string; external?: boolean };
}

const PRODUCTS: readonly ProductCard[] = [
  {
    eyebrow: "01",
    name: "OXAR Protocol",
    pitch: "Tokenised emerging-market sovereign debt on Solana.",
    bullets: [
      "USDC deposits, daily NAV accrual",
      "Built-in secondary marketplace",
      "Ukraine MVP — 6 vaults, 4–18% APY",
    ],
    status: { label: "Devnet · Q2 2026", tone: "build" },
    cta: { label: "Join the waitlist ↓", href: "#waitlist" },
  },
  {
    eyebrow: "02",
    name: "OXAR Radar",
    pitch: "RWA intelligence layer for Ethereum and Solana.",
    bullets: [
      "Live snapshots: NAV, TVL, holders",
      "Wallet-level risk analysis + AI",
      "REST API, OpenAPI spec, free preview",
    ],
    status: { label: "Live preview", tone: "preview" },
    cta: { label: "Open radar.oxar.app ↗", href: "https://radar.oxar.app", external: true },
  },
];

export function Products() {
  return (
    <section id="products" className="relative py-24 px-6">
      <div className="relative max-w-[1200px] mx-auto">
        <AnimatedSection>
          <SectionLabel>Our products</SectionLabel>
          <div className="mt-4 max-w-2xl">
            <SectionTitle>
              Two surfaces, one thesis: <br />
              <span className="text-white/50">RWA belongs on-chain.</span>
            </SectionTitle>
          </div>
        </AnimatedSection>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRODUCTS.map((p, i) => (
            <AnimatedSection key={p.name} delay={i * 0.1}>
              <ProductTile product={p} />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

const TONE_STYLES: Record<ProductCard["status"]["tone"], string> = {
  live: "border-profit/30 bg-profit/5 text-profit",
  preview: "border-accent/40 bg-accent/10 text-accent",
  build: "border-white/15 bg-white/5 text-white/70",
};

function ProductTile({ product }: { product: ProductCard }) {
  return (
    <a
      href={product.cta.href}
      target={product.cta.external ? "_blank" : undefined}
      rel={product.cta.external ? "noopener noreferrer" : undefined}
      className="group relative flex h-full flex-col gap-6 overflow-hidden rounded-[5px] border border-white/10 bg-surface-0 p-8 transition-colors hover:border-white/25"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/3 via-transparent to-transparent" />

      <div className="relative flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/30">
          {product.eyebrow} /
        </span>
        <span
          className={`inline-flex items-center gap-2 rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] ${TONE_STYLES[product.status.tone]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {product.status.label}
        </span>
      </div>

      <div className="relative">
        <h3 className="text-2xl font-sans font-normal text-white">{product.name}</h3>
        <p className="mt-2 font-mono text-sm leading-relaxed text-white/60">{product.pitch}</p>
      </div>

      <ul className="relative space-y-2">
        {product.bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-3 font-mono text-[13px] leading-relaxed text-white/70"
          >
            <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-white/30" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="relative mt-auto pt-2">
        <span className="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-wide text-white transition-colors group-hover:text-accent">
          {product.cta.label}
        </span>
      </div>
    </a>
  );
}
