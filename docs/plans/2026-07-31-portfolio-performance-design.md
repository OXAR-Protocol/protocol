# Portfolio performance — what you earned, and what percent that is

**Status:** designed · 2026-07-31 · branch `docs/portfolio-performance-design`
**Owner:** @eternaki · daniel.l@oxar.app

## Why

The portfolio card used to print a percentage next to "change". It was removed in #360
because it measured the wrong thing: `(end − start) / start` on a portfolio someone is
actively funding reports the deposits, not the performance. A wallet that went from $2 to
$85 by moving its own cash into positions read **+4181.7%** on the 7-day tab and showed
nothing at all on 90 days (that range opens before there was anything to grow from).

What a person actually wants from this card is two numbers per period: **how much did I
earn** and **what percent is that**. This document defines both — where every input comes
from, exactly how it is computed, what it deliberately excludes, and how each number can
be checked against the others.

The maths below was validated numerically before this was written (see
[Proof](#proof-the-numbers-were-checked-not-argued)).

## The one idea this rests on

Portfolio value is `Σ balance × price`. There are exactly two reasons it can change:

- a **price** moved → that is performance, and
- a **balance** moved → that is money coming or going.

Written out for one day, this is an identity, not an approximation:

```
V(d) − V(d−1)  =  Σ bal(d−1) × [P(d) − P(d−1)]   +   Σ [bal(d) − bal(d−1)] × P(d)
                  └────── earned ──────┘             └──────── flow ────────┘
```

Two consequences make this the right foundation:

1. **Earnings need no USDC leg.** Today `parse.ts` prices an event by the USDC side of the
   transaction, so a trade settled in USDT or token-for-token prices as `null` and
   disappears from the totals. The identity above never looks at a settlement leg — it
   only needs balances and prices, which we already have for the chart.
2. **Yield is captured for free.** Jupiter Lend pays interest by making its receipt token
   worth more, not by sending more of it: `jlUSDC` went 1.0495 → 1.05323 over 29 days
   (≈4.57% annualised, DefiLlama, checked 2026-07-31). That is a price move, so it lands
   in "earned" automatically. Ondo USDY and Maple syrupUSDC accrue the same way.

## Where each ingredient comes from

| Ingredient | Source | Path | Trust |
|---|---|---|---|
| Balances over time | Helius enhanced transactions, replayed **backward** from today's balance | `/api/portfolio-history` → `dailyPortfolioValue` | Exact inside the fetched window; see [truncation](#the-2500-transaction-horizon) |
| Daily prices per mint | DefiLlama `coins.llama.fi/chart`, `period=1d` | `fetchPrices` in the same route | Good; retried, then per-mint fallback. A mint with no series contributes 0 and is counted in `debug.pricedMints` |
| Which mints count | `POSITION_MINTS` (+ cash mints, see [scope](#scope-what-counts-as-the-portfolio)) | `lib/yield/position-mints.ts` | Explicit list |
| Transaction shape (which legs moved) | Same Helius transactions | new: passed through to the performance engine | Exact |
| Live headline balance | On-chain `getPosition` per provider, priced by Jupiter Price v3 | `use-yield-positions` | Independent of the above — see [reconciliation](#reconciling-with-the-numbers-already-on-screen) |
| Trade count | Parsed activity events | `lib/activity/parse.ts` | A count, not a value — unaffected by the USDC-leg weakness |

Nothing here is stored by us. Both ingredients are re-derived on demand and cached for
5 minutes, which is why the chart can show history from the day it ships.

## Scope: what counts as "the portfolio"

This is the one genuine product decision, and it changes the answer.

**Option A — positions only** (what the chart draws today: `POSITION_MINTS`). Buying a
stock with USDC already in the wallet counts as money *arriving*. The consequence is that
the cost of buying — the swap spread — is invisible: pay $100, receive $99 of tokens, and
the engine records "$99 arrived" rather than "$1 was spent". It also explains the
complaint that started this: the card says $1912 while the chart draws $85, because the
$1900 of USDG sitting as cash is not in scope.

**Option B — the whole wallet** (cash + positions). External deposits and withdrawals are
the only flows; a swap is *internal*, so paying $100 for $99 of stock shows up
immediately as a $1 loss, which is what it is. The chart then also agrees with the
headline, because both describe the same money.

**Decision: Option B**, with SOL excluded from the performance scope — SOL is a gas
reserve, not an investment, and letting its price swing move "earned" would be noise
(it also barely applies now that Kora makes the catalog gasless). SOL stays in the
headline balance; it just isn't part of what we call performance.

Cash mints in scope: USDC, USDT, USDG. Their price is fetched like any other rather than
pinned to $1 — a stablecoin that de-pegs is a real loss and the terms already say so.

## Classifying a flow: per transaction, never per day

The daily identity above splits value change into "price moved" and "balance moved", but
a balance can move for two very different reasons, and a day-level view cannot tell them
apart. In the first simulation this showed up immediately: under whole-wallet scope, the
$1 swap spread was filed as `$1 withdrawn` instead of `$1 lost`.

So flows are classified **per transaction**, by the direction of its legs:

| Transaction | Meaning | Treated as |
|---|---|---|
| Only increases | Money arrived from outside (deposit, on-ramp, bridge, someone paid you) | **inflow** |
| Only decreases | Money left to outside | **outflow** |
| Both directions | An exchange between things you already own | **internal** — its net value change is **earned** (this is where the spread and any fee lands) |

This is the same distinction `parse.ts` reaches for when it labels rows, but decided on
*value* rather than on the presence of a USDC leg — so it keeps working for USDT-settled
and token-for-token trades.

## The two numbers

**Earned, per period.** `Σ` over the days in range of the price-attribution term, plus the
net value change of internal transactions. In dollars. This is what the user made or lost,
including what execution cost them.

**Return, per period — time-weighted (TWR).**

```
r(d)  = earned(d) / V(d−1)          … skipped when V(d−1) is dust
TWR   = Π (1 + r(d)) − 1
```

Time-weighted is chosen deliberately over "profit ÷ money in":

- **It works when the range starts empty.** The chain simply begins on the first day money
  was at work. That is what fixes the 90-day and 1-year tabs, which today show nothing.
- **Deposits cannot inflate it.** Adding $10,000 mid-range changes `V`, not `r`.
- **It is comparable across tabs.** 7 days and 1 year measure the same thing, so they can
  sit next to each other honestly.

The cost is that TWR is a *portfolio* return, not a personal one: it does not reward
someone for having deposited before a good week. That trade is worth making here — the
alternative (money-weighted / IRR) is dominated by deposit timing, which is exactly the
distortion we just removed.

## Invariant

Every displayed figure comes from one pass over one dataset, so they must reconcile:

```
change  ==  earned  +  (put in − took out)
```

This is an identity by construction, and it becomes a test. If it ever fails, a number on
that card is lying — which is precisely the failure mode this whole document exists to
prevent.

## Edge cases, and what we do

**Range opens before the wallet held anything.** Normal for a new wallet. `earned` is $0
until money arrives; TWR starts its chain at the first day with value. Every tab produces
a number.

**A position bought and sold the same day** contributes nothing at daily granularity. Day
is the resolution of our price series; documented rather than hidden. Same-day round trips
are rare in a savings product.

**A mint we cannot price.** `priceAt` falls back to the earliest known price, so `Δprice`
is 0 and no phantom earnings appear. The route already counts `pricedMints` vs
`movedMints`; when they disagree the affected period must show `—`, not a confident
number.

**The 2500-transaction horizon.** `fetchEnhancedHistory(owner, key, 25)` reads at most
2500 transactions, and `balancesNow` is summed from those same deltas rather than read
on-chain. A position untouched for longer than the window is therefore invisible to the
chart while still counting in the headline. This is a pre-existing gap (audit, 2026-07-31)
and it bounds this feature too: the fix is to seed the replay from the on-chain balance
and treat the window as covering only *movements*, so an old, quiet position keeps its
value. Until that lands, a wallet whose history is truncated must be flagged, not
silently averaged.

**Rebasing tokens would break this.** A token whose *balance* grows to pay yield would be
read as an inflow, not as earnings — and the backward replay would misstate every past
day. Nothing in the catalog rebases today (jlUSDC, USDY, syrupUSDC all appreciate in
price; verified above). This is a checklist item when adding an asset, and belongs in
`docs/plans/2026-06-01-new-asset-money-path-checklist.md`.

**Gas.** Excluded with SOL. Under Kora the user pays fees in USDC, which appears as an
internal transaction and therefore correctly lands in "earned" as a cost.

## Reconciling with the numbers already on screen

Home shows an "earned" figure from a different engine: `netInvestedFromSwaps` walks swap
history and reports `current value − net invested` (`lib/earnings/swaps.ts`). It is
honest but has two limits this design does not: it is not range-scoped, and it reads cost
from the USDC leg, so a USDT-settled purchase is invisible to it.

The two must not disagree in public. Over a wallet's whole history they measure the same
thing — realized plus unrealized profit — so the plan is:

1. Ship the period engine for the portfolio card (this document).
2. Assert the two agree over "all time" in a test, on a fixture with a USDT-settled trade.
3. Retire the cost-basis path in favour of this one, keeping its unit-tracking logic for
   attributing cost when a position is partly sent away.

Until step 3, home and the card explain different windows and must be labelled as such.

## Display

The stats row under the chart becomes, for each of 7 / 30 / 90 / 365 days:

| cell | value | note |
|---|---|---|
| **earned** | `+$4.95` | with the period return under it: `+3.95%` |
| put in | `$100.00` | external only — deposits, on-ramp, transfers in |
| took out | `$0.00` | external only |
| trades | `10` | with "on N days" |

"change" is retired from the row: it is the sum of two unrelated things (what you earned
and what you moved), it is already visible as the shape of the line above, and reading it
as profit was the original sin this work removes. When a period cannot be computed —
truncated history, unpriced mint — the cell reads `—`.

New i18n keys in both EN and UK (`history.earned`, `history.return`), per the rule that
every string goes through `t()`.

## Where the code goes

Pure computation, zero React — so `sdk/src/core/portfolio-performance.ts`, beside
`portfolio-history.ts` and `activity-stats.ts`, per the shared-logic rule. It takes the
same inputs as `dailyPortfolioValue` plus the transaction legs, and returns per-day
`{ t, usd, earnedUsd, inUsd, outUsd }` with a range summariser. `web/` consumes it in
`/api/portfolio-history` and `portfolio-chart.tsx`; tests live in `web/` importing
`@oxar/sdk`.

## Proof: the numbers were checked, not argued

A synthetic wallet — empty, then a $100 external deposit, then a swap into a stock at a
1% spread, then a 5% price rise — was run through both scopes and both flow rules before
this document was written:

| | positions-only, daily flows | whole wallet, daily flows | **whole wallet, per-transaction flows** |
|---|---|---|---|
| earned | +$4.95 | +$4.95 | **+$3.95** |
| put in / took out | $99 / $0 | $100 / **$1** | **$100 / $0** |
| return | +5.00% | +5.00% | **+3.95%** |
| identity holds | yes | yes | **yes** |

Only the third column tells the truth: the user is $3.95 up, not $4.95, because getting in
cost a dollar — and nothing was "withdrawn". The middle column is the trap this design
exists to avoid, and it is the one a reasonable implementation would have shipped.

## Sequence

1. `portfolio-performance.ts` + tests (identity, TWR from an empty start, spread lands in
   earned, unpriced mint yields `—`).
2. Route passes transaction legs through; response gains the per-day fields.
3. Card shows earned + return; "change" retires; EN/UK strings.
4. Test asserting agreement with the cost-basis engine over all time; then retire it.
5. Seed the replay from on-chain balances to close the 2500-transaction horizon.
