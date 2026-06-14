"use client";

import { HELVETICA } from "./fonts";
import { Label, Reveal } from "./primitives";

const HEADLINE = "text-[clamp(34px,6.8vw,72px)] leading-[1.02] tracking-[-0.06em]";

export function Problem() {
  return (
    <section
      id="problem"
      className="overflow-hidden bg-white px-[clamp(24px,5.5vw,80px)] pt-[clamp(96px,11vw,160px)] pb-[clamp(72px,9vw,120px)] text-black"
    >
      <Reveal>
        <Label className="text-black/45">the problem</Label>
      </Reveal>

      <Reveal delay={0.05}>
        <div className={`mt-10 lowercase ${HEADLINE}`}>
          <p>banks force a choice: high yield or instant access.</p>
          {/* The line literally enacts itself — "tradeoff" is broken in two. */}
          <p className="mt-1 flex flex-wrap items-baseline gap-x-[0.4em]">
            <span>we</span>
            <span className="italic">break</span>
            <span className="italic">the</span>
            <span className="relative inline-flex italic">
              <span>trade</span>
              <span className="translate-y-[0.14em] text-[#3c05c7]">off</span>
              <span
                aria-hidden
                className="absolute left-0 right-0 top-1/2 h-px -rotate-3 bg-black/70"
              />
            </span>
          </p>
        </div>
      </Reveal>

      {/* Crescendo: the rate you should care about dwarfs the rest and runs
          clean off the right edge of the page. */}
      <div className="mt-[clamp(72px,11vw,180px)] grid grid-cols-1 items-end gap-y-12 sm:grid-cols-[auto_auto_1fr] sm:gap-x-[clamp(24px,5vw,80px)]">
        <Stat value="0%" size="clamp(40px,6vw,90px)" copy="most crypto wallets earn this on their usdc" muted />
        <Stat value="4%" size="clamp(64px,11vw,180px)" copy="best high-yield savings — requires a bank" />
        <div className="relative">
          <Reveal delay={0.15}>
            <span
              className="block whitespace-nowrap font-bold leading-[0.8] text-[#3c05c7]"
              style={{ fontFamily: HELVETICA, fontSize: "clamp(96px,21vw,360px)" }}
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
        style={{ fontFamily: HELVETICA, fontSize: size }}
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
