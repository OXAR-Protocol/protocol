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

/** 06 — market sizing. */
export const MARKET: Stat[] = [
  { figure: "~50M", label: "tam", note: "people with a crypto wallet and a savings instinct" },
  { figure: "~5M", label: "sam", note: "crypto-paid earners, dao contributors, remote workers on stablecoins" },
  { figure: "500–5k", label: "som · year one", note: "active users, $1–10m in deposits" },
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
    body: "phantom takes 0.85% for the same swap and hides it in the quote; metamask 0.875%. we take a third of that and name it as its own line before you sign.",
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
  { figure: "99", label: "waitlist signups", note: "16 of them arrived through someone else's referral link" },
  { figure: "$1.2k", label: "median intended deposit", note: "from the 10 who volunteered a figure — $75k in total" },
  { figure: "36", label: "assets", note: "5 yield sources, 28 tokenized stocks, gold and silver" },
];

/** 13 — nobody covers both halves. */
export const COMPETITION: Row[] = [
  { label: "neobanks", body: "trusted and easy — but the rate is capped, the account is us-gated, and they hold your money." },
  { label: "crypto wallets", body: "global and non-custodial — but 0%, and you are on your own." },
  { label: "defi frontends", body: "the yield is real — but the interface is built for traders who already speak the language." },
  { label: "oxar", body: "global access, real yield, real assets — and we hold nothing.", highlight: true },
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
