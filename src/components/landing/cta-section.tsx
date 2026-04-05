"use client";

import { FadeIn } from "./fade-in";
import { useWarp } from "./warp-transition";

export function CTASection() {
  const { startWarp } = useWarp();

  return (
    <section className="px-6 md:px-10 py-[120px] text-center relative overflow-hidden">
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(200,255,0,0.05) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10">
        <div className="font-mono text-[9px] tracking-[0.2em] text-oxar-light uppercase mb-6">
          Start earning today
        </div>
        <FadeIn>
          <h2
            className="font-display leading-[0.9] text-oxar-white mb-4"
            style={{ fontSize: "clamp(60px, 10vw, 140px)" }}
          >
            YOUR
            <br />
            MONEY
            <br />
            <span className="text-oxar-accent">WORKS.</span>
          </h2>
        </FadeIn>
        <p className="text-[15px] text-oxar-lighter font-light mb-12 max-w-[480px] mx-auto leading-[1.7]">
          Government-backed bonds. On-chain yield. No bank account required.
          Connect your wallet and start earning in under 60 seconds.
        </p>
        <div className="flex gap-4 justify-center items-center flex-wrap mb-10">
          <button
            onClick={() => startWarp("/login")}
            className="font-mono text-xs tracking-[0.1em] uppercase px-12 py-4 bg-oxar-white text-oxar-black border-none cursor-pointer transition-all duration-200 hover:bg-oxar-accent"
          >
            Connect Wallet &amp; Start &rarr;
          </button>
          <button className="font-mono text-[11px] tracking-[0.1em] uppercase text-oxar-lighter cursor-pointer bg-transparent border-none transition-colors duration-200 hover:text-oxar-white">
            Join Waitlist
          </button>
        </div>
        <div className="font-mono text-[9px] text-oxar-mid tracking-[0.1em]">
          USDC &rarr; oxToken &middot; Powered by Solana &middot; Smart contract
          audited &middot; Not financial advice
        </div>
      </div>
    </section>
  );
}
