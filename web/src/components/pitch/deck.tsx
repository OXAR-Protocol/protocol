import Image from "next/image";

import { ASK, COMPETITION, MARKET, MODEL, OPTIONS, PRODUCT, ROADMAP, STEPS, TEAM, TRACTION } from "@/components/pitch/deck-content";
import { ColumnsSlide, RowsSlide, StatsSlide, StepsSlide } from "@/components/pitch/slide-data";
import { SlideFrame, Kicker } from "@/components/pitch/slide-frame";

const C = "/pitch/collage";
// Accent: italic + a violet tint, so it lifts off the running text on both bgs.
const ACCENT = "italic text-[#8B5CF6]";
const TITLE = "font-bold lowercase leading-[0.95] tracking-[-0.02em] text-white";
const SUB = "font-light lowercase text-white/55 leading-relaxed";

/** The OXAR pitch — a scroll-snap deck on cut-out photo collages, typeset in the
 *  landing's DM Sans / lowercase / bracketed-label system. Structured to be read
 *  without narration: problem → market → solution → product → how it works → model →
 *  traction → competition → roadmap → team → ask. Figures come from the investor memo
 *  (`app/investors/page.tsx`); keep the two in sync. */
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
          <p className="mt-10 text-[13px] lowercase text-white/35">investor deck · august 2026 · oxar.app</p>
        </div>
      </section>

      {/* 02 — What OXAR is: answers the cover before anyone has to ask — light */}
      <section className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden bg-white px-6 py-16 md:px-16">
        <Image src={`${C}/bank-phone.png`} alt="A bank inside a phone" fill loading="eager" sizes="100vw" className="object-contain opacity-[0.07]" />
        <div className="relative z-10">
        <Kicker light>what oxar is</Kicker>
        <h2 className="mt-4 max-w-4xl font-bold lowercase leading-[0.95] tracking-[-0.02em] text-black text-[clamp(32px,5.5vw,72px)]">
          a dollar account that earns — for the people banks <span className={ACCENT}>won&apos;t serve.</span>
        </h2>
        <p className="mt-8 max-w-2xl font-light lowercase leading-relaxed text-black/60 text-[clamp(15px,1.5vw,20px)]">
          you sign in with an email, fund with apple pay or crypto, and the money goes straight
          from your own wallet into audited protocols. oxar never holds it, and today takes no
          cut of it.
        </p>
        <div className="mt-12 flex flex-wrap gap-3">
          {["non-custodial", "live on solana mainnet", "email sign-in · apple pay", "withdraw anytime"].map((chip) => (
            <span key={chip} className="rounded-full border border-black/15 px-4 py-2 text-[13px] lowercase text-black/60">
              {chip}
            </span>
          ))}
        </div>
        </div>
      </section>

      {/* 03 — Problem — dark */}
      <SlideFrame
        kicker="the problem" variant="right"
        image={`${C}/dripping-dollar.png`} imageAlt="Money losing value"
        title={<>inflation <span className={ACCENT}>eats</span> your savings.</>}
        sub="save in your local currency, and you lose value every year. holding dollars that actually earn is the hard part."
      />

      {/* 04 — Why every existing option is half shut — dark */}
      <ColumnsSlide
        kicker="today's options"
        title={<>every door is <span className={ACCENT}>half shut.</span></>}
        image={`${C}/grasping-hands.png`} imageAlt="Hands holding money out of reach"
        columns={OPTIONS}
        footer="and the tools that do reach real yield are built for traders — seed phrases, gas, jargon, scams."
      />

      {/* 05 — Audience — light */}
      <SlideFrame
        light kicker="who it's for" variant="left"
        image={`${C}/crowd-hats.png`} imageAlt="A crowd, one standing out"
        title={<>for the people the system <span className={ACCENT}>forgets.</span></>}
        sub="emerging-market savers, cross-border freelancers — anyone who wants dollars that grow, without becoming a crypto trader."
      />

      {/* 06 — Market sizing — light */}
      <StatsSlide
        light kicker="market"
        title={<>the dollars are <span className={ACCENT}>already here, asleep.</span></>}
        sub="we are not waiting on a behaviour change. the money is already on-chain, already in dollars, and already sitting still — the only thing missing is somewhere to put it that a normal person can use."
        image={`${C}/eye-through-clouds.jpg`}
        imageAlt="An eye and a hand pushing through a tear in a painted sky"
        imageBox="right" imagePos="center 42%" bodyMax="min(980px, 56%)"
        stats={MARKET}
        footer="sources: artemis and visa onchain analytics (supply, holders, active users), q2 2026. yield-bearing share is 2–6% depending on whose definition, so 95% idle is the conservative read. som is two basis points of the sam, cross-checked against the $2,080 an average stablecoin address holds."
      />

      {/* 07 — Solution (hero image) — dark */}
      <SlideFrame
        kicker="the solution" variant="full"
        image={`${C}/sleeping-money.png`} imageAlt="Money asleep on a cloud"
        title={<>a dollar account that <span className={ACCENT}>actually earns.</span></>}
        sub="one non-custodial account: hold dollars, earn yield, own treasuries, stocks and gold. email sign-in, apple pay, withdraw anytime."
      />

      {/* 08 — The product: four surfaces — light */}
      <ColumnsSlide
        light kicker="the product"
        title={<>four things, <span className={ACCENT}>one account.</span></>}
        image={`${C}/microphones.png`} imageAlt="Microphones labelled yield, rwa, gold, bonds, stocks, credit"
        columns={PRODUCT}
        footer="one tap each, no apps to juggle, nothing to learn about crypto."
      />

      {/* 09 — How it works: the money path — dark */}
      <StepsSlide
        kicker="how it works"
        title={<>your money never <span className={ACCENT}>passes through us.</span></>}
        steps={STEPS}
        footer="oxar ships no smart contract of its own — we sit on top of audited protocols. nothing to hack, no keys for us to lose, no withdrawal for us to approve."
      />

      {/* 10 — Trust / non-custodial — light */}
      <SlideFrame
        light kicker="trust" variant="left"
        image={`${C}/torn-coin.png`} imageAlt="Everyone reaching for a piece of a coin"
        title={<>everyone takes a piece — <span className={ACCENT}>we name ours.</span></>}
        sub="funds move straight from your wallet into audited protocols. oxar holds nothing — nothing to hack, no keys to lose. the one cut we take is 0.25% on a conversion, printed on the confirm screen before you sign (after launch — today it is 0%)."
      />

      {/* 11 — Business model — dark */}
      <RowsSlide
        kicker="business model"
        title={<>a quarter of a percent, <span className={ACCENT}>named before you sign.</span></>}
        image={`${C}/coin-stack.png`} imageAlt="Coins growing"
        rows={MODEL}
        footer="built, disclosed in the terms, and switched off behind two switches — neither of them set. the day we turn it on, nothing on screen moves except the line that names it."
      />

      {/* 12 — Traction — dark, full-bleed photograph under a scrim */}
      <StatsSlide
        kicker="traction"
        title={<>small numbers, <span className={ACCENT}>honestly counted.</span></>}
        image={`${C}/banknote-eyes.jpg`} imageAlt="Engraved eyes from banknotes of many countries" cover
        stats={TRACTION}
        footer="counted against the production database on 16 august 2026, not remembered. gasless deposits, apple-pay funding, a live portfolio, english and ukrainian — shipped in months, bootstrapped."
      />

      {/* 13 — Competition — dark */}
      <RowsSlide
        kicker="competition"
        title={<>nobody covers <span className={ACCENT}>both halves.</span></>}
        image={`${C}/note-mark.png`} imageAlt="A crumpled hundred-dollar note with the OXAR mark pressed into it"
        imageBox="right" bodyMax="min(1060px, 64%)"
        rows={COMPETITION}
        footer="the defensible part is not the yield — anyone can route to a protocol. it is who we serve, and that they trust us with the first dollar."
      />

      {/* 14 — Why now — light */}
      <SlideFrame
        light kicker="why now" variant="full"
        image={`${C}/crowd-world.png`} imageAlt="A crowd of the world"
        title={<>the timing is <span className={ACCENT}>now.</span></>}
        sub="tokenized assets crossed into the billions, crypto payroll is mainstream, card-to-crypto onramps finally work. the window is open 12–24 months before revolut and coinbase close it."
      />

      {/* 15 — Roadmap — dark */}
      <RowsSlide
        kicker="roadmap"
        title={<>the product is built. <span className={ACCENT}>now the people.</span></>}
        image={`${C}/children-pointing.png`} imageAlt="A child pointing at what's ahead"
        rows={ROADMAP}
      />

      {/* 16 — Team — light (type only: handshake.png ships with a baked-in checkerboard) */}
      <section className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden bg-black px-6 py-16 md:px-16">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] md:block">
          <Image src={`${C}/logo-chrome.png`} alt="The OXAR mark in chrome" fill sizes="46vw" className="object-contain" />
        </div>
        <div className="relative z-10 max-w-[min(1000px,58%)]">
        <Kicker>the team</Kicker>
        <h2 className="mt-4 max-w-3xl font-bold lowercase leading-[0.95] tracking-[-0.02em] text-white text-[clamp(30px,5vw,64px)]">
          two founders, one <span className={ACCENT}>live product.</span>
        </h2>
        <div className="mt-14 grid max-w-4xl gap-x-10 gap-y-10 sm:grid-cols-2">
          {TEAM.map((m) => (
            <div key={m.label} className="border-t border-white/10 pt-5">
              <p className="text-[15px] lowercase text-white">{m.label}</p>
              <p className="mt-3 font-light lowercase leading-relaxed text-white/60 text-[clamp(14px,1.3vw,17px)]">
                {m.body}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-14 max-w-2xl text-sm lowercase text-white/40">
          building from ukraine, bootstrapped — a live product on mainnet in months.
        </p>
        </div>
      </section>

      {/* 17 — The ask + contact — dark */}
      <RowsSlide
        kicker="the ask"
        title={<>funding the launch, <span className={ACCENT}>not the runway.</span></>}
        rows={ASK}
        footer="oxar.app · daniel.l@oxar.app · @eternaki"
      />
    </>
  );
}
