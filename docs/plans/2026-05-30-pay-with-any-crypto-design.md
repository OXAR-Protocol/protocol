# Design: Pay With Any Crypto (Universal Deposit)

Source epic: `pay-with-any-crypto` (originally in `.context/`). This is the
implementation design agreed for the OXAR `web/` app.

## Goal

Fund any OXAR product with **any asset the user holds on any chain**, in one tap:
enter a USD amount, pick a pay-asset from the wallet, OXAR routes it (direct /
Jupiter swap / Delora bridge) into USDC on Solana and deposits. One-liner:
_pay with anything you hold, on any chain — start earning in one tap._

## Agreed shape

- **UX = variant A:** the pay-asset picker lives inside the existing
  `YieldSourceSheet`. Amount is entered in **USD**; the picker lists wallet assets
  (USD-valued, sorted), USDC pre-selected ("⚡ instant"). Net-received USDC + fee +
  ETA always shown before confirm.
- **Router over the existing `YieldProvider` abstraction** — after USDC is on Solana,
  reuse `provider.deposit` (Jupiter Lend live; Kamino; future products). No new
  deposit logic, no duplicate ATA creation (SDKs create ATAs idempotently).

### Router decision table

| Pay-asset | Path | Vendor |
|---|---|---|
| USDC on Solana | direct → `provider.deposit` (no conversion) | — |
| SOL / SPL on Solana | Jupiter swap → USDC → deposit | Jupiter Swap API |
| Asset on another chain (EVM) | Delora bridge+swap → USDC on Solana → deposit | Delora `/v1/quotes` |

Single entry point: `deposit({ targetProduct, payAsset, amountUsd })` → picks the path.

## Data sources (free / already have)

- **Solana balances:** Helius (`getParsedTokenAccountsByOwner` + native SOL).
- **USD prices (Solana):** Jupiter Price API (`lite-api.jup.ag/price/v2`).
- **Solana swap:** Jupiter Quote+Swap API (`/swap/v1/quote` + `/swap/v1/swap` →
  serialized v0 tx; the Privy adapter already signs v0). 2-tx flow: swap → confirm →
  deposit the **realized** USDC (balance delta, so pre-existing USDC isn't swept).
- **Cross-chain:** Delora `/v1/quotes` (`x-api-key`, `integrator=oxarforoxar`,
  `fee=0.001`) → route + calldata for bridge+swap → USDC on Solana → deposit. Creds
  in Vercel `oxar-web` + `web/.env.local` (see memory `reference_delora_api`).
- **EVM balances + Privy EVM:** Privy is currently `solana-only`; cross-chain needs
  EVM wallets enabled + an EVM balance source. **OPEN DEPENDENCY** — prefer Delora if
  it exposes balances; otherwise an Alchemy/Zerion key (resolve at Story 1 EVM step).

## Status UI (Story 4)

Stepper reflecting real progress, recovers on reload (persist bridge ref id):
- Solana swap path: **Swapping → Depositing → Earning**.
- Cross-chain path: **Bridging → Swapping → Depositing → Earning** (poll by bridge id).
- In-flight/stuck → "funds in transit, ref id …", never silent failure.

## Edge guards

Slippage cap (abort if exceeded), dust (fee > ~30% of deposit → block), quote expiry
(hold N s, force re-quote before confirm), gas-on-EVM state, recovery via persisted
bridge ref id.

## Build order (PR sequence)

1. **Solana portfolio** — `useWalletAssets()` (Helius balances + Jupiter prices), tested.
2. **Router skeleton + USDC-direct path + picker** in the sheet (USD amount, net quote).
3. **Jupiter swap path** (SOL/SPL → USDC) + Swapping→Depositing stepper.
4. **Delora cross-chain path** + EVM portfolio + Privy EVM + Bridging stepper + recovery.
5. **Harden** edge cases (slippage, dust, quote expiry, gas, recovery).

## Verification

`yarn build` + unit tests on pure logic each PR. Solana paths (1–3) verifiable on
mainnet by the team. Cross-chain (4) needs a real cross-chain smoke test by the user
(cannot be verified from the dev environment).

## Out of scope (this epic)

Withdrawals to non-Solana chains; fiat on-ramp; new yield/RWA protocol integrations
(consumed here, integrated elsewhere).
