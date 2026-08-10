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
    body: "dollars into curated yield sources — jupiter lend, ondo usdy (us treasuries), maple (institutional credit). 5–12% apy.",
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

/** 11 — the fee math, stated as intent, not as income. */
export const MODEL: Row[] = [
  { label: "today", body: "$0. no performance fee, no deposit or withdrawal fee, no spread of our own — and our terms of use say the same." },
  { label: "the intent", body: "10% of the yield earned. on growth, never on principal. nothing is implemented; switching it on is a decision we have not made." },
  { label: "$10m deposits", body: "at 8% average apy — roughly $80k a year." },
  { label: "$100m deposits", body: "roughly $800k a year. profitability lands around $26m." },
];

/** 12 — traction. */
export const TRACTION: Stat[] = [
  { figure: "live", label: "on solana mainnet" },
  { figure: "100+", label: "waitlist signups" },
  { figure: "$75k", label: "intended deposits" },
  { figure: "30+", label: "assets — yield, stocks, gold" },
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
  { label: "now", body: "live on mainnet: dollar yield plus tokenized stocks and gold, end to end, from your own wallet." },
  { label: "aug 2026", body: "public launch — apple pay deposits, polished onboarding, english and ukrainian." },
  { label: "q4 2026", body: "first tokenized bonds via a licensed broker partner. more sources, cross-chain deposits fully wired." },
  { label: "2027", body: "native ios and android. multi-currency stablecoins. geographic expansion through local partners." },
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
