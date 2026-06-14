"use client";

import { Reveal, SectionHead, Spread } from "./primitives";

const MILESTONES = [
  {
    phase: "now",
    name: "building",
    copy: "USDC yield live on Solana mainnet via Jupiter Lend. Group piles and more sources under construction.",
    size: "clamp(44px,9vw,128px)",
    tint: "text-[#3c05c7]",
    current: true,
  },
  {
    phase: "aug 2026",
    name: "mvp launch",
    copy: "Personal yield + group piles + Apple Pay deposits. First friend groups onboard.",
    size: "clamp(36px,6.5vw,92px)",
    tint: "text-black",
  },
  {
    phase: "q4 2026",
    name: "more yields, more rules",
    copy: "Cross-chain via Delora. Buffer top-up, round-ups, copy-investing. Emerging-market bonds via partner broker.",
    size: "clamp(28px,4.6vw,64px)",
    tint: "text-black/65",
  },
  {
    phase: "2027",
    name: "native app + scale",
    copy: "iOS and Android. Multi-currency. Emerging-market bonds beyond the first markets.",
    size: "clamp(22px,3.4vw,46px)",
    tint: "text-black/40",
  },
];

export function Roadmap() {
  return (
    <section
      id="roadmap"
      className="overflow-hidden bg-white px-[clamp(24px,5.5vw,80px)] py-[clamp(80px,10vw,140px)] text-black"
    >
      <SectionHead label="roadmap">
        <p>from mainnet</p>
        <Spread>
          <span className="italic">to</span>
          <span className="italic">your</span>
          <span className="italic">phone.</span>
        </Spread>
      </SectionHead>

      {/* The road recedes: today is enormous, the future shrinks toward the
          horizon. Scale stands in for distance-in-time. */}
      <div className="mt-[clamp(48px,7vw,96px)] flex flex-col gap-[clamp(28px,4vw,56px)]">
        {MILESTONES.map((m, i) => (
          <Reveal key={m.phase} delay={i * 0.08}>
            <div className="grid grid-cols-1 gap-x-[clamp(24px,5vw,72px)] md:grid-cols-[120px_1fr] md:items-baseline">
              <div className="flex items-center gap-2 pt-[0.4em]">
                <span className="lowercase text-[clamp(13px,1.1vw,16px)] tracking-[0.02em] text-black/45">
                  {m.phase}
                </span>
                {m.current && <span className="h-2 w-2 rounded-full bg-[#3c05c7]" aria-label="now" />}
              </div>
              <div>
                <h3
                  className={`lowercase font-medium leading-[0.92] tracking-[-0.05em] ${m.tint}`}
                  style={{ fontSize: m.size }}
                >
                  {m.name}
                </h3>
                <p className="mt-4 max-w-[640px] lowercase text-[clamp(15px,1.4vw,20px)] leading-snug text-black/45">
                  {m.copy}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
