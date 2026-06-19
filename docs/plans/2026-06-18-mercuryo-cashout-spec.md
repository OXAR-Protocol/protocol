# Cash-out to card via Mercuryo — spec

**Date:** 2026-06-18
**Status:** spec / blocked on Mercuryo partner onboarding

## Goal (the "magic")

In-app: tap **Cash out** → enter amount → confirm → fiat lands on the user's card,
in minutes. The user never leaves the OXAR app visually; no crypto knowledge needed.

## The achievable UX (and the one compliance reality)

What we render (OXAR UI):
1. **Cash out** entry (on the asset page Sell tab and/or wallet).
2. Amount entry in OUR field (USD/EUR), with the live value of the user's position.
3. A confirm step (reuse the "no surprises" review pattern).

What Mercuryo renders (its embedded widget — **iframe inside our sheet**):
4. **KYC** (Mercuryo via SumSub; light-KYC, no docs, up to €699).
5. **Card entry** + the crypto-receive address.

> We MUST NOT build our own card form. Card + KYC live on Mercuryo's surface by
> design — that's what keeps OXAR out of PCI / payment-services regulation and
> non-custodial. "Magic" = the iframe makes it feel in-app, not that we collect cards.

## Flow (mapped to what we already have)

```
position ──Sell/withdraw──▶ USDC in user's wallet     (EXISTS: Sell tab / useSend)
          ──open Mercuryo sell widget (iframe), pre-filled amount + asset──▶
              KYC (if needed) → pick card → Mercuryo shows receive address
          ──user signs the USDC send to that address──▶  (EXISTS: useSend)
              Mercuryo converts → Visa Direct / Mastercard Send → card in minutes
```

- Crypto must reach Mercuryo within **6 hours** or the sell auto-cancels (credits
  back as crypto). Solana settles in seconds, so fine.
- Payout: card (EUR/USD) via Visa Direct / Mastercard Send (minutes), or SEPA Instant.

## Integration (technical)

- **Two modes:** redirect (`exchange.mercuryo.io`) or **iframe** (`widget.mercuryo.io`).
  Use iframe in a bottom-sheet for the in-app feel.
- **Required credentials (from the partner account):** `widget_id` (public) +
  **secret key** (server-only) used to compute the request **signature**.
- **Server route** `/api/mercuryo-sign` — computes the signature (Mercuryo's scheme,
  to confirm: SHA-512 of the receive address + secret) so the secret never hits the
  client. Mirrors how `/api/bridge-quote` keeps the Delora key server-side.
- **Env:** `NEXT_PUBLIC_MERCURYO_WIDGET_ID`, `MERCURYO_SECRET`. The Cash-out button is
  **hidden unless the widget_id is set** → no broken UX before go-live (same pattern as
  other provider-gated features).
- Params to pre-fill (confirm exact names in Widget Parameters): `type=sell`,
  `currency` (USDC), `network` (SOLANA), `amount`/`fiat_amount`, `fiat_currency`,
  `address` (return), `signature`, `redirect_url`.

## Prerequisites / BLOCKERS (why this can't ship/test today)

1. **Mercuryo off-ramp is disabled by default** — must be enabled by their integration
   manager → a **partner account = KYB = a legal entity**. OXAR has no OpCo yet.
2. **No credentials = non-functional.** Can't be built-and-tested without `widget_id` +
   `secret`. Building the signature blind is untestable and risky.

## Open questions to confirm with Mercuryo at onboarding

- Onboarding for a no-/early-OpCo team (ФОП/individual?) — or full entity required.
- **USDC-on-Solana sell** specifically supported.
- **Ukraine** card payout: currency (EUR/USD vs UAH), limits, fees (~0.95–3.95%).
- Exact signature algorithm + sell widget parameter names.

## Phased plan

- **Phase 0 (blocked on user):** apply to Mercuryo for a partner account, get off-ramp
  enabled + `widget_id`/`secret`. This is the KYB/entity step.
- **Phase 1 (build, once keys exist):** `/api/mercuryo-sign` + a `CashOutSheet`
  (iframe), wired to env, gated/hidden without keys. Reuse Sell→USDC + `useSend`.
- **Phase 2:** live test on a real device (Ukraine + an EU card), confirm timing/fees.

## Fallback if no entity (not "magic")

Plain **redirect to Mercuryo's consumer sell page** — zero account/KYB, but the user
leaves the app and nothing is pre-filled. Ship only if Phase 0 isn't possible.
