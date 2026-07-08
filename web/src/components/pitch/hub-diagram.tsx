import { Kicker } from "@/components/pitch/slide-frame";

const SOURCES = [
  "jupiter lend",
  "kamino",
  "ondo treasuries",
  "maple credit",
  "tokenized stocks",
  "gold",
];

/** "Everything in one account" — OXAR at the centre, sources orbiting it.
 *  Built in code (no illustration needed), landing-matched DM Sans type. */
export function HubDiagram() {
  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
      <Kicker>one account</Kicker>
      <h2 className="mt-4 font-bold lowercase leading-[0.95] tracking-[-0.02em] text-white text-[clamp(30px,5vw,64px)]">
        every way to grow, <span className="italic">in one place.</span>
      </h2>

      <div className="relative mt-14 flex h-[300px] w-full max-w-3xl items-center justify-center md:h-[360px]">
        {/* centre */}
        <div className="z-10 flex h-28 w-28 items-center justify-center rounded-full border border-[#8B5CF6]/50 bg-[#3c05c7]/20 md:h-32 md:w-32">
          <span className="text-2xl font-bold tracking-[-0.02em] text-white md:text-3xl">OXAR</span>
        </div>
        {/* orbit */}
        {SOURCES.map((s, i) => {
          const angle = (i / SOURCES.length) * 2 * Math.PI - Math.PI / 2;
          const left = 50 + 46 * Math.cos(angle);
          const top = 50 + 42 * Math.sin(angle);
          return (
            <div
              key={s}
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[12px] lowercase text-white/70 md:text-[13px]"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              {s}
            </div>
          );
        })}
      </div>

      <p className="mt-12 max-w-lg font-light lowercase text-[clamp(15px,1.5vw,20px)] leading-relaxed text-white/55">
        save, earn, and own real assets — treasuries, credit, stocks, gold — from a single
        non-custodial account. one tap. no apps to juggle, no wallets to manage.
      </p>
    </section>
  );
}
