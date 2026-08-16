import type { Column, Row, Stat } from "@/components/pitch/slide-data";

/** Deck copy that is a list rather than a sentence. Every figure here comes from the
 *  investor memo (`app/investors/page.tsx`) — keep the two in sync, and add nothing
 *  to either that we cannot stand behind. */

/** 04 — why each existing door is half shut. */
export const OPTIONS: Column[] = [
  {
    label: "banks & neobanks",
    body: "4–5% at best, and the best usually needs a us bank account. everyone else gets a local-currency rate that inflation eats.",
  },
  {
    label: "crypto wallets",
    body: "0%. your dollars sit still, and you carry the seed phrase, the gas and the scams yourself.",
  },
  {
    label: "brokers",
    body: "treasuries, stocks, gold — real assets, gated by geography, paperwork and market hours.",
  },
];

/** 06 — market sizing, rebuilt 2026-08-16 on published figures rather than on a feel
 *  for how many people "have a savings instinct". Sized in idle dollars, because that
 *  is the unit the problem is measured in and the unit a reader can check.
 *  Sources: stablecoin supply $312B and Solana's $16.7B share (Q2 2026); yield-bearing
 *  stablecoins ~$11B, i.e. 4–5% of supply; 150M+ addresses hold a non-zero stablecoin
 *  balance (Artemis); 47M monthly active stablecoin users (Visa). The SOM figure is
 *  bottom-up from our own waitlist: the median volunteered deposit is $1,200. */
export const MARKET: Stat[] = [
  {
    figure: "$295B",
    label: "tam",
    note: "on-chain dollars earning nothing — about 95% of a $312b stablecoin market, held across 150m+ addresses",
  },
  {
    figure: "$15B",
    label: "sam",
    note: "the idle share of solana's $16.7b stablecoin supply — money we can reach without asking anyone to bridge",
  },
  {
    figure: "$3M",
    label: "som · year one",
    note: "two basis points of the idle solana float — about 1,400 savers at the $2,080 the average stablecoin address holds",
  },
];

/** 08 — the four surfaces of the app. */
export const PRODUCT: Column[] = [
  {
    label: "earn",
    body: "dollars into curated yield sources — jupiter lend, ondo usdy (us treasuries), maple (institutional credit), onre. 5–12% apy.",
  },
  {
    label: "own",
    body: "tokenized stocks and gold, held in your own wallet. real price exposure, on-chain p&l, no broker.",
  },
  {
    label: "fund it",
    body: "apple pay, card, or any crypto you already hold. gas is paid for you — you never need to buy sol.",
  },
  {
    label: "your pile",
    body: "every position in one view, with what it earned. withdraw any of it, any time, without asking us.",
  },
];

/** 09 — the money path. */
export const STEPS: string[] = [
  "sign in with an email. a wallet is created for you — no seed phrase to write down.",
  "fund it with apple pay, a card, or crypto you already hold.",
  "the money moves straight from your wallet into an audited protocol. the position is yours.",
];

/** 11 — how we make money. Rewritten 2026-08-16: the previous version promised a 10%
 *  performance fee and did the arithmetic off it. That model cannot exist here — see
 *  the second row — and the figures derived from it were therefore fiction. */
export const MODEL: Row[] = [
  {
    label: "the model",
    body: "0.25% on a conversion — buying or selling anything that has to be swapped, where dollars are one side of the trade. putting dollars into a dollar product is not a conversion and costs nothing.",
  },
  {
    label: "why not a cut of the yield",
    body: "the position sits in the user's own wallet on a public market, and we are not in the flow when they leave. a performance fee needs custody, and custody is the promise we sell.",
  },
  {
    label: "the price",
    body: "revolut charges 1.49% to convert and a 1.5–2.5% spread on top; phantom 0.85% hidden inside the quote; metamask 0.875%. we take 0.25% and name it as its own line before you sign — and today, before launch, we take 0%.",
  },
  {
    label: "what it earns",
    body: "revenue tracks turnover, not deposits — about $1 for every $400 swapped. money that sleeps earns us nothing, which is the honest cost of building for savers instead of traders.",
  },
];

/** 12 — traction, counted 2026-08-16 against the production database rather than
 *  remembered. "100+ signups / $75k intended" was the old pair and it flattered us:
 *  the $75k comes from ten people, and an investor who asks "out of how many?" and
 *  hears "ten" discounts everything else on the slide. Better we say it first. */
export const TRACTION: Stat[] = [
  { figure: "live", label: "on solana mainnet", note: "not a prototype — real money, from your own wallet" },
  { figure: "99+", label: "waitlist signups", note: "16 of them arrived through someone else's referral link, with nothing spent on acquisition" },
  { figure: "$75k", label: "intended deposits", note: "self-reported by the ten who named a figure — an intention, not a commitment. median $1,200" },
  { figure: "36", label: "assets", note: "5 yield sources, 28 tokenized stocks, gold and silver" },
];

/** 13 — nobody covers both halves. */
export const COMPETITION: Row[] = [
  {
    label: "revolut",
    body: "2.33% on dollars for a standard account, and up to 3.68% only on a paid tier — with capital at risk if the fund's nav falls. converting costs 1.49%, plus a 1.5–2.5% spread.",
  },
  {
    label: "us savings apps",
    body: "4–5%, the honest ceiling of a treasury rate — and they need a us bank account, which is the whole problem for everyone else.",
  },
  {
    label: "crypto wallets",
    body: "0% on the dollars sitting in them. phantom charges 0.85% to convert and hides it in the quote; metamask 0.875%.",
  },
  {
    label: "defi frontends",
    body: "the yield is real and the fee is often zero — but the interface is built for people who already speak the language.",
  },
  {
    label: "oxar",
    body: "5–12%, real assets, nothing held by us, and 0.25% to convert — a sixth of revolut, a third of phantom, printed on screen before you sign, and 0% until launch.",
    highlight: true,
  },
];

/** 15 — roadmap. */
export const ROADMAP: Row[] = [
  { label: "now", body: "live on mainnet in closed alpha: dollar yield, tokenized stocks, gold — end to end, from your own wallet. apple pay funding and gasless deposits both shipped." },
  { label: "next", body: "open the door. the product is built and the gate is an allowlist; what is missing is people, not features." },
  { label: "q4 2026", body: "assets from issuers jupiter cannot route today, and from a us broker-dealer whose liquidity beats most of our shelf. euro yield, once lend positions are priced in their own currency instead of assumed to be dollars." },
  { label: "2027", body: "native ios and android. more currencies than the dollar. geographic expansion through local partners." },
];

/** 16 — the two founders, matching the cap table on the investor page. */
export const TEAM: Column[] = [
  { label: "daniel lohachov", body: "product and engineering. founder of the prior oxar iteration; in the solana ecosystem since 2023." },
  { label: "anna tarapatska", body: "operations, legal and partnerships." },
];

/** 17 — the ask. */
export const ASK: Row[] = [
  { label: "not raising", body: "no traditional angel round. a crypto vc seed is planned for post-pmf, 12–18 months out." },
  { label: "raising instead", body: "grants, accelerators and hackathon prizes — $30k to carry the launch." },
  { label: "in motion", body: "solana foundation ecosystem grant, colosseum. partnerships with delora, privy and kora already live in the product." },
];
