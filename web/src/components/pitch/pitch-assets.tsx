type Asset = {
  name: string;
  note: string;
  status: "LIVE" | "SOON";
};

const ASSETS: Asset[] = [
  { name: "Tokenized equities", note: "TSLA, AAPL, SPY…", status: "LIVE" },
  { name: "Physical gold", note: "Real, redeemable", status: "LIVE" },
  { name: "Stablecoin lending", note: "USDC yield", status: "LIVE" },
  { name: "Government bonds", note: "4–16% APY", status: "SOON" },
];

const ACCENT = "#E8A700";

export function PitchAssets() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center bg-black px-6 py-20">
      <div className="text-center mb-12 sm:mb-16">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/40">
          one account · every asset
        </p>
        <h2 className="mt-3 font-extralight italic text-[clamp(30px,3.4vw,56px)] tracking-tight text-white">
          The RWA hub
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-[1100px] w-full">
        {ASSETS.map((a) => (
          <article
            key={a.name}
            className="relative flex items-center justify-between border border-white/15 rounded-[22px] px-7 py-6 overflow-hidden"
          >
            <div>
              <h3 className="font-extralight text-[clamp(20px,2vw,30px)] tracking-tight text-white">
                {a.name}
              </h3>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                {a.note}
              </p>
            </div>
            <span
              className="font-mono text-[11px] uppercase tracking-[0.25em]"
              style={{ color: a.status === "LIVE" ? ACCENT : "rgba(255,255,255,0.35)" }}
            >
              {a.status}
            </span>
          </article>
        ))}
      </div>

      <p className="mt-12 text-center font-light text-[clamp(15px,1.3vw,20px)] text-white/60 max-w-[640px] leading-relaxed">
        Fund it from any chain. Pay with crypto or{" "}
        <span className="text-white">Apple Pay</span>. On-chain, liquid, 24/7 —
        and always yours.
      </p>
    </section>
  );
}
