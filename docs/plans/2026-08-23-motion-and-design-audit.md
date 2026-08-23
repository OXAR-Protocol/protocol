# Motion and design audit — the fixes

Date: 2026-08-23
Branch: `fix/motion-and-design-audit`
Base: `db55450`

An audit of every animation in `web/` against the craft bar in Emil Kowalski's
animation philosophy (the `improve-animations` skill), plus the design-token gaps
the sweep turned up on the way. Thirteen findings, each confirmed at its file:line.
This document is the record of what was wrong and what each fix does; the fixes
themselves land in one PR.

The through-line: the app leans on library defaults. Colour and font are tokenised;
motion is not. Exactly three of ~28 transitions name a curve, and the one
well-chosen cubic-bezier in the codebase lives on the marketing landing rather than
in the product. Everything below either picks a value on purpose or deletes an
animation that was never earning its place.

## The shared vocabulary (do this first — later steps import it)

Two new surfaces, because nine of the thirteen findings are downstream of not having
them.

**`web/src/app/globals.css`** gains motion tokens in `@theme`:

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* entering, exiting, default */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* moving on screen */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* sheets */
--duration-press: 160ms;
--duration-fast: 200ms;
--duration-sheet: 320ms;
```

Overriding `--ease-out` and `--ease-in-out` is safe to do by those exact names, unlike
the radius scale below: the audit found zero uses of the `ease-*` utilities anywhere in
`src/`, so nothing silently changes underneath — the names were free.

**`web/src/lib/motion.ts`** (new) holds the JS side: the spring presets, the one
`rise()` entrance helper that three files currently redeclare, and
`useReducedMotion`-aware variants.

```ts
export const SPRING = {
  sheet:  { type: "spring", damping: 32, stiffness: 320 },
  snappy: { type: "spring", damping: 34, stiffness: 420 },
  soft:   { type: "spring", damping: 26, stiffness: 260 },
  digit:  { type: "spring", damping: 40, stiffness: 700, mass: 0.4 },
} as const;
```

`lib/` and not `@oxar/sdk`: these are React/framer-motion values, so they fail the
"zero react imports" test in the root CLAUDE.md rule 3.

## The findings, in the order they get fixed

### 1 — HIGH — three seconds of blocked app on every launch

`warp-on-entry.tsx:7`, `warp-transition.tsx:157`

`ENTRY_WARP_DURATION = 3000` plays a full-screen canvas splash on every hard load of
any app route. The overlay is `fixed inset-0 z-[9999]` with no `pointer-events-none`,
so for three seconds the app cannot be touched. There is no skip. Under the Capacitor
shell that is every single app open.

The animation itself is good and it doubles as a cover while auth and balances
resolve — so it stays. What changes is that it stops being a toll:

- First launch in a session keeps the full run; a returning visitor gets 1200ms.
  `sessionStorage` already stamps `oxar_last_warp_at`, so the check is free.
- Tap or any key skips it.
- `pointer-events-none` on the overlay once the fade-out phase starts.
- `prefers-reduced-motion` skips it entirely.

### 2 — HIGH — the money-confirm gesture animates a layout property, per frame, through React

`swipe-to-confirm.tsx:141`, and `:61` for the state that drives it

The press-and-hold that authorises money animates `width: ${progress * 100}%`, set
from a React `setProgress` call inside a `requestAnimationFrame` loop. That is ~48
React renders and ~48 layout+paint+composite passes across the 800ms hold, on the one
interaction in the app that must not stutter.

Fix: `transform: scaleX()` with `transform-origin: left`, driven by a framer
`useMotionValue` so the fill never touches the React render loop. The `onConfirm`
trigger stays on the rAF clock.

### 3 — HIGH — the release teleports

`swipe-to-confirm.tsx:55`

`stop()` calls `setProgress(0)`, so lifting a finger mid-hold snaps the fill to zero
in one frame. It reads as a glitch rather than as "cancelled". The system's answer to
an abandoned gesture should recede, not vanish: `animate(fill, 0, { duration: 0.16,
ease: EASE_OUT })`. Asymmetric on purpose — the 800ms hold is deliberate, the retreat
is not.

### 4 — HIGH — half a second of entrance tax on every tab switch

`you/page.tsx:35,45,74`, `market/page.tsx:105,124,167,251,270`,
`onboarding/page.tsx:26,40,76`, `profile-money.tsx:19`, `asset-detail.tsx:15`,
`asset-section.tsx:169`, `top-movers-carousel.tsx:49`

Every one of these is `{ opacity: 0, y: 16 } → { opacity: 1, y: 0 }` over 500ms, several
with delays up to 200ms. App-router navigation unmounts the page, so switching between
`/you` and `/market` replays the whole thing — content lands 600–700ms after the tap on
screens opened dozens of times a day. The rule for that frequency is "remove or
drastically reduce".

Fix: one `rise()` helper from `lib/motion.ts`, 200ms, explicit `--ease-out` curve, and
the stagger delays dropped to at most 40ms where a group entrance genuinely reads
better. Marketing keeps its longer, slower reveals — a landing page is seen once.

### 5 — HIGH — no reduced-motion handling anywhere

Zero occurrences of `prefers-reduced-motion` or `useReducedMotion` across 151
components, while the app ships a three-second splash and a carousel that moves by
itself.

Fix, per the standard: fewer and gentler, not none. A `@media (prefers-reduced-motion:
reduce)` block in `globals.css` collapses transition durations and kills the infinite
ones; `rise()` drops its `y` and keeps the opacity; the entry warp and the carousel's
auto-advance switch off.

### 6 — MEDIUM — the carousel never pauses on a phone

`top-movers-carousel.tsx:26-41,60`

`setInterval` advances a card every 5s. The only pause is `onMouseEnter`, which no
touch device fires — so on the device most people use, the strip slides out from under
the finger while it is being read. The end-of-list case smooth-scrolls the whole way
back to zero, which reads as the component resetting itself.

Fix: pause on `touchstart` and on any user scroll (resume ~4s after the last
interaction), stop entirely under reduced motion, and make the wrap-around an instant
jump rather than a visible rewind.

### 7 — MEDIUM — pull-to-refresh renders on every touchmove

`pull-to-refresh.tsx:66,104`

The gesture writes React state on each `touchmove` and applies `transform` as an
inline style, so the whole subtree reconciles once per frame of the pull. Releasing
below the threshold sets the value to `0` with no transition, so the indicator
teleports home.

Fix: a `useMotionValue` for the offset (no renders during the drag), a spring for the
return, and React state kept only for the two things that actually change the tree —
`ready` and `refreshing`.

### 8 — MEDIUM — six near-identical hand-typed springs

`sheet-shell.tsx:59` (32/320), `send-sent.tsx:40` (15/220), `feedback-sheet.tsx:80`
(26/220) and `:104` (15/220), `yield-action-success.tsx:70` (15/220), `tab-bar.tsx:60`
(34/420), `animated-amount.tsx:41` (40/700/0.4), `join-capture.tsx:92` (26/300).

Eight call sites, six distinct configs, no two of which differ enough to be a
decision. Replaced by the four `SPRING` presets above.

### 9 — MEDIUM — the entrance helper is declared three times

`profile-money.tsx:16`, `asset-detail.tsx:12`, plus the same object inlined across
five pages. Identical values. This is the root CLAUDE.md's no-duplication rule broken
in the most literal way available. One `rise()`, imported.

### 10 — MEDIUM — `transition-all`, no press feedback, ungated hover

`ui/button.tsx:9`, `top-movers-carousel.tsx:78`, `landing-v2/speeds.tsx:63`

- `transition-all` animates properties nobody chose, off the GPU. Narrowed to the ones
  that are actually meant to move.
- Press feedback across 151 components is a single 1px `translate-y` on the base
  button. Nothing else in the app answers a finger. `active:scale-[0.97]` at
  `--duration-press` on `ui/button.tsx` — **and on the 25 hand-rolled primary buttons
  that never go through it.** Fixing only the shared component would have left almost
  every button people actually press in this app untouched: the `rounded-full bg-ink
  … transition hover:bg-ink/85` string appears in 23 files, and those are the deposit,
  sell, send and confirm buttons. They already carry Tailwind's `transition`, which
  in v4 covers `transform`, so the scale animates with no extra utility.
- `hover:-translate-y-0.5` on the mover cards is not gated, so a tap on a phone leaves
  the card stuck in its hover state until something else steals focus. Wrapped in
  `@media (hover: hover) and (pointer: fine)`.

### 11 — LOW — dead motion CSS

`globals.css:59-80,123-142`

`--animate-breathing`, `--animate-bounce-slow`, `@keyframes beamFlow`, `beamFlowV`,
`beamPulse` and `.bg-grid` have zero references in `src/`. About 25 lines, deleted.

### 12 — LOW — thirteen corner radii and sixteen font sizes

Radii: 5, 6, 8, 10, 12, 14, 16, 18, 20px hand-typed, plus `lg`, `xl`, `2xl`, `full`.
Type: `text-[9px]` through `text-[40px]`, with 10/11/12/13px all doing the work of "the
small one" (188 uses between them).

**Radii: done in full.** Six semantic tokens — `--radius-tight` 6, `--radius-field` 8,
`--radius-control` 10, `--radius-card` 12, `--radius-panel` 16, `--radius-sheet` 22 —
and all 71 hand-typed call sites moved onto them. Four of the nine values map exactly,
so most of the diff changes nothing on screen; the other five move by 1–2px, which is
the consolidation. Zero `rounded-[Npx]` remain in `src/`.

The tokens are named for what they wrap rather than for their size, and deliberately
NOT `--radius-sm/md/lg`: Tailwind ships that scale itself and `ui/button.tsx` reads
`var(--radius-md)` out of it, so redefining those names would have silently resized
every button in the app. Semantic names add utilities instead of overwriting one.

**Type: deferred, on purpose.** The same treatment for type is not a fix, it is a
redesign: 10, 11, 12 and 13px are 188 uses between them, and collapsing them onto a
scale changes the visual rhythm of nearly every screen in the product. That should be
seen before it ships, not folded into an animation PR. Adding `--text-*` tokens without
migrating the call sites would just have created the dead-token problem that finding 11
is about, so this PR adds nothing there and leaves the finding open.

### 13 — LOW — fifteen spinners, one skeleton

Content resolves from a centred spinner straight into a laid-out section, so the page
jumps at the moment the data lands. The chart and the positions list are the two that
jump hardest and the two whose shape is known before the data arrives, so they get
skeletons matching their real geometry.

## Missed opportunities included in this PR

**The main balance does not animate.** `profile-header.tsx:149` renders the portfolio
total as plain text: `$0.00` becomes `$1,234.56` in one frame, on load and after every
deposit. `AnimatedAmount` — per-character spring, already written, already shipped —
is wired only to keypad fields. Wiring it to the total is the largest visible
improvement in the PR for the smallest diff.

**Haptics on the confirm hold.** The Capacitor shell is there. A light impact at the
moment the hold completes costs one call and makes the confirmation land in the hand.
Web gets `navigator.vibrate` where it exists; neither is load-bearing.

Left out on purpose: the grid↔list toggle on `/market` swaps two different component
trees, so making it animate is a restructure, not a fix. Noted for later.

## What the cleanup pass changed

Three things the review caught in this PR's own diff, worth recording because two of
them are the PR contradicting itself:

- **It shipped dead tokens.** `--ease-in-out`, `--ease-drawer`, `--duration-sheet` and
  a JS `EASE_IN_OUT` were written as part of "a complete motion vocabulary" and had
  zero callers — in the same change that deletes five dead keyframes from `globals.css`
  for exactly that reason. Removed; add them back with the code that needs them.
- **A magic number that was already a token.** `swipe-to-confirm` defined
  `RELEASE_MS = 160` next to an import of `DURATION.press`, which is 160ms. Now uses
  the token.
- **A second skeleton.** `top-movers-carousel` kept its own inline `animate-pulse` card
  next to the new shared `Skeleton`. Pointed at the shared one.

## Verification

- `yarn build` and `yarn test` from `web/`.
- Feel-check, because none of this can be judged from a diff: cold-load the app and
  confirm the splash is skippable and short on the second visit; switch tabs
  repeatedly and confirm the page no longer fades in each time; hold the confirm
  button and release halfway; pull to refresh and let go early; throttle the CPU 6× in
  DevTools and hold-to-confirm again — the fill must stay smooth.
- Toggle "Reduce motion" in macOS/iOS settings and repeat all of the above.

---

## Follow-up (2026-08-24): the warp is gone

The audit shortened the entry warp and made it skippable. The right question turned
out to be a different one — not "how long should it be" but "what is it for".

Answer: nothing. A sweep of the codebase found exactly one trigger, `WarpOnEntry`,
mounted in `(app)/layout.tsx`, and it was attached to no event whatsoever. It did not
wait for auth. It did not wait for balances. It did not cover a navigation — the
`url` and `onComplete` options in `WarpOptions`, the two that exist precisely so a
warp can cover a real transition, had zero callers. It played because the layout
mounted, and held a `z-9999` overlay over the app while it did.

An animation with no event behind it is decoration, and decoration does not get to
stand between someone and their money on the way in.

Removed: `warp-on-entry.tsx`, `warp-transition.tsx`, `warp-canvas.ts`,
`logo-path-data.ts` — 661 lines forming a closed loop that nothing outside it
referenced — plus the `WarpProvider` wrapper in the app layout. It is in git history
if a real transition ever needs it.

The same sweep checked every other full-screen overlay in the app: sheets, modals,
the access wall, the terms gate, the tour spotlight, the success screens. Every one
of them appears because something happened. There are no infinite animations outside
loading spinners and skeletons, and no `whileInView` reveals outside marketing. The
warp was the only decorative-only motion in the product.
