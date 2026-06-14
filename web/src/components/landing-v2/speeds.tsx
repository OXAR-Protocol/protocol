"use client";

import { DISPLAY } from "./fonts";
import { Label, Reveal, Spread } from "./primitives";

const SPEEDS = [
  { name: "sleepy", apy: "4-6%", tag: "slow but steady — Ondo USDY · Kamino USDC", size: "clamp(48px,7.6vw,110px)" },
  { name: "walking", apy: "6-9%", tag: "balanced pace — Maple Syrup · Kamino · JLP", size: "clamp(64px,12.5vw,180px)", accent: true },
  { name: "running", apy: "9-14%", tag: "fast and loud — Ethena sUSDe · JLP · Drift", size: "clamp(80px,18vw,260px)" },
];

export function Speeds() {
  return (
    <section
      id="speeds"
      className="overflow-hidden bg-white px-[clamp(24px,5.5vw,80px)] py-[clamp(80px,10vw,140px)] text-black"
    >
      <Reveal>
        <Label className="md:ml-[58%]">speeds</Label>
      </Reveal>
      <Reveal delay={0.05}>
        <div className="mt-6 text-[clamp(32px,4.5vw,64px)] leading-[1.05] tracking-[-0.04em]">
          <p>how loud do you want</p>
          <Spread>
            <span>your</span>
            <span className="italic">money</span>
            <span className="italic">to</span>
            <span className="italic">be?</span>
          </Spread>
        </div>
      </Reveal>

      <div className="mt-[clamp(40px,5vw,72px)]">
        {SPEEDS.map((s, i) => (
          <Reveal key={s.name} delay={i * 0.06}>
            <div className="border-t border-black/15 pt-[clamp(16px,2.2vw,32px)] pb-[clamp(20px,2.6vw,40px)]">
              <div className="flex items-baseline justify-between gap-6">
                <span
                  className={`font-bold leading-[0.9] tracking-[-0.04em] ${s.accent ? "text-[#3c05c7]" : "text-black"}`}
                  style={{ fontFamily: DISPLAY, fontSize: s.size }}
                >
                  {s.name}
                </span>
                <span
                  className={`shrink-0 font-bold leading-[0.9] tabular-nums ${s.accent ? "text-[#3c05c7]" : "text-black"}`}
                  style={{ fontFamily: DISPLAY, fontSize: "clamp(28px,4.4vw,64px)" }}
                >
                  {s.apy}
                </span>
              </div>
              <p className="mt-3 text-[clamp(14px,1.25vw,18px)] text-black/55">{s.tag}</p>
            </div>
          </Reveal>
        ))}
        <div className="border-t border-black/15" />
        <Reveal delay={0.1}>
          <p className="mt-7 lowercase text-[clamp(12px,1vw,14px)] text-black/35">
            pick once, change anytime. one pile, your keys, your money.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
