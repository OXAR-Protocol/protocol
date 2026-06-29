"use client";

import { Reveal } from "./primitives";
import { WaitlistForm } from "./waitlist-form";

export function Waitlist() {
  return (
    <section id="waitlist" className="bg-black px-[clamp(24px,5.5vw,80px)] py-[clamp(72px,9vw,120px)] text-white">
      {/* Form — sits above the crowd. */}
      <div className="mx-auto max-w-[760px] text-center">
        <Reveal>
          <p className="lowercase text-[clamp(18px,1.7vw,24px)] leading-none text-white/55">[ the waitlist ]</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-6 text-[clamp(32px,4.5vw,64px)] leading-[1.05] tracking-[-0.06em]">
            take a seat. <span className="italic text-white/55">we&apos;ll call</span> your number.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <WaitlistForm />
        </Reveal>
      </div>

      {/* The crowd. */}
      <div className="mx-auto mt-[clamp(40px,6vw,80px)] w-full max-w-[820px]">
        <img src="/waitlist-crowd.jpg" alt="" className="block w-full select-none" />
      </div>
    </section>
  );
}
