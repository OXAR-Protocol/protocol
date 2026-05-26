# OXAR — Refactor Plan (Bonds → Hub)

**Дата:** 23 мая 2026
**Статус:** READY for implementation
**Документ-владелец:** Daniel
**Связанные документы:** `2026-05-23-oxar-prd.md` (что строим), этот документ (как строим)

---

## 1. Executive Summary

**Цель**: трансформировать существующий OXAR Protocol codebase (Ukrainian bond tokenization) в новый продукт (Where does your money sleep — yield hub + group vaults + auto-distribute rules + fiat on-ramp).

**Реальность**: ~40% кода переиспользуем, ~30% модифицируем, ~25% заменяем, ~30% добавляем NEW (yes total > 100% — потому что NEW идёт сверху).

**Estimated effort**: 57-79 dev-days (9-11 weeks), AI-assisted, 2-person team (Daniel + Anna).

**Подход**: 11-week sprint plan, инкрементальный refactor (не big bang rewrite). Каждая неделя — shippable progress.

---

## 2. File-by-File Map

### 2.1 Smart Contracts (`contracts/oxar-protocol/`)

#### ✅ KEEP as-is

| File | Why |
|---|---|
| `programs/oxar-protocol/src/constants.rs` | Generic constants (BPS_DENOMINATOR, NAV_PRECISION, seeds) |
| `programs/oxar-protocol/src/errors.rs` | Typed error enum — extendable |
| `programs/oxar-protocol/src/instructions/create_listing.rs` | Marketplace works generic |
| `programs/oxar-protocol/src/instructions/cancel_listing.rs` | Marketplace generic |
| `programs/oxar-protocol/src/instructions/buy_listing.rs` | Marketplace generic |
| `programs/oxar-protocol/src/instructions/setup_vault_pool.rs` | USDC pool init |

#### 🔄 MODIFY

| File | Changes |
|---|---|
| `programs/oxar-protocol/src/state.rs` | **Vault struct**: remove `maturity_ts`, `denomination`, `asset_subtype`. ADD `vault_type` enum (Personal / Group), `rules_config_id` (optional FK), `creator` (для group vault). |
| `programs/oxar-protocol/src/instructions/initialize_vault.rs` | Remove bond-specific params. Add `vault_type`, optional `goal_amount`, `goal_deadline` для group vaults. |
| `programs/oxar-protocol/src/instructions/deposit.rs` | Rename internal terms (NAV → share value). Logic stays. Add hook для rules engine call. |
| `programs/oxar-protocol/src/instructions/claim.rs` | Rename to `withdraw.rs`. Logic stays + add pro-rata branch для group vaults. |
| `programs/oxar-protocol/src/instructions/crank_nav.rs` | Extend to dispatch yield streaming в group vaults (если правило включено). |
| `programs/oxar-protocol/src/lib.rs` | Update instruction list, new module imports |
| `tests/oxar-protocol.ts` | Update tests: remove maturity, add group vault tests, add rules tests |

#### ❌ DELETE

| File | Why |
|---|---|
| `programs/oxar-protocol/src/instructions/close_vault.rs` | Vaults perpetual, не закрываются по maturity |

#### ➕ NEW

| File | Purpose |
|---|---|
| `programs/oxar-protocol/src/instructions/initialize_group_vault.rs` | Create group vault с goal + invite hash |
| `programs/oxar-protocol/src/instructions/join_group_vault.rs` | User присоединяется к группе через invite |
| `programs/oxar-protocol/src/instructions/leave_group_vault.rs` | Withdraw свою долю + remove from group |
| `programs/oxar-protocol/src/instructions/create_rule.rs` | Create auto-distribute rule (trigger + action) |
| `programs/oxar-protocol/src/instructions/execute_rule.rs` | Triggered when conditions met (off-chain monitor calls this) |
| `programs/oxar-protocol/src/instructions/cancel_rule.rs` | User disables rule |
| `programs/oxar-protocol/src/instructions/route_yield.rs` | Generic yield-source router (calls into Kamino/JLP/Maple via CPI) |
| `programs/oxar-protocol/src/state/group_vault.rs` | GroupVault struct: members[], goal, deadline, creator, total_deposited |
| `programs/oxar-protocol/src/state/group_member.rs` | GroupMember struct: user, deposited_amount, joined_at |
| `programs/oxar-protocol/src/state/rule.rs` | Rule struct: trigger_type, condition, action, owner |
| `programs/oxar-protocol/src/integrations/kamino.rs` | CPI wrapper для Kamino lending |
| `programs/oxar-protocol/src/integrations/jupiter_perps.rs` | CPI wrapper для JLP staking |
| `programs/oxar-protocol/src/integrations/maple_solana.rs` | CPI wrapper для Maple Solana pools |

---

### 2.2 SDK (`sdk/`)

#### ✅ KEEP

| File | Why |
|---|---|
| `src/constants.ts` | Mirrors contracts constants |
| `src/program.ts` | Program init from Privy wallet — generic |

#### 🔄 MODIFY

| File | Changes |
|---|---|
| `src/pda.ts` | Simplify vault PDA seed: remove `region`/`denomination`/`asset_subtype`. New seed: `"vault" + vault_id_u64 + series_u16`. |
| `src/transactions.ts` | Rename functions, remove maturity logic, add group vault tx builders |
| `src/types.ts` | Will regenerate from new IDL |
| `src/idl.json` | Regenerate after contract build |

#### ➕ NEW

| File | Purpose |
|---|---|
| `src/group-vaults.ts` | Helpers для group vault creation, join, withdraw |
| `src/rules.ts` | Helpers для rule creation, execution |
| `src/yield-router.ts` | Abstraction для yield sources (Solana-native + Delora) |
| `src/integrations/delora.ts` | Delora API client (quotes, bridges, swaps) |
| `src/integrations/ramp.ts` | Ramp Network SDK wrapper для Apple Pay/Google Pay |

---

### 2.3 Web App (`web/src/`)

#### ✅ KEEP

| Path | Notes |
|---|---|
| `app/layout.tsx` | Root layout, providers |
| `app/providers/` | Privy, Theme — generic |
| `app/api/faucet/`, `app/api/faucet-sol/` | Devnet utilities |
| `components/ui/` | shadcn primitives |
| `components/nav.tsx`, `top-nav.tsx`, `page-wrapper.tsx` | Layout (style updates only) |
| `components/portfolio/` | Most files — position tracking generic |
| `components/marketplace/` | Listing/buying generic |
| `lib/utils.ts`, `lib/cn.ts` | Utils generic |

#### 🔄 MODIFY

| Path | Changes |
|---|---|
| `app/page.tsx` | Replace landing sections (см. ниже) |
| `sections/header.tsx` | Update logo + nav items для нового продукта |
| `sections/footer.tsx` | Update copy (некоторые ссылки оставляем) |
| `components/explore/` | Rename to `discover/`, update filters (vault type, APY, group size) |
| `components/vault-detail/` | Remove bond mechanics, add yield/group mechanics |
| `hooks/use-deposit.ts` | Rename to `use-vault-deposit.ts`, logic stays |
| `hooks/use-claim.ts` | Rename to `use-vault-withdraw.ts` |
| `hooks/use-vaults.ts` | Filter by vault_type |
| `hooks/use-vault.ts` | Add group vault fields |
| `app/api/waitlist/route.ts` | Repurpose: now waitlist для new product |
| `globals.css` | Keep colors, may adjust accent shades |

#### ❌ REPLACE

| Path | Why |
|---|---|
| `sections/hero.tsx` | Bond narrative → «Where does your money sleep?» |
| `sections/problem.tsx` | Bond problem → universal money-sleeping problem |
| `sections/how-it-works.tsx` | Bond mechanics → wallet → yield → groups |
| `sections/vaults.tsx` | Bond vaults → yield templates + featured groups |
| `sections/features.tsx` | Bond features → hub features |
| `sections/for-whom.tsx` | Bond audience → ICP rewrite |
| `sections/roadmap.tsx` | Roadmap update под new product |
| `sections/waitlist.tsx` | New product waitlist (или удалить, если используем оригинальный flow) |
| `components/access-gate/` | Bond-specific access checks → remove |
| `components/bond-detail/` | Repurpose as `group-vault-detail/` |
| `hooks/use-access-gate.ts` | Remove |
| `hooks/use-bond-deposit.ts` | Remove (renamed to use-vault-deposit) |

#### ➕ NEW

| Path | Purpose |
|---|---|
| `app/onboarding/page.tsx` | Two-track onboarding flow (crypto wallet OR Apple Pay) |
| `app/dashboard/page.tsx` | Main user dashboard (personal balance + group goals) |
| `app/group/[id]/page.tsx` | Single group vault page |
| `app/group/create/page.tsx` | Create new group vault flow |
| `app/group/join/[invite]/page.tsx` | Accept group invite |
| `app/settings/page.tsx` | Rules config, risk profile, wallet management |
| `components/onboarding/` | Multi-step onboarding components |
| `components/group-vault/` | Group vault creation, joining, contributors, progress |
| `components/rules/` | Auto-distribute rule UI |
| `components/yield/` | Yield source cards, risk template selector |
| `components/fiat/` | Ramp Network integration, Apple Pay flow |
| `components/dashboard/` | Home stats, recent activity, next deposit indicator |
| `hooks/use-group-vault.ts` | Fetch group vault state |
| `hooks/use-create-group-vault.ts` | Create group vault tx |
| `hooks/use-join-group-vault.ts` | Join via invite |
| `hooks/use-rules.ts` | Fetch user rules |
| `hooks/use-create-rule.ts` | Create rule tx |
| `hooks/use-fiat-deposit.ts` | Ramp Network flow |
| `hooks/use-yield-sources.ts` | Fetch available yield sources + APY |
| `hooks/use-monitor-wallet.ts` | Watch linked wallet для incoming USDC (off-chain) |
| `lib/delora-client.ts` | Delora API HTTP client |
| `lib/ramp-client.ts` | Ramp Network SDK init |
| `app/api/rules/monitor/route.ts` | Cron endpoint — checks linked wallets, triggers rules |
| `app/api/groups/route.ts` | CRUD groups (Supabase) |

---

### 2.4 Database (Supabase)

#### ✅ KEEP existing

- `public.waitlist` — repurpose under new product

#### ➕ NEW tables

```sql
-- Group vaults metadata (on-chain truth, this for fast queries)
CREATE TABLE public.group_vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  on_chain_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  goal_amount NUMERIC,
  goal_deadline TIMESTAMPTZ,
  creator_wallet TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Group memberships
CREATE TABLE public.group_members (
  group_id UUID REFERENCES group_vaults(id) ON DELETE CASCADE,
  wallet TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  display_name TEXT,
  PRIMARY KEY (group_id, wallet)
);

-- User rules
CREATE TABLE public.user_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_wallet TEXT NOT NULL,
  rule_type TEXT NOT NULL,  -- 'auto_distribute', 'buffer_topup', etc.
  trigger_config JSONB NOT NULL,
  action_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_triggered_at TIMESTAMPTZ
);

-- Linked wallets для monitoring
CREATE TABLE public.linked_wallets (
  user_id UUID NOT NULL,  -- Privy user
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL,  -- 'solana', 'ethereum'
  is_monitoring BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, wallet_address, chain)
);

-- Yield distributions log (для audit + analytics)
CREATE TABLE public.yield_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,  -- 'rule_trigger', 'manual', 'milestone'
  from_wallet TEXT,
  to_group_id UUID REFERENCES group_vaults(id),
  amount NUMERIC NOT NULL,
  token TEXT DEFAULT 'USDC',
  tx_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fiat deposits log (Ramp Network)
CREATE TABLE public.fiat_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ramp_session_id TEXT UNIQUE NOT NULL,
  fiat_amount NUMERIC NOT NULL,
  fiat_currency TEXT NOT NULL,
  crypto_amount NUMERIC,
  status TEXT DEFAULT 'pending',  -- 'pending', 'completed', 'failed'
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

---

## 3. Smart Contract Architecture

### 3.1 Module structure

```
oxar-protocol/
├── src/
│   ├── lib.rs                           # Program entry, instruction routing
│   ├── constants.rs                     # Seeds, math constants
│   ├── errors.rs                        # OxarError enum
│   ├── state/
│   │   ├── mod.rs
│   │   ├── vault.rs                     # Vault struct (personal + group)
│   │   ├── group_vault.rs               # GroupVault struct
│   │   ├── group_member.rs              # GroupMember struct
│   │   ├── rule.rs                      # Rule struct
│   │   ├── listing.rs                   # Marketplace listing
│   │   └── escrow.rs                    # Marketplace escrow
│   ├── instructions/
│   │   ├── mod.rs
│   │   ├── personal/
│   │   │   ├── initialize_vault.rs
│   │   │   ├── deposit.rs
│   │   │   ├── withdraw.rs
│   │   │   └── crank_nav.rs
│   │   ├── group/
│   │   │   ├── initialize_group_vault.rs
│   │   │   ├── join_group_vault.rs
│   │   │   ├── leave_group_vault.rs
│   │   │   ├── manual_deposit_group.rs
│   │   │   └── milestone_check.rs
│   │   ├── rules/
│   │   │   ├── create_rule.rs
│   │   │   ├── execute_rule.rs
│   │   │   └── cancel_rule.rs
│   │   ├── yield/
│   │   │   ├── route_yield.rs           # Master router
│   │   │   ├── deposit_kamino.rs        # Source-specific
│   │   │   ├── withdraw_kamino.rs
│   │   │   ├── deposit_jlp.rs
│   │   │   ├── withdraw_jlp.rs
│   │   │   ├── deposit_maple.rs
│   │   │   └── withdraw_maple.rs
│   │   └── marketplace/
│   │       ├── create_listing.rs
│   │       ├── cancel_listing.rs
│   │       └── buy_listing.rs
│   └── integrations/
│       ├── mod.rs
│       ├── kamino.rs                    # CPI wrappers
│       ├── jupiter_perps.rs
│       └── maple_solana.rs
```

### 3.2 Group vault flow (high-level)

```
┌──────────────────────────────────────────────────────────────┐
│  GROUP VAULT LIFECYCLE                                       │
└──────────────────────────────────────────────────────────────┘

Alice creates group:
  initialize_group_vault {
    name: "Lisbon",
    goal: 5000 USDC,
    deadline: 2026-08-01,
    initial_deposit: 200 USDC
  }
  → on-chain: GroupVault PDA created
  → on-chain: Alice added as first GroupMember
  → on-chain: 200 USDC into vault pool
  → on-chain: 200 group_vault_shares minted to Alice

Alice shares invite link (Supabase invite_code → group_vault_id):

Bob joins via invite:
  join_group_vault {
    group_vault: <PDA>,
    deposit: 150 USDC
  }
  → on-chain: Bob added as GroupMember
  → on-chain: 150 USDC into vault pool
  → on-chain: 150 group_vault_shares minted to Bob

Vault accumulates yield (via crank_nav):
  crank_nav {
    vault: <group_vault_pda>,
    new_nav: 1.012  // 1.2% gain
  }
  → on-chain: vault.nav_per_share updated
  → off-chain notification: «Lisbon pile earned $5 today»

Alice wants to withdraw early:
  leave_group_vault {
    group_vault: <PDA>,
    shares: 200  // her full balance
  }
  → on-chain: 200 shares burned
  → on-chain: 200 × 1.012 = 202.4 USDC returned to Alice
  → on-chain: Alice removed from GroupMember (или marked inactive)
  → off-chain: notify other members "Alice withdrew $202.4"

Goal reached:
  milestone_check {
    group_vault: <PDA>
  }
  → on-chain: if total_deposited >= goal_amount, vault marked complete
  → off-chain: celebration push to all members
```

### 3.3 Rules engine (hybrid on-chain + off-chain)

```
┌──────────────────────────────────────────────────────────────┐
│  RULES ENGINE — auto-distribute example                      │
└──────────────────────────────────────────────────────────────┘

Setup (one-time):
  create_rule {
    rule_type: AutoDistribute,
    trigger_config: {
      type: "wallet_receives_usdc",
      wallet: <user_wallet>,
      min_amount: 100  // ignore small txs
    },
    action_config: {
      type: "split_to_destinations",
      destinations: [
        { type: "personal_yield", percent: 60, risk: "balanced" },
        { type: "group_vault", percent: 25, group_id: "<Lisbon>" },
        { type: "stay_in_wallet", percent: 15 }
      ]
    }
  }
  → on-chain: Rule PDA created, owned by user

Off-chain monitor (cron job, every 2 min):
  - Scan all linked_wallets that have active rules
  - Check for new incoming USDC transactions
  - If found:
    1. Build user-signed transaction:
       execute_rule {
         rule: <PDA>,
         incoming_tx: <signature>,
         amount: <amount>
       }
    2. Push notification to user: «$1800 arrived. Apply your rule?»
    3. User taps "Yes" → signs in wallet → tx broadcasts
    4. On-chain:
       - Verify rule conditions
       - 60% (1080 USDC) → route_yield to personal Balanced template
       - 25% (450 USDC) → manual_deposit_group to Lisbon
       - 15% stays in wallet
       - Update rule.last_triggered_at

Why hybrid (off-chain monitor + on-chain execution):
  - Solana doesn't have native "execute on receive" trigger
  - Off-chain monitor watches → notifies user → user signs → on-chain executes
  - This is non-custodial: WE never have permission, user always signs
  - Alternative: Squads-style delegation contracts (Phase 2)
```

### 3.4 Yield router architecture

```rust
// Pseudocode

pub enum YieldSource {
    Kamino { pool: Pubkey },
    JupiterPerps { jlp_mint: Pubkey },
    MapleSolana { pool: Pubkey },
    DeloraCrossChain { source_id: u64 },  // Off-chain executed via Delora API
}

pub fn route_deposit(
    ctx: Context<RouteYield>,
    amount: u64,
    source: YieldSource,
) -> Result<()> {
    match source {
        YieldSource::Kamino { pool } => {
            cpi_to_kamino_deposit(ctx, amount, pool)?
        },
        YieldSource::JupiterPerps { jlp_mint } => {
            cpi_to_jlp_stake(ctx, amount, jlp_mint)?
        },
        YieldSource::MapleSolana { pool } => {
            cpi_to_maple_deposit(ctx, amount, pool)?
        },
        YieldSource::DeloraCrossChain { source_id } => {
            // On-chain: lock USDC for Delora bridge
            // Off-chain: client uses Delora API to bridge + deposit
            // Position tracked via off-chain monitor
            lock_for_delora(ctx, amount, source_id)?
        }
    }
    Ok(())
}
```

---

## 4. Integration Plan

### 4.1 Delora API

**SDK init**:
```ts
import { DeloraClient } from '@oxar/sdk/integrations/delora';

const delora = new DeloraClient({
  apiKey: process.env.DELORA_API_KEY,
  baseUrl: 'https://api.delora.build/v1'
});
```

**Get cross-chain quote**:
```ts
const quote = await delora.getQuote({
  fromChain: 'solana',
  fromToken: 'USDC',
  toChain: 'ethereum',
  toToken: 'USDY',  // Ondo USDY
  amount: '1000000000'  // 1000 USDC
});
// Returns: { route, fees, expectedReceive, calldata }
```

**Execute bridge + swap**:
```ts
// User signs Solana tx to lock USDC, Delora handles rest
const tx = await delora.buildExecutionTx(quote, userWallet);
await userWallet.signAndSendTransaction(tx);

// Off-chain monitor watches Ethereum side for USDY to land
// Updates our position tracking when confirmed
```

### 4.2 Ramp Network (fiat on-ramp)

**SDK init**:
```ts
import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk';

const ramp = new RampInstantSDK({
  hostAppName: 'OXAR',
  hostLogoUrl: 'https://oxar.app/logo.svg',
  swapAsset: 'SOLANA_USDC',
  userAddress: userSolanaWallet,
  fiatCurrency: 'EUR',  // detected from user locale
  fiatValue: '200',
  paymentMethodType: 'APPLE_PAY',  // or 'GOOGLE_PAY', 'CARD'
  webhookStatusUrl: 'https://oxar.app/api/ramp/webhook',
});
ramp.show();
```

**Webhook handler**:
```ts
// app/api/ramp/webhook/route.ts
export async function POST(req: Request) {
  const event = await req.json();
  
  if (event.type === 'PURCHASE_SUCCESSFUL') {
    // 1. USDC arrived in user's Solana wallet
    // 2. Trigger user's active rule (if any) to auto-distribute
    await triggerRulesForWallet(event.purchase.receiverAddress);
    // 3. Update fiat_deposits table
    await markFiatDepositComplete(event.purchase.id);
  }
}
```

### 4.3 Yield protocol CPIs

- **Kamino**: использовать их SDK, CPI на их programs
- **Jupiter Perps (JLP)**: JLP — это just a token, stake/unstake via Jupiter program
- **Maple Solana**: их Anchor program, mint/redeem syrupUSDC

Каждая integration — отдельный wrapper в `programs/oxar-protocol/src/integrations/` + соответствующий typed builder в `sdk/src/yield-router.ts`.

---

## 5. Visual Design System

### 5.1 Colors (keep existing palette)

```css
/* Base */
--bg-primary: #000000;         /* Black */
--bg-surface: #0A0A0A;         /* Slightly lighter for cards */
--bg-elevated: #161616;        /* Dialogs, modals */

/* Accent */
--accent-primary: #8B5CF6;     /* Purple — main CTA */
--accent-hover: #A78BFA;       /* Lighter purple for hover */
--accent-soft: rgba(139, 92, 246, 0.15);  /* Backgrounds */

/* Semantic */
--success: #22C55E;            /* Green — yields, gains */
--warning: #F59E0B;            /* Amber — warnings */
--error: #EF4444;              /* Red — losses, errors */

/* Text */
--text-primary: #FFFFFF;
--text-secondary: rgba(255, 255, 255, 0.7);
--text-muted: rgba(255, 255, 255, 0.4);
--text-disabled: rgba(255, 255, 255, 0.2);

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.1);
--border-strong: rgba(255, 255, 255, 0.2);
```

### 5.2 Typography (keep Geist)

```css
--font-sans: 'Geist', system-ui, sans-serif;
--font-mono: 'Geist Mono', 'SF Mono', monospace;

/* Scale */
--text-xs: 0.75rem;    /* 12px — labels */
--text-sm: 0.875rem;   /* 14px — body small */
--text-base: 1rem;     /* 16px — body */
--text-lg: 1.125rem;   /* 18px — section headers */
--text-xl: 1.25rem;    /* 20px — card titles */
--text-2xl: 1.5rem;    /* 24px — page titles */
--text-3xl: 1.875rem;  /* 30px — hero secondary */
--text-4xl: 3rem;      /* 48px — hero main */
--text-5xl: 4.5rem;    /* 72px — landing hero */

/* Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 5.3 Brand voice translations в UI

| Generic copy | OXAR voice |
|---|---|
| Dashboard | Home |
| Total balance | Your sleeping money |
| Yield earned | Money you woke up |
| Create group vault | Start a together pile |
| Invite members | Bring people in |
| Deposit | Add some sleep |
| Withdraw | Wake some up |
| Set up automation | Build a sleeping pattern |
| Yield source | Where your money sleeps |
| Risk level: Conservative | 😴 Sleepy (slow but steady) |
| Risk level: Balanced | 🚶 Walking (balanced pace) |
| Risk level: Aggressive | 🏃 Running (fast & loud) |

### 5.4 Key components (extend existing)

| Component | Purpose | Reuse |
|---|---|---|
| `<Card>` | Container для info blocks | shadcn |
| `<Button>` | Actions | shadcn |
| `<Slider>` | Salary split, risk preference | shadcn |
| `<Dialog>` | Confirmations, onboarding steps | shadcn |
| `<Progress>` | Goal tracking | shadcn |
| `<Avatar>` | Group members display | NEW |
| `<MemberList>` | Group vault members + contributions | NEW |
| `<YieldSourceCard>` | Source name, APY, value | NEW |
| `<RiskTemplateCard>` | Sleepy/Walking/Running selector | NEW |
| `<GoalProgressBar>` | Animated progress to milestone | NEW |
| `<InviteCodeShare>` | QR code + link + copy button | NEW |
| `<RuleConfigForm>` | Auto-distribute setup | NEW |
| `<NotificationToast>` | Activity feed | NEW |
| `<WalletConnector>` | Two-track wallet/Apple Pay choice | NEW |

---

## 6. Screen Mockups (ASCII)

### 6.1 Landing (`oxar.app/`)

```
╔════════════════════════════════════════════════════════════╗
║  OXAR                              Docs · Sign in           ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║                                                            ║
║         WHERE DOES YOUR MONEY                              ║
║              SLEEP?                                        ║
║                                                            ║
║         Wake it up. Earn yield. Save together.             ║
║                                                            ║
║         [  Connect wallet  ]  [  Just tap to start  ]      ║
║                                                            ║
║         ◯ 4-12% APY  ◯ Non-custodial  ◯ Instant withdraw   ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║   How it works                                             ║
║                                                            ║
║   ┌────────────┐    ┌────────────┐    ┌────────────┐       ║
║   │    01      │    │    02      │    │    03      │       ║
║   │ Connect    │ →  │ Choose     │ →  │ Save with  │       ║
║   │ wallet     │    │ how loud   │    │ people you │       ║
║   │ or tap pay │    │ your money │    │ trust      │       ║
║   └────────────┘    └────────────┘    └────────────┘       ║
║                                                            ║
║                                                            ║
║   Money has more fun together                              ║
║                                                            ║
║   [Examples of group goals — Lisbon, Bali, wedding, ...]   ║
║                                                            ║
╠════════════════════════════════════════════════════════════╣
║   Get started → CTA                                        ║
╚════════════════════════════════════════════════════════════╝
```

### 6.2 Onboarding step 1 — entry point choice

```
╔════════════════════════════════════════════════════════════╗
║                  How do you want to start?                  ║
║                                                            ║
║   ┌──────────────────────┐  ┌──────────────────────┐       ║
║   │                      │  │                      │       ║
║   │     🦊  WALLET       │  │     📱  TAP TO PAY   │       ║
║   │                      │  │                      │       ║
║   │  I have crypto       │  │  Just have a phone   │       ║
║   │  Phantom, MetaMask,  │  │  Apple Pay or        │       ║
║   │  Backpack, others    │  │  Google Pay          │       ║
║   │                      │  │                      │       ║
║   │  [ Connect →  ]      │  │  [ Tap to start → ]  │       ║
║   │                      │  │                      │       ║
║   └──────────────────────┘  └──────────────────────┘       ║
║                                                            ║
║   No bank account needed either way.                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### 6.3 Dashboard (`app.oxar.app/`)

```
╔════════════════════════════════════════════════════════════╗
║  OXAR              Home · Piles · Settings · 0x7a3...      ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║   Your sleeping money                                      ║
║   $5,234.18  ↑ $42 today  · 8.3% APY                       ║
║                                                            ║
║   ┌─────────────────────────────────────────────────────┐  ║
║   │ Activity                                            │  ║
║   │                                                     │  ║
║   │ 🟢 Today  Earned $42 across Kamino, Ondo, JLP       │  ║
║   │ 🟣 Yesterday  Maria added $50 to Lisbon pile        │  ║
║   │ 🌙 2 days ago  USDC arrived → split 60/25/15 done   │  ║
║   │                                                     │  ║
║   └─────────────────────────────────────────────────────┘  ║
║                                                            ║
║   Your piles                                               ║
║                                                            ║
║   ┌──────────────────────┐  ┌──────────────────────┐       ║
║   │ Lisbon apartment 🏠   │  │ Bali trip ✈️         │       ║
║   │ ███████░░░░░  64%    │  │ ████░░░░░░░░  32%    │       ║
║   │ $3,200 / $5,000      │  │ $1,600 / $5,000      │       ║
║   │ 4 people · 8.1% APY  │  │ 3 people · 6.5% APY  │       ║
║   └──────────────────────┘  └──────────────────────┘       ║
║                                                            ║
║   [ + Start a new pile ]                                   ║
║                                                            ║
║   ─────────────────────────────────────────────────────    ║
║                                                            ║
║   Your sleeping pattern                                    ║
║   When USDC arrives → 60% yield · 25% Lisbon · 15% stay    ║
║   [ Edit pattern ]                                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### 6.4 Group vault page (`app.oxar.app/group/lisbon`)

```
╔════════════════════════════════════════════════════════════╗
║  ← Back        🏠 Lisbon apartment                  · · ·  ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║   Goal: $5,000 by Aug 1, 2026                              ║
║                                                            ║
║   ████████████░░░░░░░░░░░░  64%                            ║
║                                                            ║
║   $3,200 / $5,000  ·  $1,800 to go  ·  68 days left        ║
║                                                            ║
║   8.1% APY working · earning ~$24/day                      ║
║                                                            ║
║   ─────────────────────────────────────────────────────    ║
║                                                            ║
║   Contributors (4)                                         ║
║                                                            ║
║   👤 Daniel (you)        $1,200    🟢 active sleeping      ║
║   👤 Maria               $800      🟢 active sleeping      ║
║   👤 Denis               $700      🟢 active sleeping      ║
║   👤 Vanya               $500      🟢 active sleeping      ║
║                                                            ║
║   ─────────────────────────────────────────────────────    ║
║                                                            ║
║   Activity                                                 ║
║                                                            ║
║   2h ago  · Maria added $50                                ║
║   1d ago  · Daniel's rule deposited $300                   ║
║   3d ago  · Yield $18 streamed in                          ║
║                                                            ║
║   [ + Add to pile ]   [ 🔗 Invite ]   [ Wake some up ]     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### 6.5 Settings — rules (`app.oxar.app/settings/rules`)

```
╔════════════════════════════════════════════════════════════╗
║  ← Back        Sleeping patterns                            ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║   When USDC arrives in your linked wallet                  ║
║                                                            ║
║   ┌─────────────────────────────────────────────────────┐  ║
║   │                                                     │  ║
║   │   Split incoming amount:                            │  ║
║   │                                                     │  ║
║   │   💤 Personal yield   ████████░░░░  60%             │  ║
║   │   👥 Lisbon pile      ███░░░░░░░░░  25%             │  ║
║   │   💵 Stay liquid      ██░░░░░░░░░░  15%             │  ║
║   │                                                     │  ║
║   │   Trigger: when amount > $100                       │  ║
║   │                                                     │  ║
║   └─────────────────────────────────────────────────────┘  ║
║                                                            ║
║   Active since: 2 weeks ago                                ║
║   Last triggered: 3 days ago ($1,800)                      ║
║                                                            ║
║   [ Edit ]   [ Pause ]   [ Delete ]                        ║
║                                                            ║
║   ─────────────────────────────────────────────────────    ║
║                                                            ║
║   [ + Add another pattern ]                                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

## 7. 11-Week Sprint Plan

### Sprint 1 (Week 1): Foundation + Anna alignment

**Goal**: Codebase prepped, team aligned, infra готово.

- ✅ Anna deeply onboards с PRD + Refactor plan
- ✅ Customer interviews (5 external) — record verbatim
- ✅ Lisbon commitment test (3+ YES)
- 🛠 Delete bond-specific code (close_vault, access-gate, old bond UI)
- 🛠 Update CLAUDE.md в repo (новая vault structure docs)
- 🛠 Apply for Solana Foundation grant
- 🛠 Outreach: Delora team, Aurum legal update
- 🛠 Pre-launch landing live с email capture

**Deliverables**: clean repo, customer data, partnerships in motion, landing live.

---

### Sprint 2 (Week 2): Smart contracts I — personal vaults

**Goal**: Vault contract refactored, personal yield deposits work on devnet.

- 🛠 Refactor `state.rs` — new Vault struct
- 🛠 Modify `initialize_vault.rs`, `deposit.rs`, `withdraw.rs`, `crank_nav.rs`
- 🛠 Delete `close_vault.rs`
- 🛠 Tests updated, passing on localnet
- 🛠 Deploy refactored contracts на devnet
- 🛠 SDK rebuild + IDL update

**Deliverables**: Personal vaults работают end-to-end на devnet.

---

### Sprint 3 (Week 3): Smart contracts II — group vaults

**Goal**: Group vault contract working, deposits/withdrawals tested.

- 🛠 NEW: `initialize_group_vault.rs`, `join_group_vault.rs`, `leave_group_vault.rs`
- 🛠 NEW: `state/group_vault.rs`, `state/group_member.rs`
- 🛠 NEW: `manual_deposit_group.rs`, `milestone_check.rs`
- 🛠 Tests for all group flows
- 🛠 Update SDK для group vaults

**Deliverables**: Group vaults working на devnet, multi-user tested.

---

### Sprint 4 (Week 4): Smart contracts III — rules engine

**Goal**: Rules engine works on-chain, off-chain monitor scaffold.

- 🛠 NEW: `create_rule.rs`, `execute_rule.rs`, `cancel_rule.rs`
- 🛠 NEW: `state/rule.rs`
- 🛠 Off-chain monitor scaffold (Node service or Vercel cron)
- 🛠 Test: rule fires when condition met
- 🛠 SDK helpers для rules

**Deliverables**: Auto-distribute rules end-to-end (manual trigger initially).

---

### Sprint 5 (Week 5): Yield integrations

**Goal**: 3 Solana yield sources + 1 cross-chain via Delora.

- 🛠 NEW: `integrations/kamino.rs` + CPI wrapper
- 🛠 NEW: `integrations/jupiter_perps.rs`
- 🛠 NEW: `integrations/maple_solana.rs`
- 🛠 NEW: `route_yield.rs` master router
- 🛠 NEW: `sdk/integrations/delora.ts` — API client
- 🛠 Cross-chain Ondo USDY integration through Delora (1 cycle test)

**Deliverables**: Yield router routes correctly, юзер видит positions.

---

### Sprint 6 (Week 6): Frontend I — replace landing + auth

**Goal**: New landing + onboarding live (devnet behind feature flag).

- 🛠 REPLACE: `sections/hero.tsx`, `problem.tsx`, `how-it-works.tsx`, `vaults.tsx`, `features.tsx`, `for-whom.tsx`
- 🛠 NEW: `app/onboarding/page.tsx` + two-track flow
- 🛠 NEW: `components/onboarding/`
- 🛠 NEW: `components/fiat/` — Ramp Network integration
- 🛠 Update brand copy throughout

**Deliverables**: Landing rebranded, onboarding works, Apple Pay deposit can complete.

---

### Sprint 7 (Week 7): Frontend II — dashboard + personal vault UI

**Goal**: Dashboard + personal yield management UI.

- 🛠 NEW: `app/dashboard/page.tsx`
- 🛠 NEW: `components/dashboard/` (home stats, activity feed)
- 🛠 NEW: `components/yield/` (yield source cards, risk template selector)
- 🛠 MODIFY: `components/vault-detail/` для personal vault
- 🛠 NEW: `hooks/use-yield-sources.ts`, `use-monitor-wallet.ts`

**Deliverables**: Юзер видит свой portfolio, может deposit/withdraw personal yield.

---

### Sprint 8 (Week 8): Frontend III — group vault UI

**Goal**: Полный group vault flow в UI.

- 🛠 NEW: `app/group/[id]/page.tsx`, `create/page.tsx`, `join/[invite]/page.tsx`
- 🛠 NEW: `components/group-vault/` (создание, join, contributors, progress)
- 🛠 NEW: hooks для group vaults
- 🛠 Invite code generation + Supabase routing
- 🛠 NEW: `app/api/groups/route.ts`

**Deliverables**: Юзер может создать pile, инвайтнуть друзей, видеть прогресс.

---

### Sprint 9 (Week 9): Frontend IV — rules + settings

**Goal**: Rule config UI + settings page.

- 🛠 NEW: `app/settings/page.tsx`
- 🛠 NEW: `components/rules/` — rule builder UI
- 🛠 NEW: `app/api/rules/monitor/route.ts` — cron endpoint
- 🛠 Linked wallet management UI
- 🛠 Notification system (in-app + email)

**Deliverables**: Юзер может настроить auto-distribute rule, видит когда triggers.

---

### Sprint 10 (Week 10): Audit prep + bug fixes + polish

**Goal**: Pre-launch hardening.

- 🛠 Smart contract audit (external firm, $10k budget)
- 🛠 Bug bash на devnet
- 🛠 Performance optimization
- 🛠 Mobile responsive fixes
- 🛠 Onboarding copy polish (с input from customer interviews)
- 🛠 Notification copy polish
- 🛠 Edge case handling

**Deliverables**: Audit-ready code, all known bugs fixed, performant.

---

### Sprint 11 (Week 11): Launch prep + beta cohort

**Goal**: Mainnet deploy + first real groups.

- 🛠 Mainnet contract deploy
- 🛠 Final security review
- 🛠 Onboard Lisbon group + 4-5 other beta groups
- 🛠 Documentation update (docs.oxar.app)
- 🛠 Twitter announcement plan
- 🛠 Monitoring + alerting setup

**Deliverables**: **OXAR live on mainnet, first 5-10 groups onboarded.**

---

## 8. Risk Register (refactor-specific)

| Risk | Mitigation |
|---|---|
| Contract refactor introduces bugs in working bond code | Comprehensive tests before each change, run on localnet before devnet |
| New group vault security flaws | External audit before mainnet, bug bounty after launch |
| Rules engine complexity creep | Strictly one rule type в MVP (auto-distribute), не строим generic builder |
| Delora API not production-ready | Sprint 5 has fallback: ship MVP with только Solana-native yields, add cross-chain later |
| Ramp Network integration issues | Start integration в Sprint 6 не позже, can fallback to MoonPay |
| Existing UI components не подходят под новую narrative | Keep visual primitives, replace copy/composition liberally |
| Mainnet deploy без audit feedback | Sprint 10 reserved для audit; не deploy если audit findings critical |

---

## 9. Dependencies & Sequencing

```
Sprint 1 (Foundation) ──┐
                         │
Sprint 2 (Personal vaults) ──┐
                              │
Sprint 3 (Group vaults) ──┐   │
                          │   │
Sprint 4 (Rules engine) ──┤   │
                          │   │
Sprint 5 (Yield integrations) ──┐
                                  │
Sprint 6 (Frontend I: landing/auth) ──┐
                                       │
Sprint 7 (Frontend II: dashboard) ─────┤
                                        │
Sprint 8 (Frontend III: group UI) ──────┤
                                         │
Sprint 9 (Frontend IV: rules/settings) ──┤
                                          │
Sprint 10 (Audit + polish) ───────────────┤
                                           │
Sprint 11 (Launch) ────────────────────────┘
```

**Можно параллелизовать**:
- Anna: customer interviews + GTM prep + Aurum + Solana grant (Sprints 1-4)
- Daniel: smart contracts (Sprints 2-5)
- Daniel: frontend (Sprints 6-9)

**Не получится параллелизовать**:
- Frontend нужны контракты deployed на devnet — Sprint 6 после Sprint 5
- Audit нужен complete code — Sprint 10 после Sprint 9

---

## 10. Definition of Done (для каждого sprint)

- ✅ Code changes committed to git
- ✅ Tests written + passing (>80% coverage для new code)
- ✅ `yarn build` passes
- ✅ Deployed to devnet (if applicable)
- ✅ Manual QA на devnet (если UI changes)
- ✅ CLAUDE.md updated если нужно
- ✅ Demo video / screenshot для weekly Twitter update
- ✅ Decision log updated в PRD если решения принимались

---

## 11. Что DELETE сразу (Week 1 cleanup)

Не ждём — удаляем bond-specific cruft сразу чтобы не путаться:

```
contracts/oxar-protocol/src/instructions/close_vault.rs

web/src/components/access-gate/  (entire directory)
web/src/hooks/use-access-gate.ts
web/src/hooks/use-bond-deposit.ts

web/src/sections/  (заменим, но не удаляем сразу — нужны как reference)

web/public/images/  (audit и удалить bond-specific imagery)
```

---

## 12. Что подготовить вне кода

- **Anna**: deep-read PRD + Refactor plan, любые questions
- **Daniel**: customer interview script (5 questions), Delora outreach msg
- **Pre-launch landing**: simple page с email capture (Sprint 1)
- **Twitter content calendar**: 11 weeks build-in-public posts plan
- **Documentation site refresh** (docs.oxar.app) — на Sprint 10-11
- **Demo videos** — captured during sprints для launch announcement

---

## 13. После Sprint 11 — что дальше

См. PRD section 4 — Phase 2/3/4 features. Roadmap continues:
- Months 3-6: UA bonds через broker, copy-investing, bonus mechanics
- Months 6-12: mobile native, multi-currency, EM bonds expansion
- Year 2: power-user mode, потенциально token (если регуляторика позволит)

---

*Документ — actionable план. Каждый sprint обновляет статус: planned / in_progress / done. Изменения в плане фиксируются в этом файле.*
