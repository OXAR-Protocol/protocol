type Speed = {
  level: number;
  label: string;
  description: string;
  apy: string;
  glow: string;
};

const SPEEDS: Speed[] = [
  {
    level: 1,
    label: "Sleepy",
    description: "Slow but steady",
    apy: "4-6%",
    glow: "rgba(255,255,255,0.05)",
  },
  {
    level: 2,
    label: "Walking",
    description: "Balanced pace",
    apy: "6-9%",
    glow: "rgba(255,255,255,0.08)",
  },
  {
    level: 3,
    label: "Running",
    description: "Fast and loud",
    apy: "9-14%",
    glow: "rgba(255,255,255,0.13)",
  },
];

const ACCENT = "#FFFFFF";

// Equalizer mark — rising bars, `level` of them lit. Reads as "how loud".
function Tempo({ level }: { level: number }) {
  const heights = [26, 44, 64];
  return (
    <div className="flex h-[64px] items-end gap-2.5" aria-hidden>
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[10px] rounded-full"
          style={{
            height: h,
            background: i < level ? ACCENT : "rgba(255,255,255,0.14)",
          }}
        />
      ))}
    </div>
  );
}

export function PitchCurrencies() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-black px-4 py-12">
      <div className="text-center mb-10 sm:mb-14">
        <p className="font-bold text-base sm:text-lg text-[#f0f0f2] tracking-tight">
          THREE SPEEDS · ONE APP
        </p>
        <p className="font-extralight italic text-base sm:text-lg text-[#f0f0f2] tracking-tight mt-1">
          HOW LOUD DO YOU WANT YOUR MONEY
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 max-w-[1400px] w-full px-6">
        {SPEEDS.map((speed) => (
          <article
            key={speed.label}
            className="relative border border-white/15 rounded-[28px] aspect-[3/4] flex flex-col items-center justify-between px-8 py-10 overflow-hidden"
            style={{
              boxShadow: `0 30px 80px -40px ${speed.glow}, inset 0 0 80px ${speed.glow}`,
            }}
          >
            <div className="flex flex-col items-center">
              <Tempo level={speed.level} />
              <h3 className="mt-7 font-extralight italic text-[clamp(28px,3vw,48px)] tracking-tight text-white">
                {speed.label}
              </h3>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.25em] text-white/40">
                {speed.description}
              </p>
            </div>

            <div className="text-center">
              <p className="font-extralight italic text-[clamp(40px,5vw,72px)] tracking-tight text-white leading-none">
                {speed.apy}
              </p>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.25em] text-white/40">
                APY
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
