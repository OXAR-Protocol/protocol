"use client";

import { Label, Reveal } from "./primitives";

const MILESTONES = [
  {
    phase: "now",
    name: "building",
    copy: "USDC yield live on Solana mainnet via Jupiter Lend. Group piles and more sources under construction.",
    size: "clamp(48px,8.9vw,128px)",
    tint: "text-[#3c05c7]",
    current: true,
  },
  {
    phase: "aug 2026",
    name: "mvp launch",
    copy: "Personal yield + group piles + Apple Pay deposits. First friend groups onboard.",
    size: "clamp(40px,6.4vw,92px)",
    tint: "text-black",
  },
  {
    phase: "q4 2026",
    name: "more yields, more rules",
    copy: "Cross-chain via Delora. Buffer top-up, round-ups, copy-investing. Emerging-market bonds via partner broker.",
    size: "clamp(30px,4.45vw,64px)",
    tint: "text-black/65",
  },
  {
    phase: "2027",
    name: "native app + scale",
    copy: "iOS and Android. Multi-currency. Emerging-market bonds beyond the first markets.",
    size: "clamp(24px,3.2vw,46px)",
    tint: "text-black/40",
  },
];

export function Roadmap() {
  return (
    <section
      id="roadmap"
      className="overflow-hidden bg-white px-[clamp(24px,5.5vw,80px)] py-[clamp(80px,10vw,140px)] text-black"
    >
      <Reveal>
        <Label className="md:ml-[51%]">roadmap</Label>
      </Reveal>
      <Reveal delay={0.05}>
        <div className="mt-6 text-[clamp(32px,4.5vw,64px)] leading-[1.05] tracking-[-0.04em] md:ml-[51%]">
          <p>from mainnet</p>
          <p className="italic">to your phone.</p>
        </div>
      </Reveal>

      <div className="mt-[clamp(48px,7vw,96px)] flex flex-col gap-[clamp(36px,5vw,72px)]">
        {MILESTONES.map((m, i) => (
          <Reveal key={m.phase} delay={i * 0.08}>
            <div className="grid grid-cols-1 gap-y-3 md:grid-cols-[clamp(120px,15vw,200px)_1fr]">
              <div className="flex items-center gap-2 pt-[0.5em]">
                <span className="lowercase text-[clamp(13px,1.1vw,16px)] text-black/45">{m.phase}</span>
                {m.current && <span className="h-2 w-2 rounded-full bg-[#3c05c7]" aria-label="now" />}
              </div>
              <div>
                <h3
                  className={`font-medium lowercase leading-[0.92] tracking-[-0.05em] ${m.tint}`}
                  style={{ fontSize: m.size }}
                >
                  {m.name}
                </h3>
                <p className="mt-4 max-w-[640px] text-[clamp(16px,1.4vw,20px)] leading-snug text-black/45">
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
