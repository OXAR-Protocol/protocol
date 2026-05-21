"use client";

import { AnimatedSection } from "@/components/animated-section";
import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";

interface Protocol {
  slug: string;
  name: string;
  chain: "eth" | "sol";
  issuer: string;
  tvl: string;
}

const PROTOCOLS: readonly Protocol[] = [
  { slug: "buidl", name: "BlackRock BUIDL", chain: "eth", issuer: "BlackRock × Securitize", tvl: "$2.1B" },
  { slug: "ondo-usdy", name: "Ondo USDY", chain: "eth", issuer: "Ondo Finance", tvl: "$720M" },
  { slug: "ondo-ousg", name: "Ondo OUSG", chain: "eth", issuer: "Ondo Finance", tvl: "$251M" },
  { slug: "maple", name: "Maple Finance", chain: "eth", issuer: "Maple", tvl: "$10.6M" },
  { slug: "centrifuge", name: "Centrifuge", chain: "eth", issuer: "Centrifuge", tvl: "indexing" },
  { slug: "backed-bib01", name: "Backed bIB01", chain: "eth", issuer: "Backed Finance", tvl: "$245K" },
  { slug: "oxar", name: "OXAR Protocol", chain: "sol", issuer: "OXAR", tvl: "devnet" },
];

const CHAINS: readonly { code: string; label: string; live: boolean }[] = [
  { code: "ETH", label: "Ethereum mainnet", live: true },
  { code: "SOL", label: "Solana mainnet", live: true },
  { code: "BASE", label: "Base", live: false },
  { code: "ARB", label: "Arbitrum", live: false },
];

export function Coverage() {
  return (
    <section className="relative py-20 px-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <AnimatedSection>
            <SectionLabel>Coverage</SectionLabel>
            <div className="mt-4">
              <SectionTitle>
                Every major issuer,
                <br />
                <span className="text-white/50">indexed every 5 minutes.</span>
              </SectionTitle>
            </div>
            <p className="mt-6 max-w-md font-mono text-base leading-relaxed text-white/50 [&>strong]:font-normal [&>strong]:text-white">
              We pull <strong>totalSupply</strong> on-chain and combine it with
              verified NAV feeds. <strong>No second-hand dashboards.</strong> No stale
              daily snapshots.
            </p>

            <div className="mt-10">
              <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
                Chains
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {CHAINS.map((c) => (
                  <span
                    key={c.code}
                    className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] ${
                      c.live
                        ? "border-accent/30 bg-accent/5 text-accent"
                        : "border-white/10 text-white/30"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        c.live ? "bg-accent" : "bg-white/30"
                      }`}
                    />
                    {c.code}
                    {!c.live && <span className="opacity-60">· soon</span>}
                  </span>
                ))}
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="overflow-hidden rounded-[5px] border border-white/10 bg-surface-0">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-white/10 bg-surface-1 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
                <span>Protocol</span>
                <span>Chain</span>
                <span>TVL</span>
              </div>
              {PROTOCOLS.map((p, i) => (
                <div
                  key={p.slug}
                  className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3 ${
                    i !== PROTOCOLS.length - 1 ? "border-b border-white/10" : ""
                  }`}
                >
                  <div>
                    <div className="text-sm text-white">{p.name}</div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
                      {p.issuer}
                    </div>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] ${
                      p.chain === "eth"
                        ? "bg-white/5 text-white/50"
                        : "bg-accent/15 text-accent"
                    }`}
                  >
                    {p.chain}
                  </span>
                  <span className="font-mono text-sm text-white">{p.tvl}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
