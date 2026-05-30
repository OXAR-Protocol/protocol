# OXAR — web

The live OXAR product: a Next.js app (App Router) and non-custodial yield UI over
third-party DeFi protocol SDKs (v1: Jupiter Lend USDC on Solana mainnet). Users deposit/
withdraw straight into the protocol from their own Privy-embedded wallet and hold their
own position — OXAR runs no contract of its own in v1.

Two hosts share this app (routed by `src/middleware.ts`): `oxar.app` (marketing) and
`app.oxar.app` (the authenticated app).

## Develop

```bash
yarn install
yarn dev          # http://localhost:3000
yarn build        # production build (verify before merging)
```

## Conventions & deploy

See **`CLAUDE.md`** in this directory for stack, file structure, the Privy sign+send
transaction pattern, the `YieldProvider` abstraction, and the deploy rules (git
auto-deploy to the `oxar-web` Vercel project on merge to `main` — do not deploy manually).
