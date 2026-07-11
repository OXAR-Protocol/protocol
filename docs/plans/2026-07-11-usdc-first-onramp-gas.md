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

## The gas problem (the one real cost)

A wallet funded with **only USDC** can't pay its own Solana tx fee (~0.000005 SOL) + the
Jupiter-Lend position **ATA rent (~0.00204 SOL)**. Fresh wallets have no SOL.

- **Jupiter Ultra gasless is NOT enough** — Ultra covers *swaps*, but the Jupiter Lend
  **deposit** is a lend tx (via the SDK), not a swap. So the core deposit tx still needs gas.
- **Chosen solution: a minimal "gas top-up" relayer.** After the user funds USDC, a backend
  drips a tiny SOL amount (~0.003 SOL) to their wallet, so the **existing deposit path works
  unchanged**. Non-custodial (relayer only sends gas, never touches user funds). Simpler than
  fee-payer co-signing (no tx restructuring).

**Cost @ SOL ≈ $78:** ~0.003 SOL ≈ **$0.16–0.23 per new user** (mostly ATA rent, reclaimable).
**$100 float ≈ 400–600 onboardings** — months at current scale. Returning users (ATA exists)
cost only the ~$0.002 tx fee.

**Abuse guard:** drip only for an authenticated Privy user, once per wallet, rate-limited,
capped daily total. Worst case per abuse ≈ $0.16.

## Phases

- **P0 — Plan** (this doc). ✅
- **P1 — Sandbox funding prototype:** new `use-fund-and-buy` path using
  `useFiatOnramp({ destination: { asset: USDC_MINT, chain: "solana:mainnet", address }, defaultAmount, environment: 'sandbox' })`. Confirm Stripe routes in EU test-mode. No prod impact.
- **P2 — Gas top-up relayer:** `POST /api/gas-topup` — validates the authed user + that the
  wallet is SOL-starved + rate-limit, sends ~0.003 SOL from a hot wallet (the $100). Env:
  `RELAYER_SECRET_KEY` (server-only). Call it right after `fund()` resolves, before deposit.
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
