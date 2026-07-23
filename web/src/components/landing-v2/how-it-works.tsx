"use client";

import { DISPLAY } from "./fonts";
import { Label, Reveal, Spread } from "./primitives";

const STEPS = [
  { n: "01", title: "connect or tap", copy: "Connect a crypto wallet — Apple Pay deposits on the way. No bank account, no broker. Setup takes a minute." },
  { n: "02", title: "choose your pace", copy: "Sleepy, Walking or Running — three risk templates. Pick once, change anytime." },
  { n: "03", title: "money wakes up", copy: "Your USDC earns on Jupiter Lend, Ondo and Maple today, with more on the way." },
  { n: "04", title: "own real assets", copy: "Not just yield — buy tokenized stocks and gold, held in your own wallet. Bonds and new assets coming next." },
  { n: "05", title: "wake some up anytime", copy: "Withdraw whenever. No locks, no penalty. Your money sleeps because you let it." },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="overflow-hidden bg-white px-[clamp(24px,5.5vw,80px)] py-[clamp(80px,10vw,140px)] text-black"
    >
      <Reveal>
        <Label className="md:ml-[58%]">how it works</Label>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="mt-6 font-light text-[clamp(32px,4.5vw,64px)] leading-[1.05] tracking-[-0.07em] md:ml-[25%]">
          <p>your money wakes up</p>
          <Spread>
            <span>in</span>
            <span>five</span>
            <span>simple</span>
            <span>steps.</span>
          </Spread>
        </div>
      </Reveal>

      <div className="mt-[clamp(56px,8vw,112px)] flex flex-col gap-[clamp(56px,9vw,140px)]">
        {STEPS.map((step, i) => {
          const left = i % 2 === 0;
          return (
            <Reveal key={step.n} delay={0.04}>
              <div className={`relative flex flex-col ${left ? "items-start text-left" : "items-end text-right md:ml-auto"}`}>
                <span
                  aria-hidden
                  className={`pointer-events-none absolute top-0 select-none leading-[0.75] ${left ? "-left-[0.06em]" : "-right-[0.06em]"}`}
                  style={{
                    fontFamily: DISPLAY,
                    fontWeight: 700,
                    fontSize: "clamp(160px,33vw,480px)",
                    color: "transparent",
                    WebkitTextStroke: "1.5px rgba(0,0,0,0.22)",
                  }}
                >
                  {step.n}
                </span>

                <div className="relative z-10 max-w-[520px] pt-[clamp(40px,9vw,150px)]">
                  <h3 className="lowercase text-[clamp(30px,3.9vw,56px)] leading-none tracking-[-0.05em]">
                    {step.title}
                  </h3>
                  <p className={`mt-5 text-[clamp(16px,1.5vw,22px)] leading-snug text-black/55 ${left ? "" : "ml-auto"}`}>
                    {step.copy}
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
