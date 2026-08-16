# Platform fee — where the switches are and how to move them

*Written 2026-08-16, when the fee shipped off. Read this before touching anything
that charges.*

## There is no feature branch

The fee is in `main` and deployed to production right now. It charges nobody and
says nothing about itself, because it is gated on two conditions that are both
false in production — not because the code is waiting somewhere.

This matters for how you work on it: there is nothing to keep alive, rebase, or
merge later. Turning it on is an environment variable and a deploy. Turning it
off again is the same, backwards.

## The two switches

| | what it is | where | live? |
|---|---|---|---|
| `platform-fee` | feature flag, per user | `DEFAULT_INSIDER_FEATURES` in `app/api/access/features/route.ts` | insiders only |
| `NEXT_PUBLIC_FEE_ACCOUNT_USDC` | the account fees land in | Vercel env, `oxar-web` | Preview branch `test/platform-fee` only |

`usePlatformFeeBps()` returns `0` unless both hold, and `0` means the request to
Jupiter carries neither `platformFeeBps` nor `feeAccount`. Two switches rather
than one so that neither a flag flipped by accident nor a stray env var can start
billing on its own.

**The value is a token account, not a wallet.** Jupiter pays the fee into an SPL
account whose mint is one side of the swap. The fee wallet is
`HTnptfEEkqjr7ZiQs7E39a7a4cuo7tX9JNRych2sRJPv`; the value that goes in the env var
is its USDC ATA, `4bm9iv49MQabH4rq5Y3ySKTjUGvYjEPbownXG52yjGCb`. Both are valid
base58 pubkeys, so pasting the wrong one fails at swap time, not at deploy time.

> Without an OpCo this wallet belongs to a person, so project income sits on a
> personal key. Acknowledged deliberately; revisit when there's an entity.

## `test/platform-fee` is a deploy target, not a work branch

Never commit to it. It exists only so one Vercel preview has the env var set,
which lets us spend real money through the fee path without production saying a
word about a fee.

Refresh it to whatever `main` is now — do this before each test session, and
always with `-f`, since the branch is a mirror and may have drifted:

```bash
git fetch origin
git push -f origin origin/main:refs/heads/test/platform-fee
```

That produces a new deploy with the env var baked in. Then sign in **by email as
an insider** (`daniel.l@oxar.app`) — signing in with an external wallet won't
match unless the address is in `INSIDER_WALLETS`.

If the branch is ever deleted, recreate it with the same push and re-add the env
var scoped to it (`vercel env add NEXT_PUBLIC_FEE_ACCOUNT_USDC preview test/platform-fee`).
Nothing is lost — the branch holds no code of its own.

## Going live, later

1. Add `NEXT_PUBLIC_FEE_ACCOUNT_USDC` to **Production** with the ATA above.
2. Redeploy — Vercel bakes env vars in at build time, so an existing deployment
   will not pick it up.
3. Move `platform-fee` out of `DEFAULT_INSIDER_FEATURES` into
   `DEFAULT_PUBLIC_FEATURES` — a commit, so the decision has a date and an author.

Step 1 alone changes what the public terms page says: section 9 follows that env
var, because a public server-rendered page has no session to read a flag from. So
**setting it in production is itself an announcement**, and the plan was that the
announcement should be deliberate rather than a side effect of a deploy. Do steps
1–3 together, with whatever we're saying about it ready to go.

## What the app promises, and what keeps that true

The fee appears as its own line on the confirm screen of the transaction it
applies to. Terms section 9 leans on exactly that: *if that line is not there, no
OXAR fee applied to that transaction.* That sentence is what makes the in-between
state honest — account set, flag insider-only — and it is the reason none of the
fee copy may become unconditional.

Everything that talks about our cut reads `usePlatformFeeBps()` rather than
remembering: the confirm row, the sell breakdown, the exit-cost line, and the
"no fees" chip (which is why a USDT or USDS lend drops it — those convert on the
way in, unlike a USDC lend). `terms-sections.test.ts` fails if the prose and the
switch disagree.
