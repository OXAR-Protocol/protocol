"use client";

import { useEffect, useRef } from "react";
import { DiveEngine } from "./webgl/dive-engine";
import { AssetCards } from "./asset-cards";
import { ApyTicker } from "./apy-ticker";

const DEPTH_MAX_M = 40;

// One continuous descent: surface → plunge → currents → the deep → lakebed.
// Backgrounds/canvas are fixed layers; scroll drives them imperatively (no
// React re-render per frame).
export function DiveExperience() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const deepRef = useRef<HTMLDivElement>(null);
  const bedRef = useRef<HTMLDivElement>(null);
  const gaugeRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let engine: DiveEngine | null = null;
    try {
      engine = new DiveEngine(canvasRef.current!);
      engine.play();
    } catch {
      // No WebGL → static gradient background carries the scene.
    }

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        engine?.setScroll(p);
        if (heroRef.current) {
          heroRef.current.style.opacity = String(1 - smooth(p, 0.02, 0.16));
        }
        if (veilRef.current) {
          const peak = smooth(p, 0.08, 0.16) * (1 - smooth(p, 0.18, 0.3));
          veilRef.current.style.opacity = String(peak * 0.95);
        }
        if (deepRef.current) {
          deepRef.current.style.opacity = String(smooth(p, 0.5, 0.75));
        }
        if (bedRef.current) {
          bedRef.current.style.opacity = String(smooth(p, 0.78, 0.95));
        }
        if (gaugeRef.current) {
          gaugeRef.current.textContent = `−${(p * DEPTH_MAX_M).toFixed(1)} m`;
        }
      });
    };
    const onMove = (e: PointerEvent) => {
      engine?.setMouse(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      engine?.destroy();
    };
  }, []);

  return (
    <main className="relative bg-[#04070d] text-white">
      {/* fixed scene layers */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#0a1322] via-[#060b16] to-[#03050a]" />
      <div ref={heroRef} className="fixed inset-0 z-[1]">
        {/* Drop the Flow loop at web/public/landing-assets/surface.mp4 */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          onError={() => videoRef.current?.classList.add("hidden")}
          src="/landing-assets/surface.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1626]/60 via-transparent to-[#04070d]" />
      </div>
      <canvas ref={canvasRef} className="fixed inset-0 z-[2] w-full h-full" />
      <div ref={veilRef} className="fixed inset-0 z-[3] bg-[#020409] opacity-0" />
      <div
        ref={deepRef}
        className="fixed inset-0 z-[3] opacity-0 bg-[#02040a]/70 pointer-events-none"
      />
      <div
        ref={bedRef}
        className="fixed inset-0 z-[3] opacity-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(55% 38% at 50% 88%, rgba(212,160,84,0.13), rgba(120,150,210,0.05) 55%, transparent 75%)",
        }}
      />

      {/* depth gauge */}
      <div className="fixed right-5 top-1/2 -translate-y-1/2 z-20 flex flex-col items-end gap-2 font-mono text-[11px] text-white/35 select-none">
        <span className="tracking-widest">DEPTH</span>
        <span ref={gaugeRef} className="text-white/70 tabular-nums">
          −0.0 m
        </span>
      </div>

      {/* scroll chapters */}
      <Chapter>
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-white/40 mb-6">
          Non-custodial yield · Solana
        </p>
        <h1 className="font-serif font-normal text-[clamp(2.6rem,6.5vw,5rem)] leading-[1.04] max-w-3xl">
          Where does your money <span className="text-white/40">sleep?</span>
        </h1>
        <p className="mt-6 font-mono text-sm text-white/50 max-w-md leading-relaxed">
          Deposit USDC. It earns around the clock in your own wallet —{" "}
          <span className="text-white/85">no bank, no broker, no lock.</span>
        </p>
        <p className="mt-16 font-mono text-xs tracking-widest uppercase text-white/30 animate-pulse">
          Look beneath the surface ↓
        </p>
      </Chapter>

      <Chapter>
        <h2 className="font-serif text-[clamp(1.9rem,4vw,3rem)] leading-tight max-w-2xl">
          Asleep on the surface.{" "}
          <span className="text-white/40">Working underneath.</span>
        </h2>
      </Chapter>

      <Chapter align="end">
        <div className="max-w-md mb-8">
          <h2 className="font-serif text-[clamp(1.7rem,3.4vw,2.5rem)] leading-tight">
            Every current is an asset.
          </h2>
          <p className="mt-3 font-mono text-xs text-white/40 leading-relaxed">
            One asset is live today. The rest is the world we&apos;re building
            toward.
          </p>
        </div>
        <AssetCards />
      </Chapter>

      <Chapter>
        <h2 className="font-serif text-[clamp(1.9rem,4vw,3rem)] leading-tight">
          The deep is <span className="text-white/40">simple.</span>
        </h2>
        <ul className="mt-8 space-y-3 font-mono text-sm text-white/55 max-w-md leading-relaxed">
          <li>— Your wallet holds the position. We never touch funds.</li>
          <li>— Withdraw anytime. No lock-ups, no penalties.</li>
          <li>
            — Real rate, right now: <ApyTicker className="text-sm" />
          </li>
        </ul>
      </Chapter>

      <Chapter>
        <h2 className="font-serif text-[clamp(2.2rem,5.5vw,4rem)] leading-[1.05] max-w-3xl">
          Where your money sleeps.
        </h2>
        <p className="mt-5 font-mono text-sm text-white/50">
          Right here. <span className="text-amber-400/90">Earning in its sleep.</span>
        </p>
        <a
          href="https://app.oxar.app"
          className="mt-10 inline-block border border-amber-400/50 hover:border-amber-400 hover:bg-amber-400/10 transition-colors rounded-sm px-7 py-3 font-mono text-sm tracking-wide"
        >
          Launch app →
        </a>
      </Chapter>
    </main>
  );
}

function Chapter({
  children,
  align = "start",
}: {
  children: React.ReactNode;
  align?: "start" | "end";
}) {
  return (
    <section
      className={`relative z-10 min-h-screen flex flex-col justify-center px-6 sm:px-16 max-w-6xl mx-auto ${
        align === "end" ? "items-end text-right sm:flex-row sm:items-center sm:justify-end sm:gap-16 sm:text-left" : ""
      }`}
    >
      <div className={align === "end" ? "flex flex-col items-start" : ""}>{children}</div>
    </section>
  );
}

function smooth(p: number, a: number, b: number) {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
