"use client";

import { useCallback, useEffect } from "react";
import { HELVETICA } from "./fonts";

/**
 * Dark full-bleed entry gate. On load the page is scroll-locked: the only way
 * in is one of the two choices. Picking one unlocks the page and glides to the
 * matching anchor — the hero is a fork in the road, not a scrollable banner.
 */
export function Hero() {
  const lock = useCallback((on: boolean) => {
    const v = on ? "hidden" : "";
    document.documentElement.style.overflow = v;
    document.body.style.overflow = v;
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    lock(true);
    return () => lock(false);
  }, [lock]);

  const enter = useCallback(
    (id: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      lock(false);
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }),
      );
    },
    [lock],
  );

  return (
    <section
      id="top"
      className="relative h-screen min-h-[600px] w-full overflow-hidden bg-[#171717] text-white"
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
      {/* Extra darkening pass over the video. */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-black/45" />

      <div className="absolute right-[clamp(24px,4.2vw,60px)] top-[clamp(28px,2.4vw,38px)] z-10 flex items-center gap-[clamp(28px,3.9vw,56px)]">
        <button
          onClick={enter("waitlist")}
          className="lowercase text-[clamp(15px,1.25vw,18px)] leading-none whitespace-nowrap"
        >
          <span className="italic">get </span>early access
        </button>
        <button
          onClick={enter("problem")}
          className="flex h-[38px] items-center justify-center rounded-[42.5px] bg-white/[0.34] px-[26px] backdrop-blur-[14.15px] transition-colors hover:bg-white/[0.45]"
        >
          <span className="lowercase text-[clamp(15px,1.25vw,18px)] leading-none whitespace-nowrap">
            see how it works
          </span>
        </button>
      </div>

      <h1
        className="absolute bottom-[-0.12em] left-[clamp(24px,5.5vw,80px)] z-10 font-bold leading-none tracking-[-0.01em] text-[clamp(72px,12.5vw,180px)]"
        style={{ fontFamily: HELVETICA }}
      >
        OXAR.
      </h1>
    </section>
  );
}
