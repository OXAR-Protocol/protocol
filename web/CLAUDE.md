# Web -- CLAUDE.md

Read the root `/OXAR/CLAUDE.md` first for project-wide context.

## Stack

- **Next.js** 16 (Turbopack), App Router
- **React** 18
- **TypeScript** 5 (strict)
- **Privy** (`@privy-io/react-auth`) for auth and embedded Solana wallets
- **@solana/web3.js** 1.x + **@coral-xyz/anchor** ^0.31.1 for program interaction
- **Tailwind CSS** + shadcn/ui primitives, **framer-motion**, **lucide-react**
- Geist Sans / Geist Mono typography
- SDK via `@oxar/sdk` (linked as `file:./sdk-local`)
- Supabase (server-side, waitlist persistence)
- Delora API (cross-chain bridge — server-side calls only, key in env)

## Domain split

Two hosts share one Next.js app, routed by `src/middleware.ts`:
- `oxar.app` — marketing (`/`, `/investors`, `/terms`, `/docs`, `/kit`, `/pitch`)
- `app.oxar.app` — authenticated app (`/home`, `/yield`, `/pile`, `/markets`, `/rules`, `/you`, `/onboarding`, `/login`)

When adding a new authenticated route, append it to `APP_ROUTES` in `middleware.ts` so cross-domain redirects work.

## File Structure

```
src/
  app/
    (app)/                Authenticated routes (auth-guarded)
      layout.tsx          Providers + tab-bar + warp transitions
      home/               Greeting + balance + top markets
      yield/              Personal yield vault (per risk template)
      pile/               Group savings vaults (list, [id], create, join)
      markets/            Yield source catalog (Kamino, JLP, Maple, Delora)
      rules/              Sleeping patterns (auto-distribute triggers)
      you/                Settings, wallet, sign-out
      onboarding/         First-run onboarding
      login/              Privy login
    investors/, terms/, docs/, kit/, pitch/   Marketing pages
    page.tsx              Landing
    layout.tsx            Root layout (fonts, metadata)
    api/
      faucet/             Devnet USDC faucet
      faucet-sol/         Devnet SOL airdrop
      waitlist/           Supabase write
  components/
    ui/                   shadcn-style primitives (button, card, dialog, input, …)
    pitch/, sections/, waitlist/, context/   Marketing-page sub-components
    custom-select.tsx     Branded dropdown (replaces native <select>)
    tab-bar.tsx, top-nav.tsx, auth-guard.tsx
    section-label.tsx, warp-transition.tsx, warp-on-entry.tsx
  hooks/
    use-oxar-program.ts        Anchor Program from Privy wallet
    use-personal-vault.ts      Fetch one personal vault by template
    use-vault-actions.ts       deposit / withdraw / create / crank_nav
    use-group-vault.ts         Fetch user's group vaults
    use-group-vault-actions.ts initialize / join / deposit / withdraw / leave
    use-group-members.ts       Members of a group vault
    use-aggregate-balance.ts   Sum across personal + group
    use-rules.ts               Fetch + create + cancel rules
    use-usdc-balance.ts, use-faucet.ts
  providers/
    providers.tsx, privy-provider.tsx, solana-provider.tsx
  lib/
    constants.ts          PROGRAM_ID / RPC_URL / USDC mint (re-exports SDK)
    trigger-tokens.ts     Token catalog for rule triggers
    growth.ts, cache.ts, supabase-server.ts, …
```

## Rules

### "use client" Directive
Every file that uses React hooks or browser APIs MUST start with `"use client";`. Server Components are used only for `layout.tsx` and static marketing content.

### Component Size Limit
Max ~200 lines per component file. Split into sub-components / hooks / lib helpers when approaching.

### Separate UI from Logic
Components are thin — JSX + hook calls. Business logic lives in `hooks/`. Transaction building inline in hooks via `program.methods.*`.

### One Hook per Contract Instruction (or domain)
Each contract feature gets its own hook file:
- `use-vault-actions.ts` — personal vault writes
- `use-group-vault-actions.ts` — group vault writes
- `use-rules.ts` — rule create/cancel + fetch

Each action returns `{ fn, loading, error }`.

### Transaction Pattern (Privy + Anchor)
```typescript
const ix = await program.methods
  .deposit(amount)
  .accounts({ ... } as any)  // SAFETY: Anchor IDL typing incomplete
  .instruction();

const tx = new Transaction().add(ix);
const { blockhash } = await connection.getLatestBlockhash();
tx.recentBlockhash = blockhash;
tx.feePayer = walletAddress;

const signed = await provider.wallet.signTransaction(tx);
const sig = await connection.sendRawTransaction(signed.serialize());
await connection.confirmTransaction(sig, "confirmed");
```

**Always create Associated Token Accounts before token operations** — check via `connection.getAccountInfo(ata)` and `tx.add(createAssociatedTokenAccountInstruction(...))` if missing. Both deposit and withdraw flows handle this.

Do NOT use `program.methods.*.rpc()` — fails with Privy embedded wallet.

### Privy Integration
`providers/privy-provider.tsx`:
- `createOnLogin: "all-users"` — every login gets an embedded Solana wallet
- `walletChainType: "solana-only"`
- External connectors (Phantom, etc.) enabled
- RPC: Helius devnet

`use-oxar-program.ts` bridges the Privy wallet to an Anchor `Program`.

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
```bash
cd ../sdk && yarn build && cd ../web
rm -rf sdk-local/dist node_modules/@oxar .next
cp -r ../sdk/dist sdk-local/dist
cp ../sdk/src/idl.json sdk-local/dist/idl.json
yarn install   # re-links @oxar/sdk
```

## Common Pitfalls
- Forgetting `"use client"` on a page that uses hooks → cryptic SSR errors
- Using `program.methods.*.rpc()` instead of manual sign+send → fails with Privy
- Not creating Associated Token Account before token ops → transaction fails
- Adding a route to `(app)/` but forgetting to update `APP_ROUTES` in `middleware.ts` → cross-domain redirect breaks
- Using native `<select>` — breaks the visual system. Use `CustomSelect`.
- Treating `@solana/kit` and `@solana-program/memo` as removable — they're transitive deps of Privy's Solana connectors.
