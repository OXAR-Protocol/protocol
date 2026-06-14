"use client";

import { HELVETICA } from "./fonts";
import { Label, Reveal } from "./primitives";

const STEPS = [
  { n: "01", title: "connect or tap", copy: "Crypto wallet or Apple Pay. No bank account, no broker. Setup takes a minute." },
  { n: "02", title: "choose your pace", copy: "Sleepy, Walking or Running — three risk templates. Pick once, change anytime." },
  { n: "03", title: "money wakes up", copy: "Your USDC earns on Jupiter Lend today, with Ondo, Maple, Kamino and Ethena on the way." },
  { n: "04", title: "save together", copy: "Start a pile with friends for a real goal — Lisbon, Bali, a wedding. Yield accelerates the group." },
  { n: "05", title: "wake some up anytime", copy: "Withdraw whenever. No locks, no penalty. Your money sleeps because you let it." },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="overflow-hidden bg-[#d9d9d9] px-[clamp(24px,5.5vw,80px)] py-[clamp(80px,10vw,140px)] text-black"
    >
      <Reveal>
        <Label className="text-black/45">how it works</Label>
      </Reveal>

      <div className="mt-[clamp(48px,7vw,96px)] flex flex-col gap-[clamp(56px,9vw,140px)]">
        {STEPS.map((step, i) => {
          const left = i % 2 === 0;
          return (
            <Reveal key={step.n} delay={0.04}>
              <div
                className={`relative flex flex-col ${
                  left ? "items-start text-left" : "items-end text-right md:ml-auto"
                }`}
              >
                {/* Ghost numeral — outlined, bleeding off the page edge. */}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute -top-[0.32em] select-none leading-[0.75] ${
                    left ? "-left-[0.06em]" : "-right-[0.06em]"
                  }`}
                  style={{
                    fontFamily: HELVETICA,
                    fontWeight: 700,
                    fontSize: "clamp(160px,34vw,520px)",
                    color: "transparent",
                    WebkitTextStroke: "1.5px rgba(0,0,0,0.22)",
                  }}
                >
                  {step.n}
                </span>

                <div className="relative z-10 max-w-[560px] pt-[clamp(40px,9vw,150px)]">
                  <span className="lowercase text-[clamp(12px,1vw,14px)] tracking-[0.06em] text-black/40">
                    step {i + 1} of 5
                  </span>
                  <h3 className="mt-3 lowercase text-[clamp(30px,5.2vw,68px)] leading-[1.0] tracking-[-0.05em]">
                    {step.title}
                  </h3>
                  <p
                    className={`mt-5 lowercase text-[clamp(16px,1.5vw,22px)] leading-snug text-black/55 ${
                      left ? "" : "ml-auto"
                    }`}
                  >
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
