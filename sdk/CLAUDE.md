# SDK -- CLAUDE.md

Read the root `/OXAR/CLAUDE.md` first for project-wide context.

## Purpose

`@oxar/sdk` is the shared TypeScript package that provides types, constants, PDA derivation, and transaction builders used by both the web app and future consumers (mobile, CLI, bots). It is the single source of truth for everything TypeScript needs to interact with the OXAR contract.

## Stack

- **TypeScript** 5.4+ with strict mode
- **@coral-xyz/anchor** ^0.30.1
- **@solana/web3.js** ^1.91.0
- **@solana/spl-token** ^0.4.6
- No React. No browser APIs. No DOM.

## File Structure

```
src/
  index.ts          Re-exports everything. This is the public API.
  constants.ts      PROGRAM_ID, RPC_URL, vault configs, helpers
  types.ts          IDL type export (OxarProtocol)
  idl.json          Anchor-generated IDL (copied from contracts build)
  pda.ts            PDA derivation functions
  program.ts        createOxarProgram factory
  transactions.ts   Transaction/instruction builders
```

## Rules

### No React, No Browser Code
This package runs in Node.js, React Native, and browsers. It must NOT import:
- `react`, `react-dom`, or any UI framework
- `window`, `document`, `localStorage`, or any Web API
- `next`, `next/server`, or any framework-specific module
- `fs`, `path`, or Node-only modules (use only `@solana/*` and `@coral-xyz/*`)

### Export Everything from index.ts
Every public function, type, constant, and interface MUST be re-exported from `index.ts`. Consumers should never import from internal paths like `@oxar/sdk/dist/pda`.

### Pure Functions for Transaction Building
Transaction builders in `transactions.ts` return `TransactionInstruction` or `Transaction` objects. They do NOT:
- Sign transactions
- Send transactions
- Access wallet state
- Manage connections

The caller (web app, script) handles signing and sending.

### PDA Derivation Must Match Contract Seeds Exactly
Every `derive*Pda` function in `pda.ts` must produce the same address as the Rust `seeds` in the contract. If the contract changes seeds, update `pda.ts` immediately.

Current PDA functions:
- `deriveVaultPda(region, denomination, assetSubtype, series)` -- series as u16 LE bytes
- `deriveMintPda(vaultPubkey)`
- `derivePoolPda(vaultPubkey)`
- `deriveListingPda(vaultPubkey, sellerPubkey)`
- `deriveEscrowPda(vaultPubkey, sellerPubkey)`

### Keep Constants in Sync
`constants.ts` has values that mirror `contracts/.../constants.rs`:
- `PROGRAM_ID` must match `declare_id!()` in `lib.rs`
- Vault configs define the supported bond types for the MVP
- If the contract adds a new seed or constant, add it here too

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

### Adding a New Transaction Builder
1. Add the function to `transactions.ts`
2. Export it from `index.ts`
3. Ensure all PDA derivations use functions from `pda.ts` (no inline seed computation)
4. Accept `PublicKey` for accounts, primitives for parameters
5. Return the instruction, not a signed transaction

## Build

```bash
# Build (from sdk/)
yarn build        # runs tsc, outputs to dist/

# Clean
yarn clean        # removes dist/

# After building, copy to web:
cp -r dist ../web/sdk-local/dist
cp package.json ../web/sdk-local/
```

## Updating the IDL
After `anchor build` in contracts:
```bash
cp ../contracts/oxar-protocol/target/idl/oxar_protocol.json src/idl.json
```
Then update `types.ts` if the IDL shape changed, rebuild, and copy to web.
