# USDC-first on-ramp (Privy `useFiatOnramp`) + gas top-up relayer

**Status:** planned · 2026-07-11
**Owner:** @eternaki · daniel.l@oxar.app

## Why

Today the card buy funds **native SOL** (`useFundWallet`, legacy) then swaps SOL→USDC→product;
the funded SOL doubles as gas. Only providers: MoonPay + Coinbase. MoonPay geo-blocks
Ukraine + **Hungary** (our live test geo).

Move to **USDC-first** via Privy's newer aggregator hook **`useFiatOnramp`** (Stripe + Meld +
MoonPay + Coinbase, region-routed, 50+ countries; Stripe is out-of-the-box via Privy, no OXAR
Stripe account). Wins:

- **Stripe covers the EU incl. Hungary** → card buy works where MoonPay blocks it.
- Users hold **USDC = dollars**, matching the product ("dollar account"), no SOL volatility/slippage on the funding leg.
- Better routing + more countries; `useFiatOnramp` is the current API (legacy `useFundWallet` is being phased out).

**Not** a Ukraine fix: no provider serves UA without KYB (Stripe excludes UA entirely;
Coinbase/Meld need KYB → the OpCo). Ukraine stays crypto-deposit + `send` until the entity exists.

## The gas problem — solved by Privy's NATIVE "App pays" (no relayer, no infra)

A wallet funded with **only USDC** can't pay its own Solana tx fee (~0.000005 SOL) + the
Jupiter-Lend position **ATA rent (~0.00204 SOL)**. Fresh wallets have no SOL.

**Discovered (2026-07-11, in the Privy dashboard): Privy has NATIVE Solana gas sponsorship**
(Wallet infrastructure → Money movement → Gas management, powered by Grid). This makes the
whole relayer/Kora/Openfort track **moot**:

- Dashboard **Sponsorship mode = "App pays"** (NOT "User pays" — that's **EVM-only**; Solana
  can't pay gas in USDC). Set a monthly budget via **Manage credit** (currently "$0 of $0" =
  off) + payment method (Link already set).
- Code: pass **`sponsor: true`** on the embedded-wallet Solana send. NOTE: our embedded path
  today is "Privy signs → *we* broadcast" (`sendRawTransaction`), which BYPASSES sponsorship.
  Sponsorship requires **Privy** to broadcast — so switch the embedded send to Privy's
  `signAndSendTransaction({ sponsor: true })`. CLAUDE.md flagged embedded auto-send as flaky
  (older Privy) — re-verify on 3.33.1. External wallets: no sponsor (they pay their own gas).

**Cost:** OXAR sponsors ~$0.16/user (mostly ATA rent), billed by Privy (gas credits). Trivial
at our scale. **No hot wallet, no server route, no Kora node, no Openfort, no $100 float.**
(User-pays-in-USDC on Solana is impossible via Privy — EVM-only — so we sponsor; it's cheap.)

## Phases

- **P0 — Plan** (this doc). ✅
- **P1 — Sandbox funding prototype:** new `use-fund-and-buy` path using
  `useFiatOnramp({ destination: { asset: USDC_MINT, chain: "solana:mainnet", address }, defaultAmount, environment: 'sandbox' })`. Confirm Stripe routes in EU test-mode. No prod impact.
- **P2 — Gas via Privy native "App pays":** dashboard = App pays + budget (user action). Code =
  switch the embedded Solana send to Privy `signAndSendTransaction({ sponsor: true })` so Privy
  broadcasts + sponsors (our current "we broadcast" path bypasses it). Re-verify embedded
  auto-send reliability on 3.33.1. No relayer / Kora / Openfort / hot wallet.
- **P3 — Verify:** sandbox end-to-end (Stripe EU) → tiny mainnet smoke ($1–2) → confirm
  non-custodial + guards. Money-path checklist ([[reference_money_path_checklist]]).
- **P4 — Ship:** flip the buy flow to USDC-first; keep MoonPay + Stripe + Coinbase enabled
  (Privy routes). MoonPay stays as the non-EU/US fallback.

## Open questions

- `useFiatOnramp` is marked `@experimental` in the SDK — pin/verify behaviour.
- Does the drip need to cover 1 or 2 ATAs (direct USDC deposit = 1; swap-and-hold assets = more)?
  Size the drip for the worst case in scope (start with USDC/Jupiter Lend = 1 ATA).
- Hot-wallet key management + top-up alerting.

## Non-goals

- Ukraine card on-ramp (entity/KYB-gated — separate track).
- Dropping MoonPay (needed as fallback outside EU/US).
- Fee-payer co-signing (deferred; the drip is simpler and enough for MVP scale).
