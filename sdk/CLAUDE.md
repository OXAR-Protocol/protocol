# SDK -- CLAUDE.md

Read the root `/OXAR/CLAUDE.md` first for project-wide context.

## Purpose

`@oxar/sdk` is the shared TypeScript package that provides types, constants, and PDA derivation.

> **v1 usage:** the live `web/` app consumes only the **yield-source catalog**
> (`YIELD_SOURCES`, `APY_BUCKETS`). The contract bindings here — `PROGRAM_ID`, `idl.json`,
> the `derive*Pda` functions — are **not used by v1** (kept for the future contract path /
> other consumers like mobile, CLI, bots).

Transaction building is **not** in scope — consumers build and sign transactions
themselves (v1 `web/` builds instructions via protocol SDKs like Jupiter Lend, then
manual sign+send through the Privy embedded wallet).

## Stack

- **TypeScript** 5.4+ with strict mode
- **@coral-xyz/anchor** ^0.31.1
- **@solana/web3.js** ^1.91.0
- No React. No browser APIs. No DOM.

## File Structure

```
src/
  index.ts          Re-exports everything. This is the public API.
  constants.ts      PROGRAM_ID, RPC_URL, math constants, YIELD_SOURCES, APY_BUCKETS
  types.ts          IDL TypeScript type export (OxarProtocol) — regenerated from anchor build
  idl.json          Anchor-generated IDL (copied from contracts build)
  pda.ts            PDA derivation functions
```

## Rules

### No React, No Browser Code
This package runs in Node.js, React Native, and browsers. It must NOT import:
- `react`, `react-dom`, or any UI framework
- `window`, `document`, `localStorage`, or any Web API
- `next`, `next/server`, or any framework-specific module
- `fs`, `path`, or Node-only modules

### Export Everything from index.ts
Every public function, type, constant, and interface MUST be re-exported from `index.ts`. Consumers should never import from internal paths like `@oxar/sdk/dist/pda`.

### PDA Derivation Must Match Contract Seeds Exactly
Every `derive*Pda` function in `pda.ts` must produce the same address as the Rust `seeds` in the contract. If the contract changes seeds, update `pda.ts` immediately.

Current PDA functions:
- `derivePersonalVaultPda(creator, vaultId)` — `["vault", creator, vaultId LE u64]`
- `deriveGroupVaultPda(creator, vaultId)` — `["group", creator, vaultId LE u64]`
- `deriveGroupMemberPda(groupVault, member)` — `["member", groupVault, member]`
- `deriveRulePda(owner, ruleId)` — `["rule", owner, ruleId LE u64]`
- `deriveMintPda(vault)` — `["mint", vault]`
- `derivePoolPda(vault)` — `["pool", vault]`

### Keep Constants in Sync
`constants.ts` has values that mirror `contracts/.../constants.rs`:
- `PROGRAM_ID` must match `declare_id!()` in `lib.rs`
- `INITIAL_NAV`, `NAV_PRECISION`, `USDC_DECIMALS` mirror the contract
- `YIELD_SOURCES` and `APY_BUCKETS` are SDK-only (UI catalog — the part v1 actually uses)

### TypeScript Strict Mode
`tsconfig.json` uses strict mode. Respect it:
- No implicit `any`
- No unused variables
- Explicit return types on exported functions
- Use `readonly` for data that should not be mutated

### When to Use `any`
Almost never. If you must, add a comment:
```typescript
// SAFETY: Anchor IDL typing is incomplete for dynamic account resolution
.accounts({...} as any)
```

## Build

```bash
# Build (from sdk/)
yarn build        # runs tsc, outputs to dist/

# After building, copy to web:
cp -r dist ../web/sdk-local/dist
cp src/idl.json ../web/sdk-local/dist/idl.json
```

## Updating after contract changes

After `anchor build` in `contracts/`:
```bash
cp ../contracts/target/idl/oxar_protocol.json src/idl.json
cp ../contracts/target/types/oxar_protocol.ts src/types.ts
yarn build
# Then sync to web (see web/CLAUDE.md "After SDK changes")
```

The `types.ts` file IS the Anchor-generated `OxarProtocol` type — overwrite it wholesale on each rebuild. Do not hand-edit.
