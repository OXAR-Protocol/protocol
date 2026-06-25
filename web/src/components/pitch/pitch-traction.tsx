const ACCENT = "#FFFFFF";

const LIVE = [
  "Stablecoin lending — live on mainnet",
  "Tokenized stocks, gold & cross-chain — working",
  "First partner tests underway",
  "Waitlist open & growing",
];

export function PitchTraction() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-black px-6 py-20">
      <div className="text-center mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">
          where we are
        </p>
        <h2 className="mt-3 font-extralight italic text-[clamp(30px,3.4vw,56px)] tracking-tight text-white">
          Already live
        </h2>
      </div>

      <ul className="flex flex-col gap-4 max-w-[640px] w-full">
        {LIVE.map((line) => (
          <li
            key={line}
            className="flex items-center gap-4 border border-white/12 rounded-[18px] px-6 py-4"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: ACCENT, boxShadow: `0 0 14px ${ACCENT}` }}
            />
            <span className="font-light text-[clamp(15px,1.4vw,20px)] text-white/85">
              {line}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-12 text-center max-w-[640px]">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">
          two founders · shipping fast
        </p>
        <p className="mt-5 font-light text-[clamp(16px,1.5vw,24px)] text-white/80 leading-relaxed">
          We&apos;re raising to fully open access.{" "}
          <span className="text-white">Grants, intros & mentorship welcome.</span>
        </p>
      </div>
    </section>
  );
}
