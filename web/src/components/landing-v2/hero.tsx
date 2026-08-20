"use client";

import { DISPLAY } from "./fonts";

/**
 * Dark full-bleed entry gate, rendered as a fixed overlay above the page. The
 * only way past it is one of the two choices; picking one fades the gate away
 * for good (the parent unmounts it), so the video screen can never be reached
 * again by scrolling — "the problem" becomes the real first section.
 */
export function HeroGate({
  onEnter,
  closing,
}: {
  onEnter: (target: "problem" | "waitlist") => void;
  closing: boolean;
}) {
  return (
    <section
      id="top"
      className={`fixed inset-0 z-[60] overflow-hidden bg-[#171717] text-white transition-opacity duration-500 ${
        closing ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Same hero clip the live site uses — deeply dimmed under the wordmark. */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
        style={{
          opacity: 0.1,
          maskImage:
            "radial-gradient(ellipse 85% 75% at 50% 45%, black, transparent)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 75% at 50% 45%, black, transparent)",
        }}
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-black/45" />

      <div className="absolute right-[clamp(24px,4.2vw,60px)] top-[clamp(28px,2.4vw,38px)] z-10 flex items-center gap-[clamp(28px,3.9vw,56px)]">
        <button
          onClick={() => onEnter("waitlist")}
          className="lowercase text-[clamp(15px,1.25vw,18px)] leading-none whitespace-nowrap"
        >
          <span className="italic">get </span>early access
        </button>
        <button
          onClick={() => onEnter("problem")}
          className="flex h-[38px] items-center justify-center rounded-[42.5px] bg-white/[0.34] px-[26px] backdrop-blur-[14.15px] transition-colors hover:bg-white/[0.45]"
        >
          <span className="lowercase text-[clamp(15px,1.25vw,18px)] leading-none whitespace-nowrap">
            see how it works
          </span>
        </button>
      </div>

      <h1
        className="absolute bottom-[-0.12em] left-[clamp(24px,5.5vw,80px)] z-10 font-bold leading-none tracking-[-0.01em] text-[clamp(72px,12.5vw,180px)]"
        style={{ fontFamily: DISPLAY }}
      >
        OXAR.
      </h1>
    </section>
  );
}
