# OXAR Wallet & Account Standard

The canonical model for accounts, wallets, deposits and withdrawals. Decided
2026-06-01 to end the embedded-vs-external confusion. Build to THIS; don't improvise.

## Principle

**One account = one embedded Solana wallet.** Everything the user sees is that one
wallet. External wallets are *rails* (where money comes from / goes to), never an
identity. Cross-chain is invisible plumbing.

## The standard

1. **Account = the embedded Solana wallet.** Created at signup, owned by the user
   (exportable). It is the single address shown everywhere (Home / You / header)
   and the only wallet that holds positions.

2. **Login = email / social / passkey.** No "sign in with wallet" — wallet-login
   created separate accounts + a hidden embedded wallet (the root of the confusion).

3. **External wallets = rails, connected on demand, never the account:**
   - **Deposit:** pay from the OXAR wallet's balance, OR connect any wallet
     (MetaMask / Phantom / Trust) in the deposit step to pay from it. Funds are
     routed (Jupiter swap / Delora bridge) **into the OXAR wallet**, then deposited.
     The external wallet only signs the payment.
   - **Withdraw:** from a position → to **any address / chain the user types**
     (their MetaMask, Phantom, an exchange). No "connect" needed.

4. **One address, always.** You / header / menu show only the OXAR Solana address.
   External wallets appear only transiently inside deposit ("paying from …").

5. **Cross-chain = superpower, invisible.** "Fund from any chain, withdraw to any
   chain" via Delora/Jupiter under the hood; the user just sees their one wallet.

## Why

- Kills "I connected X but operate as Y" — the account is always your Solana wallet.
- One address, like Backyard / Cashflow.
- External wallet = clearly "what I pay with", not a second identity.
- Keeps cross-chain as our differentiator without scaring users.

## Implementation

1. **Account selection** — `solana-provider` picks the **embedded** Privy wallet as
   the account always (stop preferring a connected external Solana wallet).
2. **Login** — Privy `loginMethods` = email/social/passkey; remove wallet-as-login.
   Keep external wallet **connectors** (for linking/funding), just not as a login.
3. **Deposit** — "connect a wallet to pay" via Privy `linkWallet`; route funds into
   the OXAR wallet; positions always on it.
4. **Withdraw** — already takes a typed destination (Send/Withdraw flow). Keep.
5. **Display** — one address on You/header/menu (done in PR #46).

## Migration (existing test accounts) — handle BEFORE the destructive steps

- Removing wallet-as-login can **strand embedded wallets of wallet-login accounts**
  (e.g. the Trust-login account `9FdF`) — they'd have no login method left. Move any
  funds out (Export / Send) first. (`9FdF` is ~empty now.)
- Switching the account to the embedded wallet **hides positions held on a connected
  external Phantom** (e.g. `AkC8`). Withdraw those to the OXAR wallet (or out) first.
- Externally-owned wallets (Phantom you control via seed) are always recoverable in
  their own app — only OXAR-managed embedded wallets are at risk.

## Prerequisites before the auth flip

- Confirm which login methods are enabled in the Privy dashboard (so `loginMethods`
  in code matches — a mismatch breaks login).
- Founder migrates any remaining funds off wallet-login / Phantom-held positions.

## Out of scope

- Letting a connected Phantom *be* the account (rejected — one embedded account is
  the standard). Bitcoin (Delora has no BTC). Gas sponsorship (user pays gas).
