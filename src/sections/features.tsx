"use client";

import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";
import { AnimatedSection } from "@/components/animated-section";
import { IsometricBoxes } from "@/components/isometric-boxes";

function VaultIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="14" width="60" height="48" rx="6" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <rect x="20" y="22" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <circle cx="40" cy="38" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
      <line x1="40" y1="30" x2="40" y2="46" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <line x1="32" y1="38" x2="48" y2="38" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <circle cx="10" cy="14" r="2.5" fill="white" opacity="0.9" />
      <circle cx="70" cy="14" r="2.5" fill="white" opacity="0.9" />
      <circle cx="70" cy="62" r="2.5" fill="white" opacity="0.9" />
      <circle cx="10" cy="62" r="2.5" fill="white" opacity="0.9" />
      <line x1="16" y1="66" x2="64" y2="66" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="26" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="40" cy="40" r="16" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <path d="M44 20L33 44H41L37 60L50 34H42L44 20Z" fill="white" opacity="0.9" />
      <circle cx="40" cy="14" r="2.5" fill="white" opacity="0.9" />
      <circle cx="40" cy="66" r="2.5" fill="white" opacity="0.9" />
      <circle cx="14" cy="40" r="2.5" fill="white" opacity="0.9" />
      <circle cx="66" cy="40" r="2.5" fill="white" opacity="0.9" />
      <line x1="20" y1="20" x2="26" y2="26" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
      <line x1="54" y1="54" x2="60" y2="60" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
      <line x1="60" y1="20" x2="54" y2="26" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
      <line x1="20" y1="60" x2="26" y2="54" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 10L64 23V49L40 62L16 49V23L40 10Z" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M40 20L54 28V44L40 52L26 44V28L40 20Z" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <path d="M32 36L38 42L49 30" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <circle cx="40" cy="10" r="2.5" fill="white" opacity="0.9" />
      <circle cx="64" cy="23" r="2.5" fill="white" opacity="0.9" />
      <circle cx="64" cy="49" r="2.5" fill="white" opacity="0.9" />
      <circle cx="40" cy="62" r="2.5" fill="white" opacity="0.9" />
      <circle cx="16" cy="49" r="2.5" fill="white" opacity="0.9" />
      <circle cx="16" cy="23" r="2.5" fill="white" opacity="0.9" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="12" width="56" height="56" rx="14" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <rect x="24" y="24" width="32" height="32" rx="8" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <path d="M40 30V50" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      <path d="M46 34C46 34 44 32 40 32C36 32 33 34 33 37C33 40 36 41 40 42C44 43 47 44 47 47C47 50 44 52 40 52C36 52 34 50 34 50" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      <circle cx="12" cy="12" r="2.5" fill="white" opacity="0.9" />
      <circle cx="68" cy="12" r="2.5" fill="white" opacity="0.9" />
      <circle cx="68" cy="68" r="2.5" fill="white" opacity="0.9" />
      <circle cx="12" cy="68" r="2.5" fill="white" opacity="0.9" />
    </svg>
  );
}

const ICONS = [VaultIcon, LightningIcon, ShieldIcon, CoinIcon];

const FEATURES = [
  {
    value: "Real",
    label: "Real Assets",
    description: (
      <>
        Not paper derivatives. Your tokens are backed by{" "}
        <strong>real assets in audited vaults.</strong>
      </>
    ),
  },
  {
    value: "Instant",
    label: "Liquidity",
    description: (
      <>
        Buy or sell anytime. <strong>Fiat back to your card</strong> in seconds,
        not days like traditional banks.
      </>
    ),
  },
  {
    value: "Proof",
    label: "Of Reserves",
    description: (
      <>
        Regular audits, <strong>transparent reserves</strong>. Always know your
        assets are there.
      </>
    ),
  },
  {
    value: "$5",
    label: "Minimum",
    description: (
      <>
        Start with as little as <strong>$5</strong>. No minimum investment, no
        barriers to entry.
      </>
    ),
  },
];

export function Features() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <IsometricBoxes className="opacity-40 pointer-events-auto" />

      <div className="relative max-w-[1200px] mx-auto">
        <AnimatedSection>
          <SectionLabel>Why ETNY</SectionLabel>
          <SectionTitle>Asset ownership, reimagined</SectionTitle>
        </AnimatedSection>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((feature, i) => {
            const Icon = ICONS[i];
            return (
              <AnimatedSection key={feature.label} delay={i * 0.1}>
                <div className="h-full p-6 rounded-[5px] border border-white/10 bg-surface-0 hover:border-white/20 transition-colors">
                  <div className="mb-4 text-white/50">
                    <Icon />
                  </div>
                  <span className="font-mono text-xs uppercase tracking-wide text-white/30">
                    {feature.label}
                  </span>
                  <div className="mt-2 text-[clamp(2rem,4vw,3rem)] font-mono font-normal text-white">
                    {feature.value}
                  </div>
                  <p className="mt-3 font-mono text-sm leading-relaxed text-white/50 [&>strong]:text-white [&>strong]:font-normal">
                    {feature.description}
                  </p>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
