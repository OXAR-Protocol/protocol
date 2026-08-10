# Pitch deck rebuild — old structure, new design, new product

**Date:** 2026-08-10
**Problem:** the current `/pitch` (12 slides, `web/src/components/pitch/deck.tsx`) reads as a
mood board, not a pitch. Feedback from a reviewer: *"це не зовсім пітчдек… там нема
інформації потрібної для розуміння проєкту… якщо ти будеш у відео щось розповідати,
стане зрозуміліше — але просто закинути як дек, воно не спрацює."*

**Goal:** a deck that is legible **without narration**. Restore the investor-deck
structure the old `deck/deck.html` had (problem → market → solution → product → how it
works → model → traction → competition → roadmap → team → ask), keep the *new* visual
system (cut-out collage, DM Sans lowercase, bracketed kickers, black/white alternation,
violet italic accent), and fill it with the *current* product concept.

## Source of truth for facts

Everything factual comes from `web/src/app/investors/page.tsx` (the fact-checked investor
memo) — no invented numbers. Nothing that is not already claimed publicly gets added.

## What the current deck is missing

| Missing | Why it matters without a video |
|---|---|
| A one-line definition of what OXAR *is* | Slide 1 poses a question; nobody answers it |
| Market sizing (TAM/SAM/SOM) | Investors cannot size the bet |
| Product — what the app actually does | "one place for everything" is not a product |
| How it works — the money path | The non-custodial claim is unproven |
| Business model | The single most-asked question is unanswered |
| Competition | No reason to believe this is defensible |
| Roadmap | No sense of what happens after the demo |
| Ask | The deck does not say what it wants |

## Slide plan (17 slides)

Design column: `d` = dark, `l` = light; image = file in `web/public/pitch/collage/`.

### 01 · cover — `d` · eyes.png
- kicker `oxar`
- H: where does your **money sleep?**
- Sub: a non-custodial savings app on solana. hold dollars, earn real yield, own global
  assets — no bank, no broker, no crypto.
- Footer line (new): `investor deck · august 2026 · oxar.app`

### 02 · the one-liner — `l` · no image, type only *(NEW)*
Answers slide 1 immediately so the deck stands alone.
- kicker `what oxar is`
- H: a **dollar account** that earns — for people banks won't serve.
- Three chips: `non-custodial` · `live on solana mainnet` · `email sign-in, apple pay`
- Sub: you deposit from your own wallet, funds go straight into audited protocols, you
  hold the position. oxar never touches the money.

### 03 · the problem — `d` · dripping-dollar.png *(keep)*
- H: inflation **eats** your savings.
- Sub: save in your local currency and you lose value every year. holding dollars that
  actually earn is the hard part.

### 04 · today's options fail — `d` · grasping-hands.png *(rewrite: merge old 03+04, add a table)*
- kicker `today's options`
- H: every door is **half shut.**
- Three columns (fact-checked, from the investor memo):
  - `banks & neobanks` — 4–5% ceiling, and only with a us bank account
  - `crypto wallets` — 0%. your dollars sit still
  - `brokers` — stocks, gold, bonds gated by geography, kyc and market hours
- Kicker line under: and the tools that do reach yield are built for traders — seed
  phrases, gas, jargon.

### 05 · who it's for — `l` · crowd-hats.png *(keep)*
- H: for the people the system **forgets.**
- Sub: emerging-market savers, cross-border freelancers — anyone who wants dollars that
  grow, without becoming a crypto trader.

### 06 · market — `d` · crowd-world.png *(NEW — restores old TAM/SAM/SOM slide)*
- kicker `market`
- H: the savers are **already online.**
- Three stacked figures:
  - TAM `~50M` — people with a crypto wallet and a savings instinct
  - SAM `~5M` — crypto-paid earners, dao contributors, remote workers on stablecoins
  - SOM (year 1) `500–5,000 users · $1–10M TVL`
- Context line: 1.4B adults in emerging markets have no investment account at all.

### 07 · the solution — `d` · sleeping-money.png *(keep)*
- H: a dollar account that **actually earns.**
- Sub: one non-custodial account: hold dollars, earn yield, own treasuries, stocks and
  gold. email sign-in, apple pay, withdraw anytime.

### 08 · the product — `l` · microphones.png *(rewrite: name the four surfaces)*
Mirrors the old deck's "four surfaces, one protocol".
- kicker `the product`
- H: four things, **one account.**
  1. `earn` — usdc into curated yield sources. jupiter lend live, 5–12% apy
  2. `own` — tokenized treasuries (ondo usdy), stocks (xstocks), gold (xaut)
  3. `fund it` — apple pay, card, or any crypto. gas paid for you
  4. `your pile` — every position in one view. withdraw anytime
- **Open:** replace/pair the collage with real app screenshots (see Risks).

### 09 · how it works — `d` · no image, 3-step diagram *(NEW)*
The slide that makes "non-custodial" believable.
- kicker `how it works`
- H: your money never **passes through us.**
- Steps: `01 sign in with an email` → `02 fund with apple pay, card or crypto` →
  `03 funds move straight from your wallet into an audited protocol`
- Footer: oxar ships no smart contract of its own. nothing to hack, no keys for us to
  lose, no withdrawal to approve.

### 10 · trust — `l` · torn-coin.png *(keep)*
- H: everyone wants a piece — we take **none.**

### 11 · business model — `d` · coin-stack.png *(NEW — the biggest gap)*
Verbatim-honest, straight from the investor memo.
- kicker `business model`
- H: today we earn **nothing.** on purpose.
- Body: no performance fee, no deposit or withdrawal fee, no spread of our own. our terms
  say the same, and they are the version that binds us.
- The intended model: **10% of yield earned — on growth, never on principal.**
  - `$10M TVL @ 8%` → ~$80k/yr
  - `$100M TVL` → ~$800k/yr
  - breakeven ≈ `$26M TVL`
- Footer: none of it is implemented. at this stage "we take nothing" is worth more than
  the revenue.

### 12 · traction — `d` · type only *(keep the numbers, add what shipped)*
- H: a working product, **already live.**
- `live` on solana mainnet · `100+` waitlist signups · `$75k` intended deposits ·
  `30+` assets
- Shipped line: gasless deposits, apple-pay funding, english + ukrainian, a live
  portfolio — in months, bootstrapped.

### 13 · competition — `l` · bank-phone.png *(NEW — unused asset)*
- kicker `competition`
- H: nobody covers **both halves.**
- Four rows, two columns (`reach` / `trust`):
  - neobanks & savings apps — capped rate, us-gated, custodial
  - crypto wallets — global, but 0% and you're on your own
  - defi frontends — the yield is there, the ux is for traders
  - **oxar** — global access, real yield, real assets, and we hold nothing
- Footer: the defensible part is not the yield — it's who we serve and that they trust us.

### 14 · why now — `l` · crowd-world.png *(keep, sharpen)*
- H: the timing is **now.**
- Sub: tokenized rwa is maturing (ondo usdy $500M+, maple $1B+), crypto payroll is real
  (bitwage 150k+ workers, deel, toku), and card-to-crypto onramps finally work. the
  window is open 12–24 months before revolut and coinbase close it.

### 15 · roadmap — `d` · type only *(NEW)*
- H: from live, to **everywhere.**
- `now` mainnet: usdc yield + tokenized stocks and gold, end-to-end
- `aug 2026` public launch — apple pay deposits, polished onboarding
- `q4 2026` first tokenized bonds via a licensed broker partner; cross-chain deposits
- `2027` ios / android native. multi-currency stablecoins. geographic expansion

### 16 · team — `l` · type only — **DECISION NEEDED**
`handshake.png` ships with a baked-in transparency checkerboard, so it cannot be used as
a background — the slide is typographic.
- Option A (current deck): one founder — daniel lohachov, building from ukraine.
- Option B (investor memo + cap table): daniel lohachov — product & tech; anna
  tarapatska — operations, legal, partnerships.

### 17 · the ask — `l` · type only *(NEW)* — **DECISION NEEDED**
From the memo: not raising a traditional angel round; grants + accelerators + hackathon
prizes to fund launch (target $30k pre-launch); crypto vc seed post-pmf, 12–18 months out.
- Contact: `oxar.app · daniel.l@oxar.app · @eternaki`

## Implementation

`deck.tsx` is 142 lines and cannot absorb 5 data-heavy slides under the 200-line rule.

```
web/src/components/pitch/
  deck.tsx            composition only — imports and orders the 17 slides
  deck-content.ts     NEW — the copy that is a list (columns, rows, steps, figures)
  slide-data.tsx      NEW — one Shell + ColumnsSlide / RowsSlide / StepsSlide / StatsSlide
  slide-frame.tsx     the photo slides; its type helpers are now exported
```

`slide-data.tsx` reuses `kickerCls` / `subCls` from `slide-frame.tsx` — one type system,
no new styles. Dark/light alternation preserved slide by slide; the collage runs at 20%
behind dark data slides and 7% behind light ones, where the cut-outs are high-contrast.

## Risks

1. **No product screenshots.** The strongest legibility win would be real app shots on
   slide 08. `web/public/` has none, and `app.oxar.app` is allowlist-gated. Needs a
   capture pass, or slide 08 stays typographic.
2. **Team-slide contradiction** — the deck says "one founder", the investor page and the
   cap table say two. Whichever we choose, both surfaces must agree.
3. **Length.** 17 scroll slides is long for a scroll deck. If it needs to be shorter,
   slides 05 and 14 are the first to merge.
