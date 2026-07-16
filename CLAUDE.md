# OXAR Protocol -- Project-Wide CLAUDE.md

## What is OXAR

OXAR is a non-custodial yield app on Solana — "where your money sleeps." v1 is a
**UI over third-party DeFi protocol SDKs** (live: Jupiter Lend USDC): users deposit/
withdraw straight into the protocol from their own wallet and hold their own position.
OXAR ships **no smart contract of its own in v1** — the live product is the `web/` app.

> Origin & future: OXAR began as an RWA/bond-tokenization protocol with its own Anchor
> program (see `contracts/`, kept for future phases). v1 deliberately pivoted to the
> SDK-frontend model — see `docs/plans/2026-05-29-web-sdk-migration-design.md`.

## Repository Structure

```
OXAR/
  web/                       Next.js app — THE live product (yield UI over protocol SDKs)
  sdk/                       Shared TS SDK (@oxar/sdk) — yield-source catalog (+ legacy contract bindings)
  contracts/oxar-protocol/   Solana/Anchor program (Rust) — NOT used by v1; kept for future phases
  radar/ + packages/         radar.oxar.app (separate product) + shared radar-core
  docs/                      Protocol & design docs (docs/plans/ has the current direction)
```

Each sub-project has its own CLAUDE.md. Read it before working there.

## Key Identifiers

- **Network**: Solana **Mainnet** (v1 — Jupiter Lend / Kamino only exist on mainnet)
- **Own program**: none deployed or used by v1. `contracts/` holds the legacy Anchor
  program (Program ID `8RCVjQJhfcRYVpAM8v4jhvvbhjfkdqFwPtffEKNcBQwJ`) for future phases.
- **Privy App ID**: `cmmzf4k4s00g80cjywxio7b89`
- **RPC**: Helius mainnet via `NEXT_PUBLIC_SOLANA_RPC_URL` (see web/src/lib/constants.ts)

## Universal Coding Principles

These apply to ALL code in the project, regardless of language:

1. **Small files** -- max 200 lines per file. Split into modules/components when approaching that limit.
2. **Single responsibility** -- one function, one purpose. One file, one concern.
3. **No code duplication -- shared logic goes in `@oxar/sdk`, written there FROM THE START.** Any framework-agnostic money-path logic (pure computation, request-building/parsing, tx transforms — anything with ZERO react/next/privy/DOM imports and no relative `/api` coupling) belongs in `sdk/src/core/`, NOT in `web/src/lib`. Write it there directly so web and the future mobile app reuse one implementation — do not put it in `web/` and extract later. Import via `@oxar/sdk`; after editing `sdk/`, run `yarn sync-sdk` and commit the regenerated `sdk-local/dist`. Shared constants both web and contracts need also live in `sdk/` (kept in sync with `contracts/.../constants.rs`).
4. **Typed everything** -- interfaces/structs for all data structures. No `any` in TypeScript unless documented with a `// SAFETY:` comment explaining why.
5. **Error handling** -- always handle errors. User-facing code shows friendly messages. Internal code uses typed errors.
6. **Security first** -- validate all inputs, check authorities, use checked math.
7. **Comments** -- only for non-obvious logic. Code should be self-documenting through naming.
8. **Convention over configuration** -- follow the patterns already established in the codebase.

## Development Workflows

Every task follows a structured workflow. Skills are MANDATORY at each step — do not skip them.

**Security note:** The `security-guidance` plugin runs automatically as a hook on every Edit/Write operation. It checks for command injection, XSS, unsafe patterns, etc. No manual invocation needed — it's always active. For deep security audits (before production deploy), use the code-reviewer agent with security focus.

### New Feature
```
1. /brainstorming          → understand requirements, explore approaches
2. /write-plan             → break into implementation steps
3. /feature-dev            → implement with architecture focus
4. Run tests               → contracts: anchor test, web: yarn build
5. /simplify               → check changed files for quality/duplication
6. /code-review            → full review against CLAUDE.md rules
7. /commit                 → commit via skill (formats message, stages files)
```

### Bug Fix
```
1. /systematic-debugging   → find root cause, don't guess
2. Fix                     → implement the fix
3. Run tests               → verify fix doesn't break existing functionality
4. /simplify               → check quality of changes
5. /commit                 → commit via skill
```

### Refactoring
```
1. /write-plan             → plan what to change and why
2. Implement               → make changes
3. Run tests               → verify refactoring doesn't break anything
4. /simplify               → check for duplication, dead code
5. /code-review            → review against CLAUDE.md
6. /commit                 → commit via skill
```

### Before Push/PR (always)
```
1. Run tests               → full test suite must pass
2. /simplify               → final quality check
3. /commit-push-pr         → push + create PR via skill
```

### Running Tests
```bash
# Contracts (requires localnet validator)
pkill -f solana-test-validator; rm -rf /tmp/oxar-test-ledger
COPYFILE_DISABLE=1 solana-test-validator --ledger /tmp/oxar-test-ledger &
sleep 8 && solana program deploy target/deploy/oxar_protocol.so
ANCHOR_PROVIDER_URL=http://localhost:8899 ANCHOR_WALLET=~/.config/solana/id.json \
  npx ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts

# Web
cd web && yarn build
```

### Rules
- **Never skip /simplify** — it catches duplication, dead code, and quality issues
- **Never skip /security-guidance** — any code change can introduce vulnerabilities
- **Always commit via /commit skill** — ensures consistent commit messages
- **Block on critical issues** — if simplify or review finds critical problems, fix them before committing
- **Important issues** — fix if quick (<5 min), otherwise create a TODO and continue
- **Suggestions** — note and move on, fix in a dedicated cleanup pass

## Git Conventions

### All changes land via PR — never push to `main`
Every change reaches `main` through a Pull Request. Do NOT commit or push
directly to `main`. Work on a `feat/…`/`fix/…`/`chore/…` branch → open a PR →
merge. Merging to `main` is what deploys the web app (see `web/CLAUDE.md`
"Deploy"), so a direct push would ship unreviewed and can desync prod.

### Branch Naming
```
feat/short-description
fix/short-description
chore/short-description
docs/short-description
```

### Commit Messages
Use conventional commits:
```
feat: add war bond vault initialization
fix: correct NAV overflow on large deposits
chore: update anchor to 0.30.1
docs: add marketplace architecture diagram
refactor: extract PDA derivation to shared module
```

Keep the subject line under 72 characters. Add a body for non-trivial changes.

### What NOT to commit
- `.env` files or secrets
- `node_modules/`, `target/`, `dist/`
- Solana keypair files (`*.json` wallets)
- IDE-specific files (`.idea/`, `.vscode/settings.json`)

## Cross-Repo Dependency Chain

v1 `web/` consumes only the **yield-source catalog** from `@oxar/sdk` (`YIELD_SOURCES`,
`APY_BUCKETS`); it does NOT use the contract IDL or PDA bindings. `web/` links the SDK
via `file:./sdk-local` (a built copy of `sdk/dist`).

The `contracts → IDL → sdk → web` chain below applies ONLY to the legacy contract path
(`contracts/`), which v1 does not use — relevant again only if a future phase wires the
program back in:
1. Update Rust in `contracts/` → `anchor build` regenerates the IDL
2. Copy IDL to `sdk/src/idl.json`; update `sdk/src/types.ts` if account shapes changed
3. `yarn build` in `sdk/`; copy `sdk/dist` into `web/sdk-local/`

## PDA Seed Convention

Not used by v1 (no own program in the live flow). The authoritative, current seed table
lives in `contracts/CLAUDE.md` (kept in sync with `contracts/.../constants.rs`). The list
previously shown here was stale (old bond-vault + marketplace seeds).

## Yield Sources (v1)

v1 has no OXAR-issued bond vaults. The app routes funds into third-party protocols:
- **Live**: Jupiter Lend USDC (mainnet) — `web/src/lib/yield/jupiter.ts`.
- **Catalog / roadmap**: `YIELD_SOURCES` in `sdk/src/constants.ts` (shown on `/markets`),
  surfaced through the `YieldProvider` interface (`web/src/lib/yield/`).

(The original six Ukrainian bond vaults — `UA-UAH-SHORT` etc. — were part of the
pre-pivot RWA design and are not in v1.)
