const SOURCES = [
  "Jupiter Lend",
  "Kamino",
  "Ondo Treasuries",
  "Maple Credit",
  "Tokenized Stocks",
  "Gold",
];

/** "Everything in one account" — OXAR at the centre, sources orbiting it.
 *  Built in code (no illustration needed), on-brand dark + violet. */
export function HubDiagram() {
  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
      <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.28em] text-white/40">
        06 · one account
      </p>
      <h2 className="mt-4 font-[family-name:var(--font-instrument-serif)] text-[clamp(30px,5vw,64px)] leading-[1] tracking-[-0.02em] text-white">
        Every way to grow, <span className="text-[#8B5CF6]">in one place.</span>
      </h2>

      <div className="relative mt-14 flex h-[300px] w-full max-w-3xl items-center justify-center md:h-[360px]">
        {/* centre */}
        <div className="z-10 flex h-28 w-28 items-center justify-center rounded-full border border-[#8B5CF6]/50 bg-[#3c05c7]/20 md:h-32 md:w-32">
          <span className="font-[family-name:var(--font-instrument-serif)] text-2xl text-white md:text-3xl">OXAR</span>
        </div>
        {/* orbit */}
        {SOURCES.map((s, i) => {
          const angle = (i / SOURCES.length) * 2 * Math.PI - Math.PI / 2;
          const rx = 46; // % of container width
          const ry = 42; // % of container height
          const left = 50 + rx * Math.cos(angle);
          const top = 50 + ry * Math.sin(angle);
          return (
            <div
              key={s}
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/70 md:text-[13px]"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              {s}
            </div>
          );
        })}
      </div>

      <p className="mt-12 max-w-lg font-light text-[clamp(15px,1.5vw,20px)] leading-relaxed text-white/60">
        Save, earn, and own real assets — treasuries, credit, stocks, gold — from a single
        non-custodial account. One tap. No apps to juggle, no wallets to manage.
      </p>
    </section>
  );
}
