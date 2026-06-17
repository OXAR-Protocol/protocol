# Background cross-chain bridge — confirm once, credit in the background

**Date:** 2026-06-17
**Status:** approved (brainstorm, variants 1 + 2)

## Problem

Paying with an EVM asset (e.g. USDT on Ethereum L1) bridges via Delora to USDC on
Solana, then deposits. The bridge can take several minutes (L1 finality), but the
UI **blocked** on arrival — the user sat on a "waiting for funds…" spinner for 5+
minutes. The slowness is the source chain (we can't make L1 fast); the fix is to
not trap the user.

## Decision

The user confirms once (signs the origin bridge tx); after that the deposit
finishes **in the background** and credits on arrival.

- `use-bridge-deposit.ts`: stop awaiting arrival/deposit in the foreground. After
  the origin tx is submitted + `savePending`, **return immediately**. (Approve +
  bridge-tx signing stay foreground — they need the wallet.)
- `use-pending-bridge.ts`: promoted from "reload recovery" to a **global watcher**.
  Picks up a newly-saved record same-tab via a `PENDING_EVENT` (localStorage
  `storage` events only fire cross-tab), polls Solana for arrival, deposits, and
  clears. Retries on the next focus/visit if a poll times out. Keyed by
  `originTxHash` to avoid double-processing; deposit is still claimed
  (loadPending → clearPending) before sending so tabs/reloads can't double-deposit.
- `pending.ts`: `savePending`/`clearPending` dispatch `PENDING_EVENT`.
- `(app)/layout.tsx`: mount `<PendingBridgeBanner/>` app-wide (was /yield-only) so
  the watcher runs on every page; removed the per-page copy.
- Success overlay (`yield-action-success.tsx`): a cross-chain buy shows "Bridging…
  — we'll finish the deposit automatically, you can keep browsing" instead of
  "Deposited", and hides "view your position" until it lands. `pending` flows
  DepositPanel → rail → asset-detail.

## Invariants

- Signing/sending of the bridge + the Solana deposit are unchanged — only **when**
  we stop blocking moved (foreground → background watcher).
- Funds are never lost: the pending record persists across reloads; the watcher
  finishes the deposit; the claim-before-deposit guard prevents double-deposit.
- L1 latency itself is unchanged — this is purely a non-blocking UX win. Steering
  users to faster chains (L2/Solana-USDC = instant) is a possible follow-up.
