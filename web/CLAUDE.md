# Web -- CLAUDE.md

Read the root `/OXAR/CLAUDE.md` first for project-wide context.

## Stack

- **Next.js** 16 (Turbopack), App Router
- **React** 18
- **TypeScript** 5 (strict)
- **Privy** (`@privy-io/react-auth`) for auth and embedded Solana wallets
- **@solana/web3.js** 1.x for tx assembly; **@jup-ag/lend** (Jupiter Lend SDK) builds the deposit/withdraw instructions (`@coral-xyz/anchor` is only a transitive dep — v1 calls no own program)
- **Tailwind CSS** + shadcn/ui primitives, **framer-motion**, **lucide-react**
- Geist Sans / Geist Mono typography
- SDK via `@oxar/sdk` (linked as `file:./sdk-local`)
- Supabase (server-side, waitlist persistence)
- Delora API (cross-chain bridge — server-side calls only, key in env)

## Domain split

Two hosts share one Next.js app, routed by `src/middleware.ts`:
- `oxar.app` — marketing (`/`, `/investors`, `/terms`, `/docs`, `/kit`, `/pitch`)
- `app.oxar.app` — authenticated app (`/home`, `/yield`, `/pile`, `/markets`, `/you`, `/onboarding`, `/login`)

When adding a new authenticated route, append it to `APP_ROUTES` in `middleware.ts` so cross-domain redirects work.

## File Structure

```
src/
  app/
    (app)/                Authenticated routes (auth-guarded)
      layout.tsx          Providers + tab-bar + warp transitions
      home/               Greeting + balance + top markets
      yield/              Yield sources — open one to deposit/withdraw (live: Jupiter Lend)
      pile/               Your pile — live positions across every source (portfolio)
      markets/            Yield-source catalog (roadmap sources)
      you/                Settings, wallet, sign-out
      onboarding/         First-run onboarding
      login/              Privy login
    investors/, terms/, docs/, kit/, pitch/   Marketing pages
    page.tsx              Landing
    layout.tsx            Root layout (fonts, metadata)
    api/
      faucet/             USDC faucet (admin-mint, test)
      faucet-sol/         SOL airdrop (test)
      waitlist/           Supabase write
  components/
    ui/                   shadcn-style primitives (button, card, dialog, input, …)
    pitch/, sections/, waitlist/, context/   Marketing-page sub-components
    yield-source-sheet.tsx, yield-amount-field.tsx, yield-action-success.tsx   Deposit/withdraw UI
    custom-select.tsx     Branded dropdown (replaces native <select>)
    tab-bar.tsx, top-nav.tsx, auth-guard.tsx
    section-label.tsx, warp-transition.tsx, warp-on-entry.tsx
  hooks/
    use-yield-positions.ts     APY + the wallet's position per provider
    use-yield-actions.ts       deposit / withdraw / redeemAll (Privy sign+send)
    use-aggregate-balance.ts   Sum across all provider positions
    use-waitlist.ts            Waitlist submit (marketing)
    use-count-up.ts, use-animated-progress.ts, use-canvas-perf.ts   UI helpers
  providers/
    providers.tsx, privy-provider.tsx, solana-provider.tsx
  lib/
    constants.ts          RPC_URL / USDC mint + yield-source catalog re-export (from @oxar/sdk)
    yield/                Provider abstraction: types, registry, jupiter, units, display, errors
    cache.ts, supabase-server.ts, …
```

## Rules

### "use client" Directive
Every file that uses React hooks or browser APIs MUST start with `"use client";`. Server Components are used only for `layout.tsx` and static marketing content.

### Component Size Limit
Max ~200 lines per component file. Split into sub-components / hooks / lib helpers when approaching.

### Shared logic → `@oxar/sdk` (write it there from the start)
Framework-agnostic money-path logic — pure computation, request-building/parsing, tx
transforms; **anything with ZERO react/next/privy/DOM imports and no relative `/api`
coupling** — lives in **`sdk/src/core/`**, NOT `web/src/lib`. Write NEW shared logic
there directly so web + the future mobile app reuse one implementation; don't put it in
`web/` and extract later. Import via `@oxar/sdk`. After editing `sdk/`, run `yarn sync-sdk`
and commit the regenerated `sdk-local/dist` (its `dist/` is un-ignored). Already in core:
`units, fetch-retry, evm-assets, assets, delora, jupiter-swap, kora-tx`. Keep in `web/`
only platform-bound code: React hooks/components/providers, Next API routes, and
`/api`-coupled clients (`evm/chains`, `evm/erc20`, `gas/kora`, `bridge/arrival`, `helius/history`).
Tests for core logic live in `web/` importing `@oxar/sdk` (sdk has no test runner yet).

### Separate UI from Logic
Components are thin — JSX + hook calls. Business logic lives in `hooks/`. Instructions
are built by the yield provider's SDK (e.g. `YieldProvider.buildDepositIxs`), then
assembled and sent in `use-yield-actions.ts`.

### Yield provider abstraction
Every source implements the `YieldProvider` interface (`lib/yield/types.ts`); the
registry (`lib/yield/registry.ts`) lists the live ones (v1: Jupiter Lend, `jupiter.ts`).
Adding an asset = add a provider, no UI changes. Action hooks return `{ ..., loading, error }`.

### Transaction Pattern (Privy)
```typescript
// Build provider instructions, then sign+send with the Privy embedded wallet.
const ixs = await yieldProvider.buildDepositIxs({ owner, amount, connection });

const tx = new Transaction().add(...ixs);
const { blockhash } = await connection.getLatestBlockhash();
tx.recentBlockhash = blockhash;
tx.feePayer = walletAddress;

const signed = await wallet.signTransaction(tx);
const sig = await connection.sendRawTransaction(signed.serialize());
await connection.confirmTransaction(sig, "confirmed");
```

Do NOT use `.rpc()` / auto-send — it fails with the Privy embedded wallet; always do
manual sign+send. The Jupiter Lend SDK creates the needed ATAs idempotently — do NOT
add your own ATA-creation instructions in deposit/withdraw or you double-create.

### Privy Integration
`providers/privy-provider.tsx`:
- `createOnLogin: "all-users"` — every login gets an embedded Solana wallet
- `walletChainType: "solana-only"`
- External connectors (Phantom, etc.) enabled
- RPC: Helius **mainnet**

`providers/solana-provider.tsx` exposes the Privy wallet + connection consumed by
`use-yield-actions.ts` / `use-yield-positions.ts`.

### Styling
- Tailwind only. No CSS modules.
- shadcn-style primitives in `components/ui/`
- Use `class-variance-authority` (cva) for variants
- Use `cn()` (clsx + tailwind-merge) for conditional classes
- Brand voice: monospace + editorial serif, warm amber accent, dark default, hairline borders. Avoid neon / glassmorphism / generic web3 gradients.

### Custom Dropdowns
Use `components/custom-select.tsx` instead of native `<select>` — native elements render OS-styled menus that break the visual system. The custom one supports keyboard nav, click-outside-to-close, and selected-state check icons.

### State Management
React hooks only. No Redux / Zustand / global state. Data fetched in hooks, passed via props.

### Import Order
```typescript
"use client";

// 1. React / Next.js
// 2. External libraries (solana, anchor, privy, framer-motion, lucide)
// 3. Internal: @oxar/sdk
// 4. Internal: @/hooks, @/components, @/providers, @/lib
```

### Environment Variables
- Client: `NEXT_PUBLIC_*` prefix
- Server: no prefix (api routes, supabase server client, delora key)
- `.env.local` (gitignored), prod env in Vercel dashboard
- **`vercel env add` gotcha**: pipe with `printf '%s'`, not `echo` — `echo` appends `\n` and breaks SDKs (Privy/Helius keys silently fail).

### API Routes
Server-side only. Validate all input. Currently:
- `faucet/` mints devnet USDC
- `faucet-sol/` airdrops devnet SOL
- `waitlist/` writes to Supabase

### Performance
- No polling. Fetch on mount + after user actions.
- Cache RPC where possible (`lib/cache.ts`).
- Minimize RPC calls — batch / derive locally.

### Adding a New Page
1. Create `src/app/(app)/new-page/page.tsx` with `"use client";`
2. If authenticated: add `"/new-page"` to `APP_ROUTES` in `middleware.ts`
3. Add hooks in `src/hooks/` if needed
4. Add nav link in `components/tab-bar.tsx` or link from `/you`
5. Keep file < 200 lines — extract sub-components

## Build and Dev

```bash
# Development (from web/)
yarn dev          # localhost:3000

# Production build (verify locally before merging)
yarn build
```

## Deploy — DO NOT IMPROVISE

Deploy is **git-based auto-deploy**. One correct path, no exceptions:
1. PR into `main` → Vercel builds a **preview** automatically.
2. Merge to `main` → auto-deploys to production (oxar.app / app.oxar.app).

- **Canonical Vercel project = `oxar-web`** (owns the live domains + all env vars).
  A second project named **`web`** is a DECOY (no live domains, ~no env) — never deploy there.
- Do **NOT** run `vercel --prod`, `vercel build`, `--prebuilt`, or invent install-command
  workarounds. If a manual deploy is ever truly required, first confirm
  `web/.vercel/project.json` → `"projectName":"oxar-web"`.
- Settings (already configured): Production branch `main`, Root Directory `web`,
  Build Command `yarn build` (runs `prebuild` to copy `sdk-local`).
- Env vars live in the `oxar-web` Vercel project dashboard, not in code.

### After SDK changes
`web/sdk-local/dist` is a **committed copy** of `sdk/dist` — that's what keeps `web/` a
self-contained Vercel build (see Deploy). After editing `sdk/`, resync with one command
from `web/`:
```bash
yarn sync-sdk   # rebuilds sdk → refreshes sdk-local/dist + idl.json → re-links into node_modules
```
Commit the updated `sdk-local/` alongside your `sdk/` change so the deploy build (which
copies `sdk-local/dist` in `prebuild`) ships the new SDK.

## Common Pitfalls
- Forgetting `"use client"` on a page that uses hooks → cryptic SSR errors
- Calling `.rpc()` / auto-send instead of manual sign+send → fails with the Privy embedded wallet
- Adding your own ATA-creation ix in deposit/withdraw → the Jupiter SDK already does it (double-create)
- Not creating Associated Token Account before token ops → transaction fails
- Adding a route to `(app)/` but forgetting to update `APP_ROUTES` in `middleware.ts` → cross-domain redirect breaks
- Using native `<select>` — breaks the visual system. Use `CustomSelect`.
- Treating `@solana/kit` and `@solana-program/memo` as removable — they're transitive deps of Privy's Solana connectors.

## Kamino / klend-sdk gotchas (server-side provider)

Kamino (`@kamino-finance/klend-sdk` v8) is built on `@solana/kit` v2 + WASM and is
**Node-only**. It's isolated to the server route `app/api/kamino/route.ts`
(+ `lib/yield/kamino-server.ts`); the client `lib/yield/kamino.ts` only fetches an
unsigned v0 tx and signs it with Privy. Hard-won setup (don't undo):
- **`serverExternalPackages`** in `next.config.ts` lists klend + orca/kliquidity/scope/
  farms — bundling them breaks the orca WASM path. Keep them external.
- **`@solana/kit` version split**: Privy uses kit v6 (top-level `@solana/kit`); klend
  uses kit v2. `kamino-server.ts` imports kit via the **`klend-kit`** alias
  (`npm:@solana/kit@2.3.0`) so signer/types match klend. Don't import klend-side kit
  from the top-level `@solana/kit`.
- **`resolutions: @kamino-finance/farms-sdk = 3.2.24`** in `package.json` — newer
  farms-sdk moved `@codegen/farms/programId` and breaks klend 8.0.2's import.
- Providers expose EITHER `build*Ixs` (Jupiter) OR `build*Tx` (Kamino) — see `types.ts`.
