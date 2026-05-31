# Design: Unified Outbound "Send / Withdraw to anywhere"

Source: session 2026-05-31. Counterpart to the cross-chain deposit
(`2026-05-30-pay-with-any-crypto-design.md`). Gives funds an **exit**: send any
held asset to any asset + chain + address. The existing same-chain Send becomes
one case of this flow.

## Goal

One outbound action: **send any asset you hold → into any asset, on any chain, to
any address.** Mirrors the deposit router in reverse. Pairs with "pay with
anything" → "withdraw into anything" (e.g. deposit USDC, take profit in SOL or to
your MetaMask on Base).

## Router (mirror of the deposit router)

`chooseOutboundPath({ sourceMint, destMint, destChain })`:
- **Solana, same asset** → plain transfer (existing `useSend` logic).
- **Solana, different asset** → Jupiter swap (source→dest); + transfer if the
  destination address isn't the user's own wallet.
- **EVM asset** (ETH / USDC on Base / …) → **Delora bridge Solana→EVM**, delivered
  to the entered EVM address.

## Feasibility (verified live)

Delora supports Solana as origin: `Solana USDC → Base USDC` returned a quote
(adapter `MAYAN_FAST_MCTP`, ~35s, out 2.99 / min 2.97 on 3 USDC). Response shape
matches the EVM direction (`inputAmount, outputAmount, minOutputAmount, adapter,
calldata{to,data,value}, fees, bridgeScan`) **plus** a `transactionSize` field.

**Open item:** for SVM origin the executable is a Solana transaction, not EVM
calldata — confirm the exact format Delora returns (likely a serialized Solana tx;
`transactionSize` hints at this) and sign it with the Privy Solana adapter.

## Gas

The outbound Solana tx (transfer / swap / bridge-submit) is paid by the user's
Solana wallet, which already holds SOL (withdrawing a position requires it).
Receiving on EVM needs no gas. So the deposit-direction "receiver has no SOL"
problem does NOT occur here.

## UI

The Send sheet becomes **"Send / Withdraw"**:
- **You send:** pick a held asset (SOL / USDC / SPL).
- **To:** destination chain selector (Solana / Base / Ethereum / Arbitrum /
  Optimism / Polygon) + destination asset + address (prefilled with the user's
  linked wallet for that chain, editable).
- Solana same-asset = today's transfer; other cases route via swap / bridge.
- Status + result link (Solscan for Solana, the bridge scan URL for cross-chain).

**Export** (Privy key export) is unchanged — separate concern (own the key, not a
transfer).

## Build order

1. `chooseOutboundPath` + validation helpers (pure, tested).
2. Cross-chain withdraw (Solana→EVM via Delora) — the new capability; resolve the
   SVM-origin signing format. Server route reuses `/api/bridge-quote`.
3. Fold the destination chain+asset picker into the Send sheet; wire the router.
4. Solana different-asset (Jupiter swap-out) — lower priority.

## Out of scope (now)

- **Bitcoin** — Delora has no BTC chain (EVM + Solana only).
- **Position → other-asset in one tap** — for now Withdraw a position to USDC,
  then use this flow. One-tap withdraw-into-asset is a later enhancement.
