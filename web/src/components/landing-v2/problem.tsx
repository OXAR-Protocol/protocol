"use client";

import { DISPLAY } from "./fonts";
import { Label, Reveal, Spread } from "./primitives";

const HEADLINE =
  "text-[clamp(32px,4.5vw,64px)] leading-[1.05] tracking-[-0.07em]";

export function Problem() {
  return (
    <section
      id="problem"
      className="overflow-hidden bg-white px-[clamp(24px,5.5vw,80px)] pt-[clamp(96px,11vw,160px)] pb-[clamp(72px,9vw,120px)] text-black"
    >
      <Reveal>
        <Label className="md:ml-[58%]">the problem</Label>
      </Reveal>

      <Reveal delay={0.05}>
        <div className={`mt-6 ${HEADLINE}`}>
          <p>Banks force a choice: high yield or instant access.</p>
          <Spread>
            <span>We</span>
            <span className="italic">break</span>
            <span className="italic">the</span>
            <span className="italic">tradeoff.</span>
          </Spread>
          <p>Earn like an investor. Access like savings.</p>
        </div>
      </Reveal>

      {/* Crescendo: 0% → 4% → 5-12%, the OXAR rate dwarfing the rest. */}
      <div className="mt-[clamp(72px,11vw,160px)] grid grid-cols-1 items-end gap-x-10 gap-y-12 sm:grid-cols-[auto_auto_1fr]">
        <Stat value="0%" size="clamp(40px,6.25vw,90px)" copy="most crypto wallets earn this on their usdc" muted />
        <Stat value="4%" size="clamp(56px,12.5vw,180px)" copy="best high-yield savings — requires a bank" />
        <div className="relative">
          <Reveal delay={0.15}>
            <span
              className="block whitespace-nowrap font-bold leading-[0.8] text-[#3c05c7]"
              style={{ fontFamily: DISPLAY, fontSize: "clamp(88px,18.1vw,261px)" }}
            >
              5-12%
            </span>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="mt-3 max-w-[420px] lowercase text-[clamp(16px,1.5vw,22px)] leading-snug text-black/70">
              what your money earns with oxar. withdraw anytime.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Stat({
  value,
  size,
  copy,
  muted,
}: {
  value: string;
  size: string;
  copy: string;
  muted?: boolean;
}) {
  return (
    <Reveal className="flex flex-col">
      <span
        className={`font-bold leading-[0.8] ${muted ? "text-black/30" : "text-black"}`}
        style={{ fontFamily: DISPLAY, fontSize: size }}
      >
        {value}
      </span>
      <p
        className={`mt-3 max-w-[240px] lowercase text-[clamp(13px,1.1vw,16px)] leading-snug ${
          muted ? "text-black/35" : "text-black/55"
        }`}
      >
        {copy}
      </p>
    </Reveal>
  );
}
