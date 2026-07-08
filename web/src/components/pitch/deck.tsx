import Image from "next/image";

import { SlideFrame, Kicker } from "@/components/pitch/slide-frame";
import { HubDiagram } from "@/components/pitch/hub-diagram";

const C = "/pitch/collage";
// Landing-matched accent: italics, not colour (the violet lives in the collages).
const ACCENT = "italic";
const TITLE = "font-bold lowercase leading-[0.95] tracking-[-0.02em] text-white";
const SUB = "font-light lowercase text-white/55 leading-relaxed";

/** The OXAR pitch — a dark, scroll-snap deck on cut-out photo collages, typeset
 *  in the landing's DM Sans / lowercase / bracketed-label system. Copy is written
 *  to be accurate and defensible: no invented claims, no numbers we can't back. */
export function Deck() {
  return (
    <>
      {/* 01 — Title */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
        <Image src={`${C}/eyes.png`} alt="" fill priority sizes="100vw" className="object-contain opacity-30" />
        <div className="relative z-10">
          <Kicker>oxar</Kicker>
          <h1 className={`${TITLE} mt-6 text-[clamp(38px,7vw,96px)] tracking-[-0.03em]`}>
            where does your <span className={ACCENT}>money sleep?</span>
          </h1>
          <p className={`${SUB} mx-auto mt-7 max-w-md text-[clamp(15px,1.5vw,19px)]`}>
            a non-custodial savings app on solana. hold dollars, earn a real yield, and own
            global assets — without a bank, a broker, or any crypto know-how.
          </p>
        </div>
      </section>

      {/* 02 — Problem */}
      <SlideFrame
        kicker="the problem" variant="right"
        image={`${C}/dripping-dollar.png`} imageAlt="Money losing value"
        title={<>inflation quietly <span className={ACCENT}>eats</span> your savings.</>}
        sub="for most of the world, keeping money in the local currency means losing value year after year. the fix — holding dollars, and making them earn — is the hard part."
      />

      {/* 03 — Status quo: the old system */}
      <SlideFrame
        kicker="today's options" variant="left"
        image={`${C}/bank-phone.png`} imageAlt="The old banking system"
        title={<>the old system wasn&apos;t <span className={ACCENT}>built for this.</span></>}
        sub="a dollar savings account, where you can get one, pays close to nothing. a real return and global assets sit behind brokers, borders, minimums and paperwork most people never clear."
      />

      {/* 04 — Status quo: crypto */}
      <SlideFrame
        kicker="today's options" variant="right"
        image={`${C}/dollar-hook.png`} imageAlt="Dollar on a hook"
        title={<>crypto solved access — and made a <span className={ACCENT}>mess.</span></>}
        sub="the tools that actually reach dollars and yield are built for traders: seed phrases, gas, jargon, scams. powerful — but not something a normal person can use."
      />

      {/* 05 — Audience */}
      <SlideFrame
        kicker="who it's for" variant="left"
        image={`${C}/crowd-hats.png`} imageAlt="A crowd, one standing out"
        title={<>we start where the system serves people <span className={ACCENT}>worst.</span></>}
        sub="emerging-market savers, freelancers paid across borders, anyone who wants to hold and grow dollars without becoming a crypto trader. we begin with the underserved — and build for everyone."
      />

      {/* 06 — Solution (hero image) */}
      <SlideFrame
        kicker="the solution" variant="full"
        image={`${C}/sleeping-money.png`} imageAlt="Money asleep on a cloud"
        title={<>a dollar account that <span className={ACCENT}>actually earns.</span></>}
        sub="one simple, non-custodial account: hold dollars, earn a real yield, own treasuries, stocks and gold. sign in with email, pay with apple pay, withdraw anytime — in plain language."
      />

      {/* 07 — Hub */}
      <HubDiagram />

      {/* 08 — Grow / access */}
      <SlideFrame
        kicker="not just safe" variant="right"
        image={`${C}/coin-stack.png`} imageAlt="Coins growing"
        title={<>protect, then <span className={ACCENT}>grow.</span></>}
        sub="us treasuries, institutional credit, tokenized stocks and gold — global assets usually gated by geography or a us brokerage, now a few taps away."
      />

      {/* 09 — Trust / non-custodial (also carries the honest "we take no cut") */}
      <SlideFrame
        kicker="trust" variant="left"
        image={`${C}/torn-coin.png`} imageAlt="Everyone reaching for a piece of a coin"
        title={<>everyone wants a piece — we take <span className={ACCENT}>none.</span></>}
        sub="your money moves straight from your wallet into audited protocols. oxar holds nothing, runs no smart contract of its own, and takes no cut of your funds. nothing to hack, no keys to lose, withdraw anytime."
      />

      {/* 10 — Traction */}
      <section className="flex min-h-screen w-full flex-col justify-center bg-black px-6 py-16 md:px-16">
        <Kicker>traction</Kicker>
        <h2 className={`${TITLE} mt-4 max-w-3xl text-[clamp(30px,5vw,64px)]`}>
          a working product, <span className={ACCENT}>already live.</span>
        </h2>
        <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
          {[
            ["live", "on solana mainnet"],
            ["86", "waitlist signups"],
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
          bootstrapped two-person team · a real product on mainnet, not a prototype · every asset verified on-chain before it ships.
        </p>
      </section>

      {/* 11 — Why now */}
      <SlideFrame
        kicker="why now" variant="full"
        image={`${C}/crowd-world.png`} imageAlt="A crowd of the world"
        title={<>the timing is <span className={ACCENT}>now.</span></>}
        sub="tokenized real-world assets have crossed into the billions, cross-border and crypto payroll is mainstream, and card-to-crypto onramps finally work. the rails to give anyone a dollar account exist for the first time."
      />

      {/* 12 — Team + ask */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
        <Kicker>the team</Kicker>
        <h2 className={`${TITLE} mt-4 text-[clamp(30px,5vw,64px)]`}>
          two founders, one <span className={ACCENT}>live product.</span>
        </h2>
        <p className={`${SUB} mx-auto mt-6 max-w-lg text-[clamp(15px,1.5vw,19px)]`}>
          daniel lohachov & anna tarapatska — building from ukraine for the people banks and
          brokers underserve. shipped to mainnet in months, bootstrapped.
        </p>
        <p className="mt-8 text-[13px] lowercase text-white/50">oxar.app · daniel.l@oxar.app</p>
      </section>
    </>
  );
}
