# Web -- CLAUDE.md

Read the root `/OXAR/CLAUDE.md` first for project-wide context.

## Stack

- **Next.js** 14.2 with App Router
- **React** 18
- **TypeScript** 5 (strict)
- **Privy** for auth and embedded Solana wallets
- **@solana/web3.js** 1.x for transaction handling
- **@coral-xyz/anchor** 0.32 for program interaction
- **Tailwind CSS** 3.4 + **shadcn/ui** for components
- **Lucide** for icons
- SDK via `@oxar/sdk` (linked as `file:./sdk-local`)

## File Structure

```
src/
  app/
    layout.tsx            Root layout with providers
    page.tsx              Landing / home
    login/                Auth page
    vaults/               Vault listing
    vault/                Single vault detail + deposit
    portfolio/            User portfolio
    marketplace/          Secondary market listings
    api/
      faucet/             Devnet USDC faucet API route
      faucet-sol/         Devnet SOL faucet API route
  components/
    ui/                   shadcn/ui primitives (Button, Card, etc.)
    vault-card.tsx        Vault display card
    nav.tsx               Navigation bar
  hooks/
    use-oxar-program.ts   Creates Anchor program instance from Privy wallet
    use-deposit.ts        Deposit into vault
    use-claim.ts          Claim matured bonds
    use-create-listing.ts Create marketplace listing
    use-cancel-listing.ts Cancel own listing
    use-buy-listing.ts    Buy someone's listing
    use-listings.ts       Fetch marketplace listings
    use-vault.ts          Fetch single vault
    use-vaults.ts         Fetch all vaults
    use-portfolio.ts      Fetch user's positions
  providers/
    providers.tsx         Combines all providers
    privy-provider.tsx    Privy config (embedded Solana wallet, dark theme)
    solana-provider.tsx   Solana connection provider
  lib/
    pda.ts               PDA derivation (mirrors SDK, used by hooks)
```

## Rules

### "use client" Directive
Every file that uses React hooks (`useState`, `useEffect`, `useCallback`, custom hooks) or browser APIs MUST start with `"use client";`. This includes all pages that have interactive content, which in practice means nearly all pages.

Server Components are used only for `layout.tsx` and static content.

### Component Size Limit
Max ~200 lines per component file. If a component grows beyond that:
1. Extract UI sub-components to their own files
2. Extract logic into a custom hook in `hooks/`
3. Extract utility functions into `lib/`

### Separate UI from Logic
Components should be thin -- they render JSX and call hooks. Business logic lives in hooks:
```
GOOD: Component calls useDeposit() hook, renders button + loading state
BAD:  Component contains inline transaction building, account fetching, error parsing
```

### One Hook per Contract Instruction
Each contract instruction gets its own hook file:
- `use-deposit.ts` for the `deposit` instruction
- `use-create-listing.ts` for `create_listing`
- etc.

Each hook returns `{ actionFn, loading, error }` pattern.

### Transaction Pattern
All hooks follow the same flow:
```typescript
// 1. Build instruction via Anchor program.methods
const ix = await program.methods
  .deposit(amount)
  .accounts({ ... } as any)  // SAFETY: Anchor IDL typing incomplete
  .instruction();

// 2. Create Transaction, add instructions (including ATA creation if needed)
const tx = new Transaction();
tx.add(ix);

// 3. Set blockhash and feePayer
const { blockhash } = await connection.getLatestBlockhash();
tx.recentBlockhash = blockhash;
tx.feePayer = walletAddress;

// 4. Sign via Privy wallet adapter
const signed = await program.provider.wallet!.signTransaction(tx);

// 5. Send raw transaction
const signature = await connection.sendRawTransaction(signed.serialize());
```

Do NOT use `program.methods.*.rpc()` -- it does not work with Privy's embedded wallet. Always build instruction, sign manually, send raw.

### Privy Integration
Privy is configured in `providers/privy-provider.tsx`:
- `createOnLogin: "all-users"` -- every user gets an embedded Solana wallet
- `walletChainType: "solana-only"` -- no EVM
- Privy theme configured in `privy-provider.tsx`
- External wallet connectors enabled (Phantom, etc.)
- RPC: Helius devnet endpoint

The `use-oxar-program.ts` hook bridges Privy wallet to an Anchor `Program` instance.

### Styling
- **Tailwind CSS** for all styling. No CSS modules, no styled-components.
- **shadcn/ui** for base components (`Button`, `Card`, `Input`, etc.). They live in `components/ui/`.
- Design system (colors, theme, typography) is TBD — will be defined by design phase.
- Use `class-variance-authority` (cva) for component variants.
- Use `clsx` + `tailwind-merge` (via `cn()` utility) for conditional classes.

### State Management
- React hooks only (`useState`, `useEffect`, `useCallback`, `useMemo`)
- No Redux, no Zustand, no global state libraries
- Data fetching happens in hooks, not in components
- Pass data down via props, lift state up when needed

### Import Order
Group imports in this order, separated by blank lines:
```typescript
"use client";

// 1. React / Next.js
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// 2. External libraries
import { PublicKey, Transaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

// 3. Internal: SDK / lib
import { PROGRAM_ID, deriveVaultPda } from "@oxar/sdk";

// 4. Internal: hooks, components, providers
import { useOxarProgram } from "@/hooks/use-oxar-program";
import { Button } from "@/components/ui/button";
```

### Environment Variables
- Client-side: `NEXT_PUBLIC_*` prefix (e.g., `NEXT_PUBLIC_PRIVY_APP_ID`)
- Server-side only: no prefix (used in API routes)
- Currently some values are hardcoded in source (Privy app ID, Helius RPC). This is acceptable for the hackathon MVP but should move to env vars for production.

### API Routes
Server-side routes live in `src/app/api/`. Currently:
- `faucet/` -- mints devnet USDC to user
- `faucet-sol/` -- airdrops devnet SOL to user

API routes can use Node.js APIs and secrets. They must validate all input parameters.

### Performance
- No polling. Fetch data on mount and after user actions, not on intervals.
- Cache RPC responses where possible (vault data rarely changes between user actions).
- Lazy load heavy components (marketplace, portfolio).
- Minimize RPC calls -- batch where possible, derive what you can locally.

### Adding a New Page
1. Create `src/app/new-page/page.tsx` with `"use client";`
2. Create any needed hooks in `src/hooks/`
3. Create sub-components if the page exceeds 200 lines
4. Add navigation link in `components/nav.tsx`
5. Follow the existing layout pattern (consistent header, padding, max-width)

## Build and Dev

```bash
# Development (from web/)
yarn dev          # starts on localhost:3000

# Production build
yarn build

# Lint
yarn lint

# After SDK changes, copy updated SDK:
cp -r ../sdk/dist ./sdk-local/dist
cp ../sdk/package.json ./sdk-local/
```

## Common Pitfalls
- Forgetting `"use client"` on a page that uses hooks -- causes cryptic server-side errors
- Using `program.methods.*.rpc()` instead of manual sign+send -- fails with Privy wallet
- Not creating Associated Token Account before token operations -- transaction will fail
- Hardcoded RPC keys in source -- acceptable for hackathon, must fix before production
- `as any` on `.accounts()` -- necessary because Anchor's TypeScript types don't perfectly match the IDL, but ONLY use it there
