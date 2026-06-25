const ACCENT = "#E8A700";

export function PitchModel() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-black px-6 py-20">
      <div className="text-center mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">
          how we make money
        </p>
        <h2 className="mt-3 font-extralight italic text-[clamp(28px,3vw,48px)] tracking-tight text-white">
          A cut of the yield
        </h2>
      </div>

      <p
        className="font-extralight italic leading-none tracking-tight text-[clamp(80px,13vw,200px)]"
        style={{ color: ACCENT }}
      >
        10–20%
      </p>
      <p className="mt-4 font-mono text-xs uppercase tracking-[0.25em] text-white/40">
        of the yield we generate
      </p>

      <p className="mt-12 text-center font-light text-[clamp(15px,1.4vw,22px)] text-white/70 max-w-[640px] leading-relaxed">
        Off by design while we grow — the rail&apos;s already built.
      </p>

      <div className="mt-10 border-t border-white/10 pt-8 text-center max-w-[640px]">
        <p className="font-light text-[clamp(15px,1.3vw,20px)] text-white/55 leading-relaxed">
          RWAs on-chain:{" "}
          <span className="text-white">$30B+ today</span>, heading to trillions
          by 2030.
        </p>
      </div>
    </section>
  );
}
