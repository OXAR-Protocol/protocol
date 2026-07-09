import Image from "next/image";

import { SlideFrame, Kicker } from "@/components/pitch/slide-frame";

const C = "/pitch/collage";
// Accent: italic + a violet tint, so it lifts off the running text on both bgs.
const ACCENT = "italic text-[#8B5CF6]";
const TITLE = "font-bold lowercase leading-[0.95] tracking-[-0.02em] text-white";
const SUB = "font-light lowercase text-white/55 leading-relaxed";

/** The OXAR pitch — a scroll-snap deck on cut-out photo collages, typeset in the
 *  landing's DM Sans / lowercase / bracketed-label system. First four slides are
 *  dark (the problem), then backgrounds alternate. Copy is tight and accurate. */
export function Deck() {
  return (
    <>
      {/* 01 — Title — dark */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
        <Image src={`${C}/eyes.png`} alt="" fill priority sizes="100vw" className="object-contain opacity-30" />
        <div className="relative z-10">
          <Kicker>oxar</Kicker>
          <h1 className={`${TITLE} mt-6 text-[clamp(38px,7vw,96px)] tracking-[-0.03em]`}>
            where does your <span className={ACCENT}>money sleep?</span>
          </h1>
          <p className={`${SUB} mx-auto mt-7 max-w-md text-[clamp(15px,1.5vw,19px)]`}>
            a non-custodial savings app on solana. hold dollars, earn real yield, own global
            assets — no bank, no broker, no crypto.
          </p>
        </div>
      </section>

      {/* 02 — Problem — dark */}
      <SlideFrame
        kicker="the problem" variant="right"
        image={`${C}/dripping-dollar.png`} imageAlt="Money losing value"
        title={<>inflation <span className={ACCENT}>eats</span> your savings.</>}
        sub="save in your local currency, and you lose value every year. holding dollars that actually earn is the hard part."
      />

      {/* 03 — Status quo: the old system (hands "hold" the text) — dark */}
      <SlideFrame
        kicker="today's options" variant="center"
        image={`${C}/grasping-hands.png`} imageAlt="Hands holding money out of reach"
        title={<>your money is <span className={ACCENT}>held back.</span></>}
        sub="dollar accounts pay next to nothing. real yield and global assets sit behind brokers, borders and paperwork."
      />

      {/* 04 — Status quo: crypto — dark */}
      <SlideFrame
        kicker="today's options" variant="right"
        image={`${C}/dollar-hook.png`} imageAlt="Dollar on a hook"
        title={<>crypto is a <span className={ACCENT}>trap.</span></>}
        sub="the tools that reach dollars and yield are built for traders — seed phrases, gas, jargon, scams. not for normal people."
      />

      {/* 05 — Audience — light */}
      <SlideFrame
        light kicker="who it's for" variant="left"
        image={`${C}/crowd-hats.png`} imageAlt="A crowd, one standing out"
        title={<>for the people the system <span className={ACCENT}>forgets.</span></>}
        sub="emerging-market savers, cross-border freelancers — anyone who wants dollars that grow, without becoming a crypto trader."
      />

      {/* 06 — Solution (hero image) — dark */}
      <SlideFrame
        kicker="the solution" variant="full"
        image={`${C}/sleeping-money.png`} imageAlt="Money asleep on a cloud"
        title={<>a dollar account that <span className={ACCENT}>actually earns.</span></>}
        sub="one non-custodial account: hold dollars, earn yield, own treasuries, stocks and gold. email sign-in, apple pay, withdraw anytime."
      />

      {/* 07 — Hub — light */}
      <SlideFrame
        light kicker="one account" variant="full"
        image={`${C}/microphones.png`} imageAlt="Microphones labelled yield, rwa, gold, bonds, stocks, credit"
        title={<>every way to grow, <span className={ACCENT}>in one place.</span></>}
        sub="yield, treasuries, credit, stocks, gold — every source in one account. one tap, no apps to juggle."
      />

      {/* 08 — Grow / access — dark */}
      <SlideFrame
        kicker="not just safe" variant="right"
        image={`${C}/coin-stack.png`} imageAlt="Coins growing"
        title={<>protect, then <span className={ACCENT}>grow.</span></>}
        sub="us treasuries, credit, stocks and gold — assets usually gated by geography or a broker, now a few taps away."
      />

      {/* 09 — Trust / non-custodial — light */}
      <SlideFrame
        light kicker="trust" variant="left"
        image={`${C}/torn-coin.png`} imageAlt="Everyone reaching for a piece of a coin"
        title={<>everyone wants a piece — we take <span className={ACCENT}>none.</span></>}
        sub="funds move straight from your wallet into audited protocols. oxar holds nothing and takes no cut. nothing to hack, no keys to lose."
      />

      {/* 10 — Traction — dark */}
      <section className="flex min-h-screen w-full flex-col justify-center bg-black px-6 py-16 md:px-16">
        <Kicker>traction</Kicker>
        <h2 className={`${TITLE} mt-4 max-w-3xl text-[clamp(30px,5vw,64px)]`}>
          a working product, <span className={ACCENT}>already live.</span>
        </h2>
        <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
          {[
            ["live", "on solana mainnet"],
            ["100+", "waitlist signups"],
            ["$75k", "intended deposits"],
            ["30+", "assets — yield, stocks, gold"],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="font-bold leading-none text-white text-[clamp(40px,6vw,76px)]">{n}</p>
              <p className="mt-3 text-sm lowercase text-white/50">{l}</p>
            </div>
          ))}
        </div>
        <p className="mt-14 max-w-xl text-sm lowercase text-white/40">
          bootstrapped two-person team · live on mainnet, not a prototype.
        </p>
      </section>

      {/* 11 — Why now — light */}
      <SlideFrame
        light kicker="why now" variant="full"
        image={`${C}/crowd-world.png`} imageAlt="A crowd of the world"
        title={<>the timing is <span className={ACCENT}>now.</span></>}
        sub="tokenized assets crossed into the billions, crypto payroll is mainstream, card-to-crypto onramps finally work. the rails exist for the first time."
      />

      {/* 12 — Team + ask — dark */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
        <Kicker>the founder</Kicker>
        <h2 className={`${TITLE} mt-4 text-[clamp(30px,5vw,64px)]`}>
          one founder, one <span className={ACCENT}>live product.</span>
        </h2>
        <p className={`${SUB} mx-auto mt-6 max-w-lg text-[clamp(15px,1.5vw,19px)]`}>
          daniel lohachov — building from ukraine. shipped a live product to mainnet in
          months, solo and bootstrapped.
        </p>
        <p className="mt-8 text-[13px] lowercase text-white/50">oxar.app · daniel.l@oxar.app</p>
      </section>
    </>
  );
}
