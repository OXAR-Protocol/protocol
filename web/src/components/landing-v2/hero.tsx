import { HELVETICA } from "./fonts";

/** Dark full-bleed intro plaque — giant wordmark anchored bottom-left. */
export function Hero() {
  return (
    <section
      id="top"
      className="relative h-screen min-h-[600px] w-full overflow-hidden bg-[#171717] text-white"
    >
      {/* Same hero clip the live site uses, dimmed under the wordmark. */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
        style={{
          opacity: 0.22,
          maskImage:
            "radial-gradient(ellipse 85% 75% at 50% 45%, black, transparent)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 75% at 50% 45%, black, transparent)",
        }}
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      <div className="absolute right-[clamp(24px,4.2vw,60px)] top-[clamp(28px,2.4vw,38px)] z-10 flex items-center gap-[clamp(28px,3.9vw,56px)]">
        <a
          href="#waitlist"
          className="lowercase text-[clamp(15px,1.25vw,18px)] leading-none whitespace-nowrap"
        >
          <span className="italic">get </span>early access
        </a>
        <a
          href="#how-it-works"
          className="flex h-[38px] items-center justify-center rounded-[42.5px] bg-white/[0.34] px-[26px] backdrop-blur-[14.15px] transition-colors hover:bg-white/[0.45]"
        >
          <span className="lowercase text-[clamp(15px,1.25vw,18px)] leading-none whitespace-nowrap">
            see how it works
          </span>
        </a>
      </div>

      <h1
        className="absolute bottom-[-0.12em] left-[clamp(24px,5.5vw,80px)] z-10 font-bold leading-none tracking-[-0.01em] text-[clamp(72px,12.5vw,180px)]"
        style={{ fontFamily: HELVETICA }}
      >
        OXAR.
      </h1>

      {/* Scroll affordance — makes it obvious the hero is a door, not a wall. */}
      <a
        href="#problem"
        className="group absolute bottom-[clamp(20px,2.4vw,32px)] right-[clamp(24px,4.2vw,60px)] z-10 flex items-center gap-3"
      >
        <span className="lowercase text-[11px] tracking-[0.18em] text-white/45 transition-colors group-hover:text-white/80">
          scroll · where your money sleeps
        </span>
        <span className="relative h-9 w-px overflow-hidden bg-white/20">
          <span className="absolute inset-x-0 top-0 h-3 animate-[scrollcue_1.8s_ease-in-out_infinite] bg-white" />
        </span>
      </a>
    </section>
  );
}
