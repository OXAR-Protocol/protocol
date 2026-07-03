# Simple mode + i18n — de-crypto copy and EN/UA/RU

**Date:** 2026-07-04
**Status:** approved (brainstorm)

## Problem

Non-crypto users (the founder's mother, archetype) say the app is "сложно и
непонятно". Root causes identified: **(A) language** — the app is English-only
and full of crypto vocabulary; **(B) mental model** — even translated, "USDC /
wallet / yield source" don't map to anything familiar.

## Decision

Revolut-style: **hide crypto in the main flow, stay honest in the details** —
plus a **locale layer (EN default, UA/RU optional)**.

1. **De-crypto copy (all locales, including EN).** Core-flow sentences say
   "dollars", not USDC: "your dollars earn 5% a year", "add dollars", "withdraw
   anytime". Token symbols stay in data chips (asset cards, tx rows) — we never
   fake the asset, we stop *leading* with it.
2. **Honest disclosure where money moves.** The deposit confirm step keeps the
   trust footer and gains "runs on USDC — digital dollars, 1 USDC = $1" wording.
   Asset pages keep full detail (what it is, facts, platform badge, TVL).
3. **i18n layer.** `lib/i18n/`: tiny dictionary-based provider (no next-intl
   dep, no route changes) — `LocaleProvider` + `useT()`; locale persisted in
   `localStorage("oxar:locale")`; switcher in `/you` (EN / UK / RU). Scope =
   the authenticated core flow only (nav, home, yield, pile, you, deposit
   panel/confirm/success, asset page labels, trust strip). Marketing pages and
   long curated asset descriptions stay EN for now (follow-up).

## Architecture

- `lib/i18n/types.ts` — `Locale`, dictionary shape (typed keys).
- `lib/i18n/en.ts / uk.ts / ru.ts` — flat key→string maps, `{var}` interpolation.
- `lib/i18n/index.tsx` — `LocaleProvider` (client), `useT()`, `useLocale()`.
  Lookup: dict[locale][key] ?? dict.en[key] ?? key. Plurals: explicit keys
  (`sources.one` / `sources.many`) chosen in code.
- Mounted in the app layout's provider stack; zero impact on money-path hooks.

## Invariants

- Money path untouched — copy and display only.
- No routing/i18n-URL changes; closed-alpha switcher only.
- Never claim "no fees" where a swap cost exists (kept from trust-strip rules).
- Files < 200 lines; dictionaries split per locale.
