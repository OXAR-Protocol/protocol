# OXAR Protocol

OXAR is a **non-custodial yield app on Solana** — "where your money sleeps." v1 is a
UI over third-party DeFi protocol SDKs (live: Jupiter Lend USDC): users deposit and
withdraw straight into the protocol from their own wallet and hold their own position.
v1 ships no smart contract of its own — the live product is the `web/` app.

> Origin & future: OXAR began as an RWA / sovereign-debt tokenization protocol with its
> own Anchor program. v1 deliberately pivoted to the SDK-frontend model
> (see `docs/plans/2026-05-29-web-sdk-migration-design.md`). The `contracts/` program is
> kept for future phases but is **not used by v1**.

This is the OXAR monorepo. All product code lives here.

## Repository layout

```
web/         Next.js app — THE live product (yield UI over protocol SDKs)
sdk/         Shared TypeScript SDK (@oxar/sdk) — yield-source catalog (+ legacy contract bindings)
contracts/   Solana / Anchor program (Rust) — NOT used by v1; kept for future phases
radar/       radar.oxar.app — separate product (+ packages/radar-core)
docs/        Protocol & design docs (docs/plans/ has the current direction)
deck/        Pitch deck (HTML, PDF, scripts)
oxar-icons/  Brand icons and social assets
```

Each top-level package has its own `CLAUDE.md`; the root `CLAUDE.md` defines
project-wide rules.

## Key identifiers

- **Network**: Solana **Mainnet** (v1 — Jupiter Lend / Kamino only exist on mainnet)
- **Own program**: none deployed or used by v1 (`contracts/` holds the legacy program for future phases)
- **Web app**: https://app.oxar.app

## Quick start

The live product is `web/`:

```bash
cd web
yarn install
yarn dev          # localhost:3000
```

`web/` links a locally built copy of the SDK at `web/sdk-local/`. After changing `sdk/`,
rebuild and copy `dist/` into `web/sdk-local/dist/` (see `web/CLAUDE.md`). The `contracts/`
and `sdk/` build steps are only relevant when working the (future) contract path.

## License

Proprietary. See [LICENSE](LICENSE) for terms. All rights reserved by OXAR Protocol.
