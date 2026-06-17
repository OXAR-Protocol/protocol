# Deposit trust layer — confirm step + on-chain receipt

**Date:** 2026-06-17
**Status:** approved (brainstorm)

## Problem

Even with a working flow, the founder feels afraid to deposit real money. The fear
is a cluster (everything except "no way to start small"): **A** irreversibility of
the click, **B** opacity of where the money goes, **C** trust in OXAR, **D** protocol
risk. Today the deposit signs **instantly** on click — no "here's what will happen"
moment — which feeds A and B.

## Decision (Approach 1, minus the always-on trust strip)

Two reinforcing pieces around the money moment:

1. **Confirm step (deposit only).** Clicking buy/deposit no longer signs; it shows a
   review *inside the panel card* (`deposit-confirm.tsx`): you pay $X · you'll
   hold/get ≈$Y (net of swap) · swap cost (one-time) · route (instant/swap/bridge) ·
   where it goes (your own wallet / source name) · footer: "withdraw anytime · no
   lock · OXAR never holds your funds — your wallet signs it." Confirm / back. Wraps
   the existing `handleDeposit` — no money-path change. Addresses A + B (+ the
   "instant red" surprise: the swap cost is shown up front).

2. **On-chain receipt.** The success overlay (`yield-action-success.tsx`) gains
   "view your position" (→ /pile) and "on Solscan" (wallet account page). Proves it
   landed and is verifiable. Addresses B + C.

Withdraw keeps firing directly (the fear is about putting money *in*).

## Numbers verification (the "I'm instantly in the red" question)

Confirmed **correct accounting**, not a display bug:
- `invested` = real USDC spent on-chain (cost basis, from Helius history via
  `netInvestedFromSwaps`).
- `currentValue` = held tokens × live price.
- Small instant negatives (USDY −$0.0037, gold −$0.005) = the **swap spread** — a real
  one-time DEX cost of converting USDC → the asset. Stocks can show + when price
  moved enough to overcome it.
- Gas (SOL) is correctly excluded from USD P&L.
- The "yield" P&L the user saw is **Ondo USDY** (swap-and-hold), not Jupiter Lend —
  pure USDC lend has no swap and isn't attributed by the earnings engine yet.

The fix is expectation-setting (the confirm step's "swap cost" line), not math.

## Invariants

- Money path untouched: `useDeposit`/`useUniversalDeposit`/`useYieldActions`,
  `planWithdrawal`. Confirm only gates the existing call.
- Solscan link points to the **wallet** (not the tx) because the deposit hooks don't
  surface the signature; exposing it is a future read-only addition if wanted.
- Files < 200 lines.
