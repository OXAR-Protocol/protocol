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

## The gas problem — solved via Kora (Openfort-hosted), user pays fee in USDC

A wallet funded with **only USDC** can't pay its own Solana tx fee (~0.000005 SOL) + the
Jupiter-Lend position **ATA rent (~0.00204 SOL)**. Fresh wallets have no SOL.

- **Jupiter Ultra is NOT enough** — Ultra covers *swaps*, not the Jupiter Lend deposit (a lend tx).
- **Chosen: Kora fee relayer (Solana Foundation standard), hosted by Openfort.** The deposit tx
  sets Kora as fee-payer; a USDC fee-payment instruction is bundled in; the user signs (Privy);
  Openfort's Kora co-signs + broadcasts. **The user pays the ~$0.16 fee in USDC** (from the
  funded amount) — Openfort fronts the SOL and is reimbursed in the same tx.
- Client SDK: `@solana/kora` (KoraClient) — `getPaymentInstruction` / `estimateTransactionFee` /
  `signAndSendTransaction`. Config allowlists our programs (System, Token, ATA, **Jupiter Lend**)
  + USDC as the fee token.

**Cost to OXAR: ~$0.**
- Openfort free tier = **2,000 tx/month** — well above our scale (wallets are created by Privy,
  not Openfort, so we only spend ops on gasless deposits).
- Network fee (~$0.16/user, mostly ATA rent) is **paid by the user in USDC**, not sponsored.
- **No hot-wallet float needed** in the pay-in-USDC model (Openfort fronts, USDC reimburses).
- Optional: OXAR could *sponsor* the fee (user sees a round $50) → ~$0.16/user; deferred.

**Why hosted (Openfort) over self-hosting Kora:** non-custodial in both (relayer only pays gas,
never touches user funds — worst-case breach = the tiny float, never user money). For a small
team the likeliest failure is us mismanaging a hot key / unpatched node; Openfort removes that.
Openfort needs only a dev account (gas relaying isn't regulated → no KYB). Reversible: migrate
to self-hosted Kora later (same client code) for independence/cost at scale.

## Phases

- **P0 — Plan** (this doc). ✅
- **P1 — Sandbox funding prototype:** new `use-fund-and-buy` path using
  `useFiatOnramp({ destination: { asset: USDC_MINT, chain: "solana:mainnet", address }, defaultAmount, environment: 'sandbox' })`. Confirm Stripe routes in EU test-mode. No prod impact.
- **P2 — Gasless deposit via Kora/Openfort:** integrate `@solana/kora` client. Build the
  Jupiter Lend deposit with Kora (Openfort) as fee-payer + a USDC fee-payment instruction; user
  signs (Privy); `signAndSendTransaction` to Openfort's Kora. User needs no SOL. Setup: a free
  Openfort dev account + its Kora endpoint/key in env (`NEXT_PUBLIC_OPENFORT_*` / server key).
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
