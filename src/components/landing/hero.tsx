"use client";

import { useWarp } from "./warp-transition";

export function Hero() {
  const { startWarp } = useWarp();

  return (
    <section
      className="min-h-screen grid grid-rows-[1fr_auto] px-6 md:px-10 pt-[120px] pb-[60px] relative overflow-hidden"
      style={{ borderBottom: "1px solid #2a2a2a" }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      {/* Background orb */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-200px",
          right: "-200px",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(200,255,0,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[60px] items-end">
        {/* Left */}
        <div>
          <div className="font-mono text-[10px] tracking-[0.15em] text-oxar-accent uppercase mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-oxar-accent rounded-full animate-pulse-dot" />
            Live on Solana &middot; MVP Ukraine
          </div>
          <h1
            className="font-display leading-[0.92] tracking-[0.02em] text-oxar-white mb-8"
            style={{ fontSize: "clamp(72px, 10vw, 140px)" }}
          >
            EARN
            <br />
            <span
              style={{
                color: "transparent",
                WebkitTextStroke: "1px rgba(255,255,255,0.3)",
              }}
            >
              16&ndash;28%
            </span>
            <br />
            APY
          </h1>
          <p className="text-[15px] leading-[1.7] text-oxar-lighter max-w-[400px] font-light mb-10">
            Tokenized government bonds from emerging markets — accessible
            on-chain for the first time. No bank. No broker. Just yield.
          </p>
          <div className="flex gap-4 items-center flex-wrap">
            <button
              onClick={() => startWarp("/login")}
              className="font-mono text-[11px] tracking-[0.1em] uppercase px-8 py-3.5 bg-oxar-white text-oxar-black border-none cursor-pointer transition-all duration-200 hover:bg-oxar-accent"
            >
              Start Earning &rarr;
            </button>
            <a
              href="#vaults"
              className="font-mono text-[11px] tracking-[0.1em] uppercase text-oxar-lighter cursor-pointer bg-transparent border-none transition-colors duration-200 hover:text-oxar-white no-underline"
            >
              View Vaults &darr;
            </a>
          </div>
        </div>

        {/* Right - Stats */}
        <div className="flex flex-col gap-0.5">
          <div className="grid grid-cols-2 gap-0.5">
            <StatBox value="$230B" accent label="stablecoins at 0%" />
            <StatBox value={<>4&times;</>} label="vs US Treasuries" />
          </div>
          <div className="grid grid-cols-2 gap-0.5 mt-0.5">
            <StatBox value="6" label="active vaults" />
            <StatBox value="0%" label="tax on UA bonds" />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-10 mt-[60px] gap-4"
        style={{ borderTop: "1px solid #2a2a2a" }}
      >
        <div className="font-mono text-[9px] tracking-[0.15em] text-oxar-light uppercase flex items-center gap-3">
          <div className="w-10 h-px bg-oxar-gray relative overflow-hidden">
            <div
              className="absolute top-0 bg-oxar-white w-full h-full animate-scan"
              style={{ left: "-100%" }}
            />
          </div>
          Scroll to explore
        </div>
        <div className="font-mono text-[9px] text-oxar-light tracking-[0.1em] uppercase">
          Solana &middot; Anchor &middot; Proof of Reserve
        </div>
      </div>
    </section>
  );
}

function StatBox({
  value,
  label,
  accent,
}: {
  value: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-oxar-dark border border-oxar-gray p-7 px-6 relative transition-colors duration-200 hover:border-oxar-mid">
      <div
        className={`font-display text-[52px] leading-none mb-2 ${
          accent ? "text-oxar-accent" : "text-oxar-white"
        }`}
      >
        {value}
      </div>
      <div className="font-mono text-[9px] tracking-[0.12em] text-oxar-light uppercase">
        {label}
      </div>
      <div className="absolute bottom-3 right-3 w-4 h-4 border-r border-b border-oxar-gray" />
    </div>
  );
}
