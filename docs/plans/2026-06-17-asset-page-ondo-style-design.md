# Asset page — Ondo-style two-column layout

**Date:** 2026-06-17
**Status:** approved (brainstorm)

## Goal

Reshape the `/asset/[id]` detail page to resemble Ondo Global Markets' asset page:
a big area chart with range tabs, a **sticky action rail** beside it carrying a
**Buy / Sell** toggle, and curated "about" + live stats below. No new money-path
logic — we reuse the existing buy (`DepositPanel`) and sell/withdraw
(`handleExit` → `useYieldActions`) flows, only re-laid-out.

## Scope (variant A — only what we can actually pull)

In:
- Two-column responsive layout (`lg:grid-cols-[1fr_360px]`); stacks on mobile.
- Sticky right rail: segmented **Buy / Sell** toggle. Buy = `DepositPanel`;
  Sell = `YieldAmountField` (disabled with "nothing to sell yet" when no position).
- Ondo-style chart: soft gradient area fill under the line, taller; keep the
  working 24h/7d/30d/90d ranges (Jupiter datapi). Green/red for price assets,
  violet for yield.
- Live statistics shown in the chart header: period change %, low–high range.
- Curated "what it is" + facts grid + "your position" (unchanged).

Out (not applicable / not available to us):
- Session limits, tokenholder protections, mint/redemption, legal documents
  (Ondo's regulated-product specifics). No placeholders.

## Components

- `sparkline.tsx` — add optional `fill` prop: a vertical `currentColor` gradient
  area under the line (backward compatible; default off). Unique gradient id via
  `useId`.
- `asset-chart.tsx` — taller chart box, `fill`; header shows `±change% · low–high
  · range` as the live "statistics".
- `asset-action-rail.tsx` — NEW. Sticky card with Buy/Sell toggle wrapping
  `DepositPanel` and the sell/withdraw `YieldAmountField` + success overlay.
  Sell disabled when `positionValue <= 0`.
- `asset-detail.tsx` — restructured into the two-column grid; left = header +
  chart + about + facts + position; right = `<AssetActionRail/>`. Keeps it under
  ~200 lines by moving the action UI into the rail.

## Non-goals / invariants

- Money path untouched: `DepositPanel`, `planWithdrawal`, `useYieldActions`
  (`withdraw`/`redeemAll`) stay exactly as they are.
- Files stay < 200 lines.
