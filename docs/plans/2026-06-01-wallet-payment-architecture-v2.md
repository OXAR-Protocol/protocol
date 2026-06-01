# OXAR Wallet & Payment Architecture v2

Supersedes the "embedded-wallet-always" stance of
`2026-06-01-wallet-account-standard.md` (PRs #47–49). Decided 2026-06-01 after
benchmarking Backyard and finding deposits broke for users whose funds live in
an external wallet (Phantom).

## Why v2

The v1 standard forced **account = the embedded Solana wallet, always**
(`createOnLogin: "all-users"`). For an email user with no crypto wallet that is
the whole onboarding wedge. But for a user who already owns Phantom it is dead
weight and the root of the breakage:

- Privy spins up a **second, empty** embedded wallet next to the user's Phantom.
- `deriveSolanaWallets` then picks that empty embedded wallet as the account.
- The swap/deposit signs from the empty wallet → no input tokens → it fails.
- Positions land on the embedded wallet, invisible in the user's Phantom.

This is the "old addresses" symptom: the app operates on a wallet that holds no
money.

## Principle

**One wallet, whichever you have. The account is the wallet you signed in with.**

- Sign in with **email** → you have no wallet → we create an embedded one → that
  is your account (the wedge, preserved).
- Sign in with a **Solana wallet** (Phantom/Solflare) → that wallet **is** your
  account. No embedded wallet is created.
- To **pay**, you may additionally connect another wallet (e.g. an EVM wallet for
  a cross-chain bridge). That wallet is only a funding **source**, never the
  account.

This removes the "two Solana wallets, which is active?" ambiguity that caused the
earlier misdelivery bugs (PRs #36/#37): each user has exactly one Solana account.

## Locked decisions

1. **Wallet model** — "one wallet, whichever you have" (above).
2. **Payment scope** — Solana swap (Jupiter) **plus** cross-chain bridges
   (Delora, EVM→Solana). Bridges stay as the differentiator.
3. **Multi-vault** — a **client-side basket** (no smart contract): split one
   deposit across N vaults by allocation %, executed as N sequential deposits
   (Kamino as its own tx, Jupiter vaults can pack together). Each position is
   held individually in the account wallet. Ship single-vault first; basket is a
   fast-follow. A smart contract is only needed for a *tokenized* basket (one LP
   token = the whole strategy) — out of scope, Phase 2+.
4. **Pay with** — keep the current picker (assets the account holds). Unchanged.

## Implementation

### PR #1 — the payment fix (this PR)

1. **`privy-provider.tsx`**
   - `loginMethods: ["email", "wallet"]` — re-enable Solana wallet login.
   - `embeddedWallets.solana.createOnLogin: "users-without-wallets"` (was
     `"all-users"`) — an embedded wallet is created **only** when the user has no
     wallet of their own.
1b. **`login/page.tsx` — restrict wallet-LOGIN to Solana.** `createOnLogin` is
   chain-agnostic in Privy: an EVM-wallet login counts as "has a wallet", so no
   embedded Solana wallet is created and the account ends up with no Solana wallet
   (broken). Since the global `appearance.walletChainType` must stay
   `ethereum-and-solana` so EVM wallets can be *linked to pay*, restrict the
   **login** call per-invocation: `login({ walletChainType: "solana-only" })`. An
   EVM wallet can then only ever be a pay rail (`linkWallet` in the deposit
   panel), never an account.
2. **`solana-provider.tsx`** — guard the manual auto-create effect so it never
   creates an embedded wallet for a user who already linked an external Solana
   wallet (closes the race where Phantom isn't yet in `linkedAccounts`).
3. **`solana-wallets.ts`** — add a pure `hasExternalSolanaWallet(linked)` helper
   for that guard. `deriveSolanaWallets` is **unchanged**: "prefer embedded, else
   the only (external) wallet" is already correct under the new model — a
   wallet-login user simply has no embedded, so their external wallet is picked.
4. Update the comments in the two providers + a note atop the v1 standard doc
   pointing here.

Not touched: `jupiter-swap.ts`, `delora.ts`, the deposit router, the deposit
panel picker, token mints/contract addresses (all verified correct).

### PR #2 — multi-vault basket (fast-follow)

- A `Strategy = { providerId, allocationBps }[]` model; the deposit engine takes
  an array of targets (PR #1 keeps single-target, no premature abstraction).
- Basket UI: pick N vaults, set allocation %, show Avg APY, one amount split.

### Known follow-ups (not blocking PR #1)

- **Reconnect race** — for a wallet-login user, `useWallets()` (Solana) populates
  asynchronously while the address resolves synchronously from `linkedAccounts`.
  In the brief reconnect window the signer falls back to `ReadOnlyWallet`, so a
  deposit attempted right then throws "connect your wallet" even though they are
  logged in. Self-heals on retry (`shouldAutoConnect: true`). Fix later: gate the
  deposit action on the connected wallet being ready.
- **Create-collision flash** — Privy's own `users-without-wallets` create can race
  the manual `createSolanaWallet()` fallback and surface a transient "Failed to
  create Solana wallet" before the address resolves. Harmless; tidy the catch
  later (the manual fallback is now largely redundant).
- **Legacy double-wallet selection** — handled by the manual Privy-dashboard
  reset in Migration, not in code (see above).

### Phase 2

- Gas sponsorship for cross-chain (the receiver needs SOL today — known TODO).
- Optional tokenized basket via an audited contract.

## Migration (existing accounts)

- **Email users** — no change. Their embedded wallet stays the account; a linked
  Phantom (if any) is just a pay source. The selection fix means it is no longer
  mis-picked. Nothing to reset.
- **Legacy double-wallet test accounts** (an email account with a spurious empty
  embedded wallet, when the intent is for Phantom to be the account) — Privy
  cannot delete *only* the embedded wallet (embedded wallets are persistent). The
  clean path at this stage: confirm the embedded wallet is empty (sweep dust
  out), then **delete the user in the Privy Dashboard** so they re-onboard fresh
  by logging in **with Phantom**. Done manually by the founder; not automated.
- No server-side reset machinery is built now. If programmatic reset is ever
  needed, add `@privy-io/server-auth` + app secret and a small admin script.

## Out of scope

- Tokenized/contract-backed basket (Phase 2+).
- Gas sponsorship (Phase 2).
- Letting a connected wallet that is *not* the login wallet sign Solana swaps —
  Solana pay-tokens must be in the account; other chains pay via the bridge.
