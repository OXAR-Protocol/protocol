# OXAR Protocol -- Project-Wide CLAUDE.md

## What is OXAR

OXAR is a Real World Asset (RWA) tokenization protocol on Solana. It wraps Ukrainian government bonds (OVDPs and War Bonds) into on-chain vault tokens with daily NAV accrual and a secondary marketplace. The current MVP targets Ukraine-only bond types (UAH, USD, EUR denominations).

## Repository Structure

```
OXAR/
  contracts/oxar-protocol/   Solana/Anchor smart contracts (Rust)
  sdk/                       Shared TypeScript SDK (@oxar/sdk)
  web/                       Next.js 14 web application
  docs/                      Protocol documentation
  mobile/                    React Native app (future, empty)
```

Each repo has its own CLAUDE.md with specific rules. Read them before working in that repo.

## Key Identifiers

- **Program ID**: `8NsGNHMtfEiJzSczdmN2reo26h75C4axamuLXdk2tfrT`
- **Network**: Solana Devnet
- **Privy App ID**: `cmmzf4k4s00g80cjywxio7b89`
- **RPC**: Helius devnet endpoint (see web/src/providers/privy-provider.tsx)

## Universal Coding Principles

These apply to ALL code in the project, regardless of language:

1. **Small files** -- max 200 lines per file. Split into modules/components when approaching that limit.
2. **Single responsibility** -- one function, one purpose. One file, one concern.
3. **No code duplication** -- shared logic lives in `sdk/`. If both web and contracts need a constant, it belongs in `sdk/src/constants.ts` and `contracts/.../constants.rs` and MUST stay in sync.
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

```
contracts (Rust) --> builds IDL --> sdk copies IDL --> web imports sdk
```

When changing the contract:
1. Update Rust code in `contracts/`
2. Build with `anchor build` to regenerate IDL
3. Copy updated IDL to `sdk/src/idl.json`
4. Update `sdk/src/types.ts` if account shapes changed
5. Rebuild SDK with `yarn build` in `sdk/`
6. Copy updated dist to `web/sdk-local/` (web uses `file:./sdk-local` dependency)
7. Test in web

## PDA Seed Convention

All PDAs follow a consistent pattern. Seeds MUST match between Rust and TypeScript:

| PDA     | Seeds                                                   |
|---------|---------------------------------------------------------|
| Vault   | `"vault"` + region + denomination + asset_subtype + series (u16 LE) |
| Mint    | `"mint"` + vault pubkey                                 |
| Pool    | `"pool"` + vault pubkey                                 |
| Listing | `"listing"` + vault pubkey + seller pubkey              |
| Escrow  | `"escrow"` + vault pubkey + seller pubkey               |

## Vault Configurations (MVP)

Six vault types, all Ukraine, all series=1:
- `UA-UAH-SHORT` (18% APY) -- Short-term OVDP, UAH
- `UA-UAH-MID` (17% APY) -- Mid-term OVDP, UAH
- `UA-USD-STD` (4% APY) -- OVDP, USD
- `UA-EUR-STD` (3.5% APY) -- OVDP, EUR
- `UA-UAH-WAR` (18% APY) -- War Bonds, UAH
- `UA-USD-WAR` (4% APY) -- War Bonds, USD
