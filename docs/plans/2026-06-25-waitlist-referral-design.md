# Waitlist Referral System — Design

**Date:** 2026-06-25
**Status:** Approved (brainstorm) → implementing
**Scope:** "Our side" only. The Galxe quest is a separate, dashboard-only task.

## Goal

Turn the existing email-only waitlist into a referral waitlist: each signup gets a
share code; inviting friends moves you up the queue. Reward is **position + founding
member status** — no token, no allocation (OXAR has no legal entity; avoid securities
framing).

## Mechanic — "skip the line", two-sided

The waitlist already centers on a queue metaphor ("take a seat, we'll call your number")
and issues a `serial` per signup. We build on it.

- **Referrer** gains `GAIN = 5` spots per confirmed referral (uncapped — more invites,
  higher position).
- **Referred friend** gets `HEAD_START = 3` spots when they join via a code.
- **Invariant:** `HEAD_START (3) ≤ GAIN (5)`. Because the referrer joined earlier
  (smaller `serial`) and gains more for the friend than the friend gets, **the inviter
  is always ahead of their own invitee** — proven on the priority formula below. No
  "I invited you and now you're ahead of me" feel-bad.

### Effective priority (lower = closer to the front)

```
priority = serial − head_start − GAIN × referral_count
```

Displayed position = `1 + count(rows with lower priority)`, ties broken by `serial`
(earlier join wins). This makes "you jumped N spots" and "M people ahead" true and
**consistent across all users** — not per-user vanity math.

### No leaderboard, but competition is felt

Per product call: no leaderboard table on the site (chrome + other people's names add
nothing). Competition is conveyed through the user's own standing:
- big position number (`#4,231` implies a crowd)
- percentile ("ahead of 78%")
- movement delta after a referral ("↑ jumped 15 spots")
- neighbor context ("312 ahead — invite 2 to pass the next 10")

## Anti-scam — hybrid (Variant 3)

The only robust defense is verified email; everything else raises cost. So we ship the
cost-raising layer now and architect for verification later, **with no rework**.

**Phase 1 (ships now, $0, no email infra):**
- email uniqueness (already enforced) — can't re-refer an email
- self-referral block (referrer email ≠ joiner email)
- disposable-domain blocklist (curated inline list, no dependency)
- Cloudflare Turnstile invisible captcha — kills bot mass-signup (free, unlimited);
  **optional** — enforced only when `TURNSTILE_SECRET_KEY` is set, so build/local work
  without a Cloudflare account
- IP-hash heuristic — if joiner `ip_hash` == referrer `ip_hash` (same device farming),
  the signup still joins but the referrer boost is **not** credited

**Phase 2 (later, when transactional email lands — Resend free tier, $0 at our scale):**
- referral edge carries `referral_status: pending | confirmed`; head-start + referrer
  credit only apply on `confirmed`
- flip `WAITLIST_REQUIRE_VERIFY=true` → new referrals start `pending` until the friend
  clicks a verify link. **No migration** — the column ships now, defaulting `confirmed`.

## Data model — migration `0004_waitlist_referral.sql`

Adds to `waitlist`:
- `ref_code text unique` — this person's own share code (random, 8 hex; backfilled for
  existing rows)
- `referred_by text` — the `ref_code` of whoever referred this person (nullable)
- `referral_count int not null default 0` — confirmed referrals made by this person
- `head_start int not null default 0` — spots granted because this person was referred
- `referral_status text not null default 'confirmed'` — `pending | confirmed`

SQL functions (called via service-role rpc):
- `oxar_increment_referrals(p_ref_code text)` — atomic `referral_count + 1`
- `oxar_waitlist_rank(p_ref_code text)` → `(position, total, referrals)` — the priority
  rank. `GAIN = 5` lives here (single source for the math); `HEAD_START = 3` is written
  by the API on insert.

## Flow & edge cases — `POST /api/waitlist`

Input: `{ email, ref?, website (honeypot), turnstileToken? }`.

1. honeypot filled → silent fake response (existing behavior)
2. invalid email → 400
3. disposable domain → 400
4. Turnstile fails (when configured) → 400
5. rate limit (existing) → 429
6. **email already on list** → return existing `serial` + `ref_code` + rank,
   `existed: true`; **do not** apply any referral (can't be referred after the fact)
7. resolve referrer from `ref`: not found → ignore code (still join); referrer email ==
   joiner email → ignore (self-referral); referrer `ip_hash` == joiner `ip_hash` → join
   but skip boost
8. generate unique `ref_code` (retry on conflict)
9. insert row: `head_start = referrer ? 3 : 0`, `referral_status = 'confirmed'`
10. if valid referrer → `oxar_increment_referrals(referrer.ref_code)`
11. compute rank → return `{ serial, ref_code, existed:false, position, total,
    referrals, referred }`

`GET /api/waitlist/position?code=…` → fresh `{ position, total, referrals }` for
returning users (localStorage holds `ref_code`).

## Frontend — `landing-v2/waitlist.tsx`

- **Before signup:** email field + optional referral-code input (prefilled from
  `?ref=CODE`, editable). If arrived via a link, a subtle "invited by a friend — you
  start ahead" note. Turnstile widget renders only when a site key is configured.
- **After signup (`waitlist-success.tsx`, extracted to keep files < 200 lines):**
  position number, percentile, copy-able share link (`oxar.app/?ref=CODE`), referral
  count, founding-member line, and a next-step nudge.
- `use-waitlist.ts` reads `?ref=`, persists `ref_code`, and re-fetches position on
  mount so a returning user sees their current standing.

## Costs

- Phase 1: **$0**. Only a free Cloudflare account for the Turnstile site key (to
  *enforce* the captcha; code ships and runs without it).
- Phase 2: Resend free tier (3,000 emails/mo) — $0 at our scale.

## Out of scope

- The Galxe quest (separate dashboard task).
- Actual transactional-email sending / the verify-link endpoint (Phase 2 — needs the
  Resend account + domain DNS; the data model seam ships now).
