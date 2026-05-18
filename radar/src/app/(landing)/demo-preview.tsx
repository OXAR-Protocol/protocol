"use client";

import { useEffect, useState } from "react";

import { AnimatedSection } from "@/components/animated-section";
import { Button } from "@/components/button";
import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";

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
    <section className="relative py-20 px-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <AnimatedSection className="self-center">
            <SectionLabel>Live AI Analysis</SectionLabel>
            <div className="mt-4">
              <SectionTitle>
                Paste a wallet.
                <br />
                <span className="text-white/50">Get the answer.</span>
              </SectionTitle>
            </div>
            <p className="mt-6 max-w-md font-mono text-base leading-relaxed text-white/50 [&>strong]:font-normal [&>strong]:text-white">
              Claude explains every RWA position in plain English. Risk score,
              concentration, counterparty exposure —{" "}
              <strong>without parsing six issuer disclosures by hand.</strong>
            </p>
            <div className="mt-8">
              <Button variant="ghost" href="/analyze">
                Run on your wallet →
              </Button>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="overflow-hidden rounded-[5px] border border-white/10 bg-surface-0 shadow-[0_30px_80px_-30px_rgba(139,92,246,0.18)]">
              <div className="flex items-center gap-2 border-b border-white/10 bg-surface-1 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 font-mono text-[11px] text-white/30">
                  radar.oxar.app/analyze?wallet=0xdead…beef
                </span>
              </div>

              <div className="space-y-6 p-6">
                <div className="grid grid-cols-3 gap-3">
                  <Tile label="Total RWA" value="$153,400" />
                  <Tile label="Weighted APY" value="6.12%" />
                  <Tile label="Risk" value="6 / 10" highlight />
                </div>

                <div className="divide-y divide-white/10 rounded-[5px] border border-white/10">
                  {POSITIONS.map((p) => (
                    <div key={p.name} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="text-sm text-white">{p.name}</div>
                        <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.15em] text-white/30">
                          {p.share} · risk {p.risk}
                        </div>
                      </div>
                      <div className="font-mono text-sm text-white">{p.value}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Claude Haiku · explanation
                  </div>
                  <p className="font-mono text-sm leading-relaxed text-white/80">
                    {AI_RESPONSE.slice(0, chars)}
                    <span
                      className="ml-0.5 inline-block h-3.5 w-[2px] -mb-[2px] bg-accent"
                      style={{ animation: "cursor-blink 0.9s steps(2) infinite" }}
                    />
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

function Tile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-[5px] border p-3 ${
        highlight
          ? "border-accent/30 bg-accent/5"
          : "border-white/10 bg-surface-1"
      }`}
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
        {label}
      </div>
      <div className="mt-1 font-mono text-lg text-white">{value}</div>
    </div>
  );
}
