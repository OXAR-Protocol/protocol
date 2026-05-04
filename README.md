# OXAR Protocol

Real World Asset (RWA) tokenization protocol on Solana — wrapping sovereign and emerging-market debt instruments into on-chain vault tokens with daily NAV accrual and a secondary marketplace.

This is the OXAR Protocol monorepo. All product code lives here.

## Repository layout

```
contracts/   Solana / Anchor smart contracts (Rust)
sdk/         Shared TypeScript SDK (@oxar/sdk)
web/         Next.js 14 web application
mobile/      React Native app (planned)
docs/        Protocol documentation and architecture notes
deck/        Pitch deck (HTML, PDF, scripts)
oxar-icons/  Brand icons and social media assets
```

Each top-level package has its own `CLAUDE.md` with package-specific conventions. The root `CLAUDE.md` defines project-wide rules.

## Key identifiers

- **Network**: Solana Devnet
- **Program ID**: `8NsGNHMtfEiJzSczdmN2reo26h75C4axamuLXdk2tfrT`
- **Web app**: https://app.oxar.app

## Quick start

### Contracts

```bash
cd contracts
anchor build
anchor test
```

### SDK

```bash
cd sdk
yarn install
yarn build
```

### Web

```bash
cd web
yarn install
yarn dev
```

The web app depends on a locally built copy of the SDK at `web/sdk-local/`. After changing `sdk/`, rebuild and copy `dist/` into `web/sdk-local/dist/`.

## Cross-package dependency chain

```
contracts (Rust)  →  builds IDL  →  sdk copies IDL  →  web imports sdk
```

When changing the on-chain program, follow the propagation steps documented in `CLAUDE.md`.

## License

Proprietary. See [LICENSE](LICENSE) for terms. All rights reserved by OXAR Protocol.
