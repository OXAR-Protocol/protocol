import type { CSSProperties } from "react";

const planetStyle: CSSProperties = {
  background: `
    radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85) 0%, rgba(180,210,240,0.7) 12%, rgba(180,210,240,0) 25%),
    radial-gradient(circle at 50% 50%, rgba(176,212,240,1) 0%, rgba(142,185,221,1) 17%, rgba(107,157,201,1) 35%, rgba(77,124,167,1) 52%, rgba(47,90,133,1) 70%, rgba(32,63,95,1) 85%, rgba(16,36,56,1) 100%)
  `,
  boxShadow: `
    inset -40px -40px 100px rgba(0,0,0,0.6),
    inset 26px 26px 80px rgba(255,255,255,0.15),
    0 40px 60px rgba(70,140,220,0.2),
    0 0 80px rgba(70,140,220,0.18)
  `,
};

const actionWordClass =
  "font-light capitalize text-[clamp(28px,2.5vw,48px)] tracking-tight text-white leading-none";

export function PitchCards() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-black px-6 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1800px] w-full">
        {/* Card 1 — Problem */}
        <article className="relative border border-white/15 rounded-[34px] aspect-[864/910] flex flex-col items-center justify-between px-12 pt-16 pb-10 overflow-hidden">
          <h2 className="font-extralight text-[clamp(28px,2.4vw,46px)] tracking-tight text-center leading-[1.15] text-[#f0f0f2]">
            <em className="font-medium not-italic italic">YOUR MONEY</em>{" "}
            <span className="font-extralight">IS SLEEPING.</span>
            <br />
            <span className="font-extralight">BANKS WANT IT THAT WAY.</span>
          </h2>
          <div className="flex-1 flex items-center justify-center w-full">
            <div
              className="w-[clamp(240px,32vw,373px)] aspect-square rounded-full"
              style={planetStyle}
            />
          </div>
          <p className="text-center text-[clamp(14px,1.1vw,18px)] text-[#5a5a5e] max-w-[340px] leading-snug">
            High yield or instant access — never both. Until now.
          </p>
        </article>

        {/* Card 2 — Solution */}
        <article className="relative border border-white/15 rounded-[34px] aspect-[864/910] flex flex-col items-center justify-between px-12 pt-16 pb-10 overflow-hidden">
          <h2 className="font-extralight italic text-[clamp(28px,2.4vw,46px)] tracking-tight text-center leading-[1.15] text-[#f0f0f2]">
            WALLET → YIELD → PILE
          </h2>
          <div className="flex-1 flex flex-col items-center justify-center gap-4 sm:gap-5 lg:gap-6">
            <span className={actionWordClass}>connect</span>
            <span className={actionWordClass}>earn</span>
            <span className={actionWordClass + " font-normal"}>gather</span>
            <span className={actionWordClass}>withdraw</span>
          </div>
          <div className="h-2" />
        </article>
      </div>
    </section>
  );
}
