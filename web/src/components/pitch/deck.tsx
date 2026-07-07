import Image from "next/image";

import { SlideFrame } from "@/components/pitch/slide-frame";
import { HubDiagram } from "@/components/pitch/hub-diagram";

const C = "/pitch/collage";
const ACCENT = "text-[#8B5CF6]";

/** The OXAR pitch — a dark, scroll-snap deck built on cut-out photo collages.
 *  One idea per slide; the violet accent + torn-collage style run throughout. */
export function Deck() {
  return (
    <>
      {/* 01 — Title */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
        <Image src={`${C}/eyes.png`} alt="" fill priority sizes="100vw" className="object-contain opacity-30" />
        <div className="relative z-10">
          <p className="font-[family-name:var(--font-geist-mono)] text-[12px] uppercase tracking-[0.35em] text-white/50">
            OXAR
          </p>
          <h1 className="mt-6 font-[family-name:var(--font-instrument-serif)] text-[clamp(38px,7vw,96px)] leading-[0.98] tracking-[-0.03em] text-white">
            Where does your <span className={ACCENT}>money sleep?</span>
          </h1>
          <p className="mx-auto mt-7 max-w-md font-light text-[clamp(15px,1.5vw,19px)] leading-relaxed text-white/60">
            A non-custodial savings app on Solana. Wake your money up — earn, own real assets,
            withdraw anytime. No bank, no broker, no crypto knowledge.
          </p>
        </div>
      </section>

      {/* 02 — Problem */}
      <SlideFrame
        index="01" kicker="the problem" variant="right"
        image={`${C}/dripping-dollar.png`} imageAlt="Melting dollar"
        title={<>Your money is <span className={ACCENT}>melting.</span></>}
        sub="Billions of people save in currencies that lose value every month — and can't reach a dollar account. Every day it sits still, it shrinks."
      />

      {/* 03 — Status quo: the bank */}
      <SlideFrame
        index="02" kicker="today's options" variant="left"
        image={`${C}/bank-phone.png`} imageAlt="Old bank"
        title={<>The bank pays you <span className={ACCENT}>nothing</span> — if it lets you in.</>}
        sub="Local banks give ~0%, gate dollar accounts behind paperwork, and leave you on hold. For most of the world, that's the only option."
      />

      {/* 04 — Status quo: crypto */}
      <SlideFrame
        index="03" kicker="today's options" variant="right"
        image={`${C}/dollar-hook.png`} imageAlt="Dollar on a hook"
        title={<>Crypto looks like the answer — and feels like a <span className={ACCENT}>trap.</span></>}
        sub="Seed phrases, gas, jargon, scams. The tech that could save your money is built for traders, not for people."
      />

      {/* 05 — Audience */}
      <SlideFrame
        index="04" kicker="who it's for" variant="left"
        image={`${C}/crowd-hats.png`} imageAlt="A crowd, one standing out"
        title={<>Built for the <span className={ACCENT}>locked-out.</span></>}
        sub="The saver whose pension the bank won't grow. The teenager no broker will touch. The worker paid in a currency that shrinks. Everyone the system left behind."
      />

      {/* 06 — Solution (hero image) */}
      <SlideFrame
        index="05" kicker="the solution" variant="full"
        image={`${C}/sleeping-money.png`} imageAlt="Money asleep on a cloud"
        title={<>We wake your <span className={ACCENT}>money up.</span></>}
        sub="A dollar account that actually earns. Sign in with email, pay with Apple Pay, withdraw anytime — in plain language, with zero crypto to learn."
      />

      {/* 07 — Hub */}
      <HubDiagram />

      {/* 08 — Grow / access */}
      <SlideFrame
        index="07" kicker="not just safe" variant="right"
        image={`${C}/coin-stack.png`} imageAlt="Coins growing"
        title={<>Protect <span className={ACCENT}>and</span> grow.</>}
        sub="US Treasuries, institutional credit, tokenized stocks and gold — assets that were closed to you behind a US broker are now one tap away."
      />

      {/* 09 — Trust / non-custodial */}
      <SlideFrame
        index="08" kicker="trust" variant="left"
        image={`${C}/grasping-hands.png`} imageAlt="Hands reaching, never grabbing"
        title={<>We never <span className={ACCENT}>hold</span> your money.</>}
        sub="Funds move straight from your wallet into audited protocols. OXAR ships zero smart contracts of its own — nothing to hack, no keys to your money. Withdraw anytime."
      />

      {/* 10 — Traction */}
      <section className="flex min-h-screen w-full flex-col justify-center bg-black px-6 py-16 md:px-16">
        <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.28em] text-white/40">
          09 · traction
        </p>
        <h2 className="mt-4 max-w-3xl font-[family-name:var(--font-instrument-serif)] text-[clamp(30px,5vw,64px)] leading-[1] tracking-[-0.02em] text-white">
          Live on mainnet. <span className={ACCENT}>Already growing.</span>
        </h2>
        <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
          {[
            ["Live", "on Solana mainnet"],
            ["86", "waitlist signups"],
            ["$75K", "intended deposits"],
            ["30+", "assets — yield, stocks, gold"],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="font-[family-name:var(--font-instrument-serif)] text-[clamp(40px,6vw,76px)] leading-none text-[#8B5CF6]">{n}</p>
              <p className="mt-3 text-sm text-white/50">{l}</p>
            </div>
          ))}
        </div>
        <p className="mt-14 max-w-xl text-sm text-white/40">
          Two-person bootstrapped team · 160+ production PRs in three months · every asset verified on-chain before it ships.
        </p>
      </section>

      {/* 11 — Why now */}
      <SlideFrame
        index="10" kicker="why now" variant="full"
        image={`${C}/crowd-world.png`} imageAlt="A crowd of the world"
        title={<>A wave, right <span className={ACCENT}>on time.</span></>}
        sub="Tokenized real-world assets are maturing, crypto salaries are real, and Apple Pay → crypto just became frictionless. Billions want dollars that work."
      />

      {/* 12 — Model */}
      <SlideFrame
        index="11" kicker="business model" variant="right"
        image={`${C}/torn-coin.png`} imageAlt="Hands tearing a coin apart"
        title={<>We sell the key — <span className={ACCENT}>not your money.</span></>}
        sub="Everyone else takes a cut of your funds. We don't. A simple subscription for the premium account — clean, honest, and regulator-friendly."
      />

      {/* 13 — Team + ask */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black px-6 text-center">
        <div className="relative mb-10 h-[26vh] w-full max-w-md">
          <Image src={`${C}/handshake.png`} alt="" fill sizes="(max-width:768px) 100vw, 28rem" className="object-contain" />
        </div>
        <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.28em] text-white/40">
          the team
        </p>
        <h2 className="mt-4 font-[family-name:var(--font-instrument-serif)] text-[clamp(30px,5vw,64px)] leading-[1] tracking-[-0.02em] text-white">
          Two founders who <span className={ACCENT}>ship.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-lg font-light text-[clamp(15px,1.5vw,19px)] leading-relaxed text-white/60">
          Daniel Lohachov & Anna Tarapatska — Ukrainian, building the dollar account for the
          people our own banks failed. Live product, not a deck.
        </p>
        <p className="mt-8 font-[family-name:var(--font-geist-mono)] text-[13px] text-white/50">
          oxar.app · daniel.l@oxar.app
        </p>
      </section>
    </>
  );
}
