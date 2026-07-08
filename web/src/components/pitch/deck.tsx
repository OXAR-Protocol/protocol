import Image from "next/image";

import { SlideFrame, Kicker } from "@/components/pitch/slide-frame";
import { HubDiagram } from "@/components/pitch/hub-diagram";

const C = "/pitch/collage";
// Landing-matched accent: italics, not colour (the violet lives in the collages).
const ACCENT = "italic";
const TITLE = "font-bold lowercase leading-[0.95] tracking-[-0.02em] text-white";
const SUB = "font-light lowercase text-white/55 leading-relaxed";

/** The OXAR pitch — a dark, scroll-snap deck on cut-out photo collages, typeset
 *  in the landing's DM Sans / lowercase / bracketed-label system. */
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
            a non-custodial savings app on solana. wake your money up — earn, own real assets,
            withdraw anytime. no bank, no broker, no crypto knowledge.
          </p>
        </div>
      </section>

      {/* 02 — Problem */}
      <SlideFrame
        kicker="the problem" variant="right"
        image={`${C}/dripping-dollar.png`} imageAlt="Melting dollar"
        title={<>your money is <span className={ACCENT}>melting.</span></>}
        sub="billions of people save in currencies that lose value every month — and can't reach a dollar account. every day it sits still, it shrinks."
      />

      {/* 03 — Status quo: the bank */}
      <SlideFrame
        kicker="today's options" variant="left"
        image={`${C}/bank-phone.png`} imageAlt="Old bank"
        title={<>the bank pays you <span className={ACCENT}>nothing</span> — if it lets you in.</>}
        sub="local banks give ~0%, gate dollar accounts behind paperwork, and leave you on hold. for most of the world, that's the only option."
      />

      {/* 04 — Status quo: crypto */}
      <SlideFrame
        kicker="today's options" variant="right"
        image={`${C}/dollar-hook.png`} imageAlt="Dollar on a hook"
        title={<>crypto looks like the answer — and feels like a <span className={ACCENT}>trap.</span></>}
        sub="seed phrases, gas, jargon, scams. the tech that could save your money is built for traders, not for people."
      />

      {/* 05 — Audience */}
      <SlideFrame
        kicker="who it's for" variant="left"
        image={`${C}/crowd-hats.png`} imageAlt="A crowd, one standing out"
        title={<>built for the <span className={ACCENT}>locked-out.</span></>}
        sub="the saver whose pension the bank won't grow. the teenager no broker will touch. the worker paid in a currency that shrinks. everyone the system left behind."
      />

      {/* 06 — Solution (hero image) */}
      <SlideFrame
        kicker="the solution" variant="full"
        image={`${C}/sleeping-money.png`} imageAlt="Money asleep on a cloud"
        title={<>we wake your <span className={ACCENT}>money up.</span></>}
        sub="a dollar account that actually earns. sign in with email, pay with apple pay, withdraw anytime — in plain language, with zero crypto to learn."
      />

      {/* 07 — Hub */}
      <HubDiagram />

      {/* 08 — Grow / access */}
      <SlideFrame
        kicker="not just safe" variant="right"
        image={`${C}/coin-stack.png`} imageAlt="Coins growing"
        title={<>protect <span className={ACCENT}>and</span> grow.</>}
        sub="us treasuries, institutional credit, tokenized stocks and gold — assets that were closed to you behind a us broker are now one tap away."
      />

      {/* 09 — Trust / non-custodial */}
      <SlideFrame
        kicker="trust" variant="left"
        image={`${C}/grasping-hands.png`} imageAlt="Hands reaching, never grabbing"
        title={<>we never <span className={ACCENT}>hold</span> your money.</>}
        sub="funds move straight from your wallet into audited protocols. oxar ships zero smart contracts of its own — nothing to hack, no keys to your money. withdraw anytime."
      />

      {/* 10 — Traction */}
      <section className="flex min-h-screen w-full flex-col justify-center bg-black px-6 py-16 md:px-16">
        <Kicker>traction</Kicker>
        <h2 className={`${TITLE} mt-4 max-w-3xl text-[clamp(30px,5vw,64px)]`}>
          live on mainnet. <span className={ACCENT}>already growing.</span>
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
          two-person bootstrapped team · 160+ production prs in three months · every asset verified on-chain before it ships.
        </p>
      </section>

      {/* 11 — Why now */}
      <SlideFrame
        kicker="why now" variant="full"
        image={`${C}/crowd-world.png`} imageAlt="A crowd of the world"
        title={<>a wave, right <span className={ACCENT}>on time.</span></>}
        sub="tokenized real-world assets are maturing, crypto salaries are real, and apple pay → crypto just became frictionless. billions want dollars that work."
      />

      {/* 12 — Model */}
      <SlideFrame
        kicker="business model" variant="right"
        image={`${C}/torn-coin.png`} imageAlt="Hands tearing a coin apart"
        title={<>we sell the key — <span className={ACCENT}>not your money.</span></>}
        sub="everyone else takes a cut of your funds. we don't. a simple subscription for the premium account — clean, honest, and regulator-friendly."
      />

      {/* 13 — Team + ask */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
        <div className="relative mb-10 h-[26vh] w-full max-w-md">
          <Image src={`${C}/handshake.png`} alt="" fill sizes="(max-width:768px) 100vw, 28rem" className="object-contain" />
        </div>
        <Kicker>the team</Kicker>
        <h2 className={`${TITLE} mt-4 text-[clamp(30px,5vw,64px)]`}>
          two founders who <span className={ACCENT}>ship.</span>
        </h2>
        <p className={`${SUB} mx-auto mt-6 max-w-lg text-[clamp(15px,1.5vw,19px)]`}>
          daniel lohachov & anna tarapatska — ukrainian, building the dollar account for the
          people our own banks failed. live product, not a deck.
        </p>
        <p className="mt-8 text-[13px] lowercase text-white/50">oxar.app · daniel.l@oxar.app</p>
      </section>
    </>
  );
}
