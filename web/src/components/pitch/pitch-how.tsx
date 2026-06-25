const ACCENT = "#E8A700";

const NODES = [
  { label: "You", sub: "your wallet · your keys" },
  { label: "OXAR", sub: "one account" },
  { label: "Audited protocols", sub: "Jupiter · Kamino · xStocks · Delora" },
];

export function PitchHow() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-black px-6 py-20">
      <div className="text-center mb-14 sm:mb-20">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">
          how it works
        </p>
        <h2 className="mt-3 font-extralight italic text-[clamp(30px,3.4vw,56px)] tracking-tight text-white">
          No contract of our own
        </h2>
      </div>

      <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-0 max-w-[1100px] w-full">
        {NODES.map((n, i) => (
          <div key={n.label} className="flex flex-col md:flex-row items-center md:flex-1">
            <div className="flex-1 w-full border border-white/15 rounded-[22px] px-6 py-8 text-center">
              <h3 className="font-extralight text-[clamp(22px,2.2vw,34px)] tracking-tight text-white">
                {n.label}
              </h3>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                {n.sub}
              </p>
            </div>
            {i < NODES.length - 1 && (
              <span
                className="shrink-0 px-4 py-2 text-2xl font-light rotate-90 md:rotate-0"
                style={{ color: ACCENT }}
              >
                →
              </span>
            )}
          </div>
        ))}
      </div>

      <p className="mt-16 text-center font-light text-[clamp(15px,1.4vw,22px)] text-white/70 max-w-[680px] leading-relaxed">
        We&apos;re a clean interface over audited protocols.{" "}
        <span className="text-white">Zero contract risk.</span> We just move fast.
      </p>
    </section>
  );
}
