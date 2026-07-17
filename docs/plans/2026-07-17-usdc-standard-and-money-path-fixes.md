# USDC Standard + Money-Path Bug Fixes (one PR)

Date: 2026-07-17
Branch: eternaki/ukr-bonds-pivot-strategy (builds on the xStocks delist already staged)

## Why

Manual QA surfaced 4 bugs, and every one is a symptom of the same disease: the
deposit money-path **branches** — (direct / swap / bridge) × (USDC / USDT / USDG)
× (embedded / external) × (gas present / absent). Each branch is its own failure
surface. Collapsing to a single canonical dollar (**USDC**) shrinks the failure
matrix and is on-thesis: the door should be one tap, not twelve scenarios.

## SCOPE DECISION (2026-07-17)

Collapsing Jupiter Lend to USDC-only was **descoped** by the founder: keep USDT/USDG
as full products with the denomination picker. This PR ships the **bug fixes only**
(P0–P3). The P1 fix repairs the swap-path false "Not enough" regardless of
denomination, so the reported USDG failure is addressed without the collapse. The
canonical-USDC model below is kept as a recorded option for a later pass.

## Canonical model (the standard — DEFERRED, not in this PR)

- **One product dollar = USDC.** Yield products settle in USDC.
- **Jupiter Lend = USDC only.** Drop the `jupiter-lend-usdt` and `jupiter-lend-usdg`
  product variants. Justification: USDC already has the **best APY** of the three
  (4.19% vs USDT 3.10% vs USDG 2.91%), so the variants add confusion and a failure
  branch for zero user upside.
- **USDT / USDG survive only as PAY-WITH assets.** A user holding USDT/USDG can
  still deposit — we swap it to USDC under the hood (existing swap path). Nothing
  is taken away from the user; the *denomination selector* is what goes.
- **Deposit** always lands in USDC via ONE path. **Withdraw** returns USDC.
- **Legacy positions:** any already-open USDT/USDG position stays withdraw-able
  in-kind (no trapped funds), just hidden from new deposits.
- **Cross-chain** stays invisible plumbing under deposit (always bridge → USDC on
  Solana). No user-facing "swap" feature (off-thesis; a power-user tool).

### DECISION TO CONFIRM
Is there any place you want USDT/USDG kept as a *product* (not just pay-with)? On
current APY data there is none — recommend dropping both from Jupiter Lend. If a
future USDT/USDG market out-yields USDC we re-add it then.

## Work items (single PR)

### P0 — FUND SAFETY: bridge arrival can strand funds  ⟵ blocks any deploy
`use-pending-bridge.ts`: it calls `clearPending()` BEFORE `await deposit(...)`, so
a failed/interrupted post-bridge deposit loses the pending record → bridged USDC
sits in the wallet with no retry and no history entry (the reported bug).
- Deposit the **actually-arrived delta**, not the quote's `expected`.
- Only `clearPending()` AFTER the deposit tx confirms; on failure keep the record
  (claim-with-retry via a "depositing" marker, not a destructive clear) so the
  next focus/visit retries.
- Add a test: arrival + deposit-fails → pending survives → retry deposits.

### P1 — MAX / swap-guard false "Not enough" (bugs 1 & 2, same root)
- `pay-with-field.tsx setMax`: floor to base units (never round UP past balance),
  drop `toPrecision(6)` rounding.
- `use-universal-deposit.ts`: clamp `payBase` to `maxSpend` instead of throwing on
  a sub-unit overage (mirror the bridge path which already clamps).
- `errors.ts:91`: stop hard-coding "USDC" — surface the actual pay-asset symbol.

### P2 — delist AMDx (volatile liquidity)
Add AMDx to the JPMx/Vx/NFLXx delist (it hit >9% impact at $5 in QA). Remove from
`XSTOCKS` + its `asset-info` entry.

### P3 — stock icons blank in grid
Root cause: `financialmodelingprep.com/image-stock/*.png` returns HTTP 502 (keyless
endpoint dead) with a tiny body that decodes without firing `onError` → monogram
fallback never triggers. Fix: switch the logo source to a reliable one (Jupiter
token-list `logoURI` by mint, or a working CDN) and/or harden `AssetIcon` to treat
a broken/oversmall image as failure.

### Collapse to USDC standard
- `jupiter.ts` / `registry.ts`: remove usdt/usdg providers from the live registry
  (keep the factory for future re-add).
- `group-views.ts` + Jupiter Lend UI: drop the denomination picker; single USDC card.
- Confirm withdraw path returns USDC; legacy USDT/USDG positions still withdraw-able.

## Test strategy
- Unit: setMax floor, payBase clamp, errors symbol, bridge retry-on-fail.
- `yarn test` green + `yarn sim` (money-path build+simulate) green (delist makes
  the xStocks sim rows honest).
- Manual smoke (small $) after: direct/swap deposit at MAX, bridge from Base with
  a forced deposit failure → confirm retry, withdraw.

## Out of scope (note, don't silently drop)
- Gas sponsorship (0-SOL deposits) — separate effort.
- Re-adding delisted tickers when liquidity recovers (quote-sweep gate first).
