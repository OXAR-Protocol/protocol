"use client";

import { useState } from "react";
import { HELVETICA } from "./fonts";
import { Reveal, SectionHead, Spread } from "./primitives";

const SPEEDS = [
  { name: "sleepy", apy: "4-6%", tagline: "slow but steady", sources: "Ondo USDY · Kamino USDC", size: "clamp(44px,8vw,110px)" },
  { name: "walking", apy: "6-9%", tagline: "balanced pace", sources: "Maple Syrup · Kamino · JLP", size: "clamp(58px,13vw,180px)", accent: true },
  { name: "running", apy: "9-14%", tagline: "fast and loud", sources: "Ethena sUSDe · JLP · Drift", size: "clamp(76px,19vw,260px)" },
];

export function Speeds() {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <section
      id="speeds"
      className="overflow-hidden bg-white px-[clamp(24px,5.5vw,80px)] py-[clamp(80px,10vw,140px)] text-black"
    >
      <SectionHead label="speeds">
        <p>how loud do you want</p>
        <Spread>
          <span>your</span>
          <span className="italic">money</span>
          <span className="italic">to</span>
          <span className="italic">be?</span>
        </Spread>
      </SectionHead>

      {/* Type size encodes volume: sleepy whispers, running shouts off-edge. */}
      <div className="mt-[clamp(48px,7vw,96px)]" onMouseLeave={() => setHover(null)}>
        {SPEEDS.map((s, i) => {
          const dim = hover !== null && hover !== i;
          const active = hover === i;
          return (
            <Reveal key={s.name} delay={i * 0.06}>
              <a
                href="#waitlist"
                onMouseEnter={() => setHover(i)}
                className="group block border-t border-black/15 py-[clamp(8px,1.4vw,22px)]"
              >
                <div className="flex items-baseline justify-between gap-6">
                  <span
                    className={`whitespace-nowrap font-bold leading-[0.9] tracking-[-0.04em] transition-[opacity,transform] duration-300 ${
                      s.accent ? "text-[#3c05c7]" : "text-black"
                    } ${dim ? "opacity-25" : "opacity-100"} ${active ? "translate-x-[0.04em]" : ""}`}
                    style={{ fontFamily: HELVETICA, fontSize: s.size }}
                  >
                    {s.name}
                  </span>
                  <span
                    className={`shrink-0 font-bold leading-[0.9] tabular-nums transition-[opacity] duration-300 ${
                      s.accent ? "text-[#3c05c7]" : "text-black"
                    } ${active ? "opacity-100" : "opacity-0"}`}
                    style={{ fontFamily: HELVETICA, fontSize: "clamp(32px,4.5vw,72px)" }}
                  >
                    {s.apy}
                  </span>
                </div>
                <div
                  className={`grid overflow-hidden transition-all duration-300 ${
                    active ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0">
                    <p className="lowercase text-[clamp(14px,1.3vw,20px)] text-black/70">
                      {s.tagline} — <span className="text-black/40">{s.sources}</span>
                    </p>
                  </div>
                </div>
              </a>
            </Reveal>
          );
        })}
        <div className="border-t border-black/15" />
      </div>

      <Reveal delay={0.1}>
        <p className="mt-8 lowercase text-[clamp(12px,1vw,14px)] text-black/35">
          pick once, change anytime. one pile, your keys, your money.
        </p>
      </Reveal>
    </section>
  );
}
