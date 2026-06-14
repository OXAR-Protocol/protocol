import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OXAR.",
};

/**
 * Figma "1 плашка" (node 187:2) — minimal hero plaque.
 * Dark canvas, giant "OXAR." anchored bottom-left, with a top-right
 * "get early access" label and a translucent "see how it works" pill.
 */
export default function PlashkaPage() {
  return (
    <main
      className={`${dmSans.className} relative min-h-screen w-full overflow-hidden bg-[#171717] text-white`}
    >
      {/* Top-right controls */}
      <div className="absolute right-[clamp(24px,4.2vw,60px)] top-[clamp(28px,2.4vw,38px)] flex items-center gap-[clamp(28px,3.9vw,56px)]">
        <p className="lowercase text-[clamp(15px,1.25vw,18px)] leading-none whitespace-nowrap">
          <span className="italic">get </span>early access
        </p>
        <button
          type="button"
          className="flex h-[38px] items-center justify-center rounded-[42.5px] bg-white/[0.34] px-[26px] backdrop-blur-[14.15px] transition-colors hover:bg-white/[0.45]"
        >
          <span className="lowercase text-[clamp(15px,1.25vw,18px)] leading-none whitespace-nowrap">
            see how it works
          </span>
        </button>
      </div>

      {/* Giant wordmark, bottom-left */}
      <h1
        className="absolute bottom-[-0.12em] left-[clamp(24px,5.5vw,80px)] font-bold leading-none tracking-[-0.01em] text-[clamp(72px,12.5vw,180px)]"
        style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
      >
        OXAR.
      </h1>
    </main>
  );
}
