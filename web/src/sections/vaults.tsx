"use client";

import { useState } from "react";

import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";
import { AnimatedSection } from "@/components/animated-section";

import { VaultCard, type VaultSummary } from "./vaults/vault-card";

const VAULTS: VaultSummary[] = [
  { name: "Government Bonds UAH", apy: 18, currency: "UAH", term: "3-12 months" },
  { name: "Government Bonds USD", apy: 4, currency: "USD", term: "Stable" },
  { name: "Government Bonds EUR", apy: 3.5, currency: "EUR", term: "Stable" },
];

export function Vaults() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="vaults" className="py-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection>
          <SectionLabel>Vaults</SectionLabel>
          <SectionTitle>Multiple vaults. One protocol.</SectionTitle>
        </AnimatedSection>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {VAULTS.map((vault, i) => (
            <VaultCard
              key={vault.name}
              vault={vault}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              delay={i * 0.08}
            />
          ))}
        </div>

        <AnimatedSection delay={0.3}>
          <p className="mt-8 text-center font-mono text-xs text-white/20">
            Click a vault to calculate your yield
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
