import { FadeIn } from "./fade-in";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[9px] tracking-[0.2em] text-oxar-light uppercase flex items-center gap-3 mb-4">
      {children}
      <span className="flex-1 h-px bg-oxar-gray" />
    </div>
  );
}

export function Problem() {
  return (
    <section
      id="problem"
      className="grid grid-cols-1 lg:grid-cols-2"
      style={{ borderBottom: "1px solid #2a2a2a" }}
    >
      {/* Left */}
      <FadeIn>
        <div
          className="p-10 md:p-20 flex flex-col justify-between gap-10"
          style={{ borderRight: "1px solid #2a2a2a" }}
        >
          <div>
            <SectionLabel>01 &middot; Problem</SectionLabel>
            <h2
              className="font-display leading-none text-oxar-white mb-5"
              style={{ fontSize: "clamp(36px, 5vw, 60px)" }}
            >
              The yield gap nobody solved
            </h2>
            <p className="text-sm text-oxar-lighter leading-[1.8] font-light max-w-[380px]">
              $230B+ in stablecoins earn nothing. Ondo proved demand with $2.5B
              TVL — but only offered 4% on US Treasuries. Emerging markets with
              16&ndash;28% yields remain inaccessible on-chain.
            </p>
          </div>
          <div>
            <div className="p-5 px-6 border border-oxar-gray bg-oxar-dark flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 gap-2">
              <span className="font-mono text-[10px] text-oxar-light tracking-[0.1em] uppercase">
                Ondo Finance &middot; US Treasuries
              </span>
              <span className="font-mono text-[11px] text-oxar-lighter">
                ~4% APY &middot; $2.5B TVL
              </span>
            </div>
            <div
              className="p-5 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 gap-2"
              style={{
                border: "1px solid rgba(200,255,0,0.3)",
                background: "rgba(200,255,0,0.04)",
              }}
            >
              <span className="font-mono text-[10px] text-oxar-accent tracking-[0.1em] uppercase">
                OXAR &middot; Emerging Markets
              </span>
              <span className="font-mono text-[11px] text-oxar-accent">
                16&ndash;28% APY &middot; on-chain
              </span>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Right */}
      <FadeIn delay={0.15}>
        <div className="p-10 md:p-20 flex flex-col justify-between gap-10">
          <SectionLabel>Market size</SectionLabel>
          <div>
            <div
              className="font-display leading-[0.9] text-oxar-white mb-2"
              style={{ fontSize: "clamp(60px, 8vw, 100px)" }}
            >
              $230B+
            </div>
            <div className="text-[13px] text-oxar-light font-light leading-[1.5]">
              stablecoins earning zero yield
            </div>
          </div>
          <div>
            <div
              className="font-display leading-[0.9] text-oxar-accent mb-2"
              style={{ fontSize: "clamp(40px, 5vw, 72px)" }}
            >
              &times;4&ndash;7
            </div>
            <div className="text-[13px] text-oxar-light font-light leading-[1.5]">
              higher APY vs existing on-chain bond products
            </div>
          </div>
          <div>
            <div
              className="font-display leading-[0.9] text-oxar-white mb-2"
              style={{ fontSize: "clamp(40px, 5vw, 72px)" }}
            >
              $2.5B
            </div>
            <div className="text-[13px] text-oxar-light font-light leading-[1.5]">
              Ondo TVL proves the demand is real
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
