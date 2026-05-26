# OXAR — Architecture Analysis (Current → New)

**Дата:** 23 мая 2026
**Цель:** Детальный архитектурный разбор существующего кода с точки зрения «что менять под новый продукт». Базируется на прямом чтении файлов.

---

## 1. Текущая архитектура — суммарно

### Slice через стек

```
┌────────────────────────────────────────────────────────────────┐
│  WEB (Next.js 14 App Router)                                   │
│  - Landing: 7 sections (Hero, Problem, HowItWorks, ...)        │
│  - App routes (под /(app)): vaults, vault/[id], marketplace,   │
│    portfolio, profile, gate, login                             │
│  - 19 hooks (one per contract instruction + utilities)         │
│  - Components: explore/, vault-detail/, marketplace/,          │
│    portfolio/, access-gate/, bond-detail/, waitlist/, pitch/   │
└────────────────────────────────────────────────────────────────┘
                              ↓ uses
┌────────────────────────────────────────────────────────────────┐
│  SDK (@oxar/sdk, file:./sdk-local)                             │
│  - PROGRAM_ID + RPC_URL + DEFAULT_SERIES                       │
│  - VAULT_CONFIGS (6 bond types)                                │
│  - PDA derivation (5 PDA types)                                │
│  - createOxarProgram (Anchor factory)                          │
│  - 6 transaction builders                                      │
└────────────────────────────────────────────────────────────────┘
                              ↓ uses
┌────────────────────────────────────────────────────────────────┐
│  CONTRACTS (Anchor 0.30.1)                                     │
│  Program ID: 8NsGNHMtfEiJzSczdmN2reo26h75C4axamuLXdk2tfrT     │
│  - state.rs: Vault + Listing structs                           │
│  - 8 instructions (initialize_vault, setup_vault_pool,         │
│    deposit, claim, crank_nav, create_listing, cancel_listing,  │
│    buy_listing, close_vault)                                   │
│  - constants.rs: seeds, NAV math, PROTOCOL_ADMIN               │
└────────────────────────────────────────────────────────────────┘
```

### Принципы которые соблюдены (хорошо)

1. **Чёткое разделение**: Web ↔ SDK ↔ Contracts с однонаправленной зависимостью
2. **One instruction per file** в contracts
3. **One hook per instruction** в web
4. **Generic vault math** (NAV-based) — работает для любого APY-driven yield
5. **PDA seeds в sync** между Rust и TS
6. **Анти-overflow math** (checked + u128 intermediate)
7. **Constants централизованы** и зеркалены между repos

### Принципы которые мешают новому продукту (плохо)

1. **Vault struct overspecialized под bonds** — `asset_class`, `region`, `denomination`, `asset_subtype`, `maturity_ts` → embedded в PDA seeds
2. **PROTOCOL_ADMIN gates vault creation** — only one admin can create vaults (не подходит для user-generated group vaults)
3. **Маршрутизация однотиповая** — каждый vault держит ОДИН тип asset (USDC pool), нет yield-routing к разным источникам
4. **No group vault concept** — vaults personal, owned by `authority`
5. **No rules engine** — нет триггеров, нет автоматизации flow
6. **No fiat path** — только wallet-to-wallet USDC
7. **NAV-based yield не подходит для streamed yield sources** (Kamino/JLP/Maple)

---

## 2. Vault struct — детальный разбор

```rust
pub struct Vault {
    pub protocol_version: u8,        // ✅ KEEP — versioning useful
    pub authority: Pubkey,           // ✅ KEEP — owner concept generic
    pub usdc_mint: Pubkey,           // ✅ KEEP — USDC remains base
    pub vault_token_mint: Pubkey,    // ✅ KEEP — share token pattern works
    pub usdc_pool: Pubkey,           // ✅ KEEP — pool pattern works
    pub treasury: Pubkey,            // ⚠️ UNUSED currently (set to default)
    pub asset_class: String,         // ❌ REMOVE — bond-specific
    pub region: String,              // ❌ REMOVE — bond-specific (UA/BR/etc)
    pub denomination: String,        // ❌ REMOVE — bond-specific (UAH/USD/EUR)
    pub asset_subtype: String,       // ❌ REMOVE — bond-specific (SHORT/MID/WAR)
    pub apy_bps: u64,                // ⚠️ MODIFY — replace with dynamic yield_source
    pub nav_per_share: u64,          // ✅ KEEP — share accounting works
    pub total_deposits: u64,         // ✅ KEEP — generic stat
    pub total_shares: u64,           // ✅ KEEP — generic stat
    pub last_update_ts: i64,         // ✅ KEEP — generic
    pub maturity_ts: i64,            // ❌ REMOVE — vaults perpetual
    pub is_active: bool,             // ✅ KEEP — needed
    pub fee_bps: u16,                // ✅ KEEP — protocol fee
    pub series: u16,                 // ⚠️ MODIFY — keep but for different purpose
    pub bump: u8,                    // ✅ KEEP — required
}
```

### Новая Vault структура (proposed)

```rust
pub struct Vault {
    pub protocol_version: u8,
    pub vault_type: VaultType,       // NEW: Personal | Group
    pub authority: Pubkey,           // Owner (user wallet)
    pub usdc_mint: Pubkey,
    pub vault_token_mint: Pubkey,
    pub usdc_pool: Pubkey,
    pub yield_source: YieldSource,   // NEW: Kamino | JLP | Maple | Ondo(via Delora) | ...
    pub risk_template: RiskTemplate, // NEW: Conservative | Balanced | Aggressive
    pub nav_per_share: u64,
    pub total_deposits: u64,
    pub total_shares: u64,
    pub last_update_ts: i64,
    pub is_active: bool,
    pub fee_bps: u16,
    pub vault_id: u64,               // NEW: incrementing ID (replaces composite key)
    pub bump: u8,
}

pub enum VaultType {
    Personal,
    Group { goal_amount: u64, deadline: i64, member_count: u8 },
}

pub enum YieldSource {
    KaminoUsdc { pool: Pubkey },
    JupiterLp { jlp_mint: Pubkey },
    MapleSolana { pool: Pubkey },
    DeloraCrossChain { source_id: u64 },  // Off-chain executed
    Idle,                                  // Just sits, no yield (для test/edge case)
}

pub enum RiskTemplate {
    Conservative,  // Low risk (Kamino USDC, ~5%)
    Balanced,      // Mix (~7%)
    Aggressive,    // Higher (JLP, sUSDe via Delora, ~10%)
}
```

### Новая Group Vault struct

```rust
pub struct GroupVault {
    pub vault_pubkey: Pubkey,        // References the underlying Vault
    pub creator: Pubkey,
    pub name: String,                // "Lisbon apartment"
    pub goal_amount: u64,
    pub deadline: i64,
    pub member_count: u8,
    pub invite_hash: [u8; 32],       // hash of invite code (для verification)
    pub created_at: i64,
    pub is_active: bool,
    pub bump: u8,
}

pub struct GroupMember {
    pub group_vault: Pubkey,
    pub member: Pubkey,
    pub deposited_amount: u64,
    pub shares_owned: u64,
    pub joined_at: i64,
    pub display_name: String,
    pub bump: u8,
}
```

### Новая Rule struct

```rust
pub struct Rule {
    pub owner: Pubkey,
    pub rule_type: RuleType,         // AutoDistribute, BufferTopUp, etc
    pub trigger: Trigger,
    pub action: Action,
    pub is_active: bool,
    pub last_triggered_at: i64,
    pub bump: u8,
}

pub enum RuleType {
    AutoDistribute,
    BufferTopUp,
    // Future: RoundUp, CatchUp, Recurring
}

pub enum Trigger {
    WalletReceivesUsdc { wallet: Pubkey, min_amount: u64 },
    // Future: TimeInterval, BalanceThreshold, etc
}

pub enum Action {
    SplitToDestinations {
        destinations: Vec<Destination>,  // bounded max 5
    },
    // Future: Transfer, Swap, Stake
}

pub struct Destination {
    pub dest_type: DestinationType,
    pub percent_bps: u16,  // basis points, sum must equal 10000
    pub target: Pubkey,    // vault for yield, group_vault for friends pile
}

pub enum DestinationType {
    PersonalYield,
    GroupVault,
    StayInWallet,
}
```

---

## 3. Instructions — что меняется

| Instruction | Текущее состояние | План |
|---|---|---|
| `initialize_vault` | Только PROTOCOL_ADMIN, bond-specific params | **MODIFY**: rename to `initialize_personal_vault`, anyone can create, new params (yield_source, risk_template) |
| `setup_vault_pool` | Generic | **KEEP** as-is |
| `deposit` | Generic NAV-based mint shares | **KEEP** + добавить group vault variant |
| `claim` | Only matured bonds | **MODIFY**: rename to `withdraw`, remove maturity check, allow anytime |
| `crank_nav` | APY-based time accrual | **MODIFY**: change from "fake APY" to "read actual underlying yield source value". For Kamino vault — query Kamino position. For JLP — query JLP price. NAV становится real, not synthetic. |
| `create_listing` | Generic | **KEEP** |
| `cancel_listing` | Generic | **KEEP** |
| `buy_listing` | Generic | **KEEP** |
| `close_vault` | Bond-specific (maturity-based) | **DELETE** — vaults perpetual |

### Новые instructions нужны

| New Instruction | Purpose |
|---|---|
| `initialize_group_vault` | Create group vault с goal + invite |
| `join_group_vault` | User присоединяется через invite |
| `leave_group_vault` | Withdraw свою долю + leave |
| `deposit_to_group_vault` | Manual boost в group vault |
| `withdraw_from_group_vault` | Pro-rata withdraw свою долю |
| `create_rule` | Create auto-distribute (или другое) правило |
| `execute_rule` | Triggered by off-chain monitor → on-chain execution |
| `cancel_rule` | Disable rule |
| `route_yield_deposit` | Generic router — calls into Kamino/JLP/Maple via CPI |
| `route_yield_withdraw` | Withdraw из yield source через router |

### Что критично понять про NAV модель

**Проблема**: текущий `crank_nav` просто **симулирует** yield (APY × time). В production deploy в облигации — это ОК потому что custodian funds the pool with real yield off-chain.

**Для нового продукта**: реальный yield приходит из Kamino/JLP/Maple etc. Эти protocols по-разному отображают yield:

- **Kamino**: ваш share growth — query текущий kToken price
- **JLP**: token price growth — query Jupiter Perps state
- **Maple**: syrupUSDC value — query Maple program

Нам нужен **adapter pattern**:

```rust
trait YieldSourceAdapter {
    fn get_current_value(&self, ctx: &AdapterContext) -> Result<u64>;
    fn deposit(&self, ctx: &AdapterContext, amount: u64) -> Result<u64>;
    fn withdraw(&self, ctx: &AdapterContext, shares: u64) -> Result<u64>;
}
```

И `crank_nav` становится:

```rust
pub fn handler(ctx: Context<CrankNav>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let adapter = get_adapter(vault.yield_source)?;
    let current_value = adapter.get_current_value(&ctx)?;
    let total_value_per_share = current_value
        .checked_mul(NAV_PRECISION)?
        .checked_div(vault.total_shares)?;
    vault.nav_per_share = total_value_per_share;
    vault.last_update_ts = clock.unix_timestamp;
    Ok(())
}
```

Это **более честная модель** чем сейчас.

---

## 4. PDA Schema changes

### Текущая (bond-specific)

```
Vault    = "vault" + region + denomination + asset_subtype + series(u16 LE)
Mint     = "mint" + vault_pubkey
Pool     = "pool" + vault_pubkey
Listing  = "listing" + vault_pubkey + seller_pubkey
Escrow   = "escrow" + vault_pubkey + seller_pubkey
```

### Новая (vault_id-based, поддерживает user-created vaults)

```
PersonalVault  = "vault" + creator_pubkey + vault_id(u64 LE)
GroupVault     = "group" + creator_pubkey + vault_id(u64 LE)
GroupMember    = "member" + group_vault_pubkey + member_pubkey
Rule           = "rule" + owner_pubkey + rule_id(u64 LE)
Mint           = "mint" + vault_pubkey                          (UNCHANGED)
Pool           = "pool" + vault_pubkey                          (UNCHANGED)
Listing        = "listing" + vault_pubkey + seller_pubkey       (UNCHANGED)
Escrow         = "escrow" + vault_pubkey + seller_pubkey        (UNCHANGED)
```

**Почему vault_id u64 вместо composite key**:
- User может создать много vaults (`vault_id = 1, 2, 3, ...`)
- Group vault имеет свой counter
- Composite key (`region + denomination + ...`) — пережиток bond-specific дизайна

---

## 5. SDK changes

### `constants.ts`

```diff
- DEFAULT_SERIES = 2
- VAULT_CONFIGS = [6 bond configs]
- parseVaultId, getVaultConfigById

+ YIELD_SOURCES = [
+   { id: 'kamino-usdc', name: 'Kamino USDC', baseApy: 5.5, riskLevel: 'low' },
+   { id: 'jlp', name: 'Jupiter LP', baseApy: 9.5, riskLevel: 'medium' },
+   { id: 'maple-solana', name: 'Maple Syrup USDC', baseApy: 7.5, riskLevel: 'medium' },
+   { id: 'ondo-usdy-delora', name: 'Ondo USDY (via Delora)', baseApy: 5.0, riskLevel: 'low' },
+   { id: 'susde-delora', name: 'Ethena sUSDe (via Delora)', baseApy: 11.0, riskLevel: 'high' },
+ ]
+ RISK_TEMPLATES = {
+   conservative: ['kamino-usdc', 'ondo-usdy-delora'],
+   balanced: ['kamino-usdc', 'maple-solana', 'jlp'],
+   aggressive: ['jlp', 'susde-delora'],
+ }
```

### `pda.ts`

```diff
- deriveVaultPda(region, denomination, assetSubtype, series)
+ derivePersonalVaultPda(creator, vaultId)
+ deriveGroupVaultPda(creator, vaultId)
+ deriveGroupMemberPda(groupVault, member)
+ deriveRulePda(owner, ruleId)
  deriveMintPda(vaultPubkey)        // UNCHANGED
  derivePoolPda(vaultPubkey)        // UNCHANGED
  deriveListingPda(vault, seller)   // UNCHANGED
  deriveEscrowPda(vault, seller)    // UNCHANGED
```

### `transactions.ts` — новые builders

```diff
  buildDepositTransaction          // KEEP (works for personal & group)
- buildClaimTransaction            // RENAME → buildWithdrawTransaction
  buildCreateListingTransaction    // KEEP
  buildCancelListingTransaction    // KEEP
  buildBuyListingTransaction       // KEEP
  buildTransferTokensTransaction   // KEEP

+ buildInitializePersonalVaultTransaction
+ buildInitializeGroupVaultTransaction
+ buildJoinGroupVaultTransaction
+ buildLeaveGroupVaultTransaction
+ buildCreateRuleTransaction
+ buildExecuteRuleTransaction
+ buildCancelRuleTransaction
+ buildRouteYieldDepositTransaction
+ buildRouteYieldWithdrawTransaction
```

### Новые SDK modules

```diff
+ src/integrations/delora.ts    // Delora API client
+ src/integrations/ramp.ts      // Ramp Network SDK wrapper
+ src/integrations/kamino.ts    // Kamino CPI helpers
+ src/integrations/jupiter.ts   // JLP staking helpers
+ src/integrations/maple.ts     // Maple Solana helpers
```

---

## 6. Web app — детальный change map

### `app/` routes

#### Текущие routes

```
app/
├── page.tsx                    Landing (7 sections, bond narrative)
├── layout.tsx                  Root (Providers, Theme)
├── api/
│   ├── faucet/route.ts         Devnet USDC mint
│   ├── faucet-sol/route.ts     Devnet SOL airdrop
│   ├── waitlist/route.ts       Email capture
│   └── access/redeem/route.ts  Access code redemption (bond gate)
├── pitch/page.tsx              Investor pitch page
├── terms/page.tsx              Terms of service
├── kit/page.tsx                Brand kit
├── docs/page.tsx               Documentation
├── investors/page.tsx          Investor info
└── (app)/                      Auth-protected group
    ├── layout.tsx              AccessGate + AuthGuard + TopNav + TabBar
    ├── login/page.tsx          Privy login
    ├── gate/page.tsx           Access gate (bond-specific)
    ├── vaults/page.tsx         List all vaults
    ├── vault/[id]/page.tsx     Single vault detail + deposit
    ├── portfolio/page.tsx      User positions
    ├── portfolio/[id]/page.tsx Single position
    ├── profile/page.tsx        User profile
    ├── marketplace/page.tsx    Secondary market
    └── marketplace/[id]/page.tsx  Single listing
```

#### Что нужно — план

| Path | Action | Notes |
|---|---|---|
| `app/page.tsx` | **MODIFY** | Replace section imports — new landing |
| `app/layout.tsx` | **KEEP** | Providers/Theme generic |
| `app/api/faucet/`, `faucet-sol/` | **KEEP** | Useful для devnet |
| `app/api/waitlist/route.ts` | **MODIFY** | Repurpose под new product waitlist |
| `app/api/access/redeem/route.ts` | **DELETE** | Bond-specific gate removed |
| `app/pitch/page.tsx` | **MODIFY** | Update pitch для нового продукта (потом) |
| `app/terms/page.tsx` | **MODIFY** | New ToS для нового продукта |
| `app/kit/page.tsx` | **MODIFY** | Brand kit update |
| `app/docs/page.tsx` | **MODIFY** | Docs update |
| `app/investors/page.tsx` | **MODIFY** | Update investor angle |
| `app/(app)/layout.tsx` | **MODIFY** | Remove AccessGate, keep TopNav/TabBar |
| `app/(app)/login/page.tsx` | **KEEP** | Privy generic |
| `app/(app)/gate/page.tsx` | **DELETE** | Bond access gate removed |
| `app/(app)/vaults/page.tsx` | **MODIFY** | Replace bond list with personal vaults + group vaults |
| `app/(app)/vault/[id]/page.tsx` | **MODIFY** | New vault detail (personal vs group dispatcher) |
| `app/(app)/portfolio/` | **KEEP** | Positions generic, copy update |
| `app/(app)/profile/page.tsx` | **MODIFY** | Add rules section, linked wallets |
| `app/(app)/marketplace/` | **KEEP** | Marketplace generic |
| **NEW**: `app/(app)/dashboard/page.tsx` | **NEW** | Home dashboard (replaces vaults как primary view) |
| **NEW**: `app/(app)/group/create/page.tsx` | **NEW** | Create group vault flow |
| **NEW**: `app/(app)/group/[id]/page.tsx` | **NEW** | Single group vault view |
| **NEW**: `app/(app)/group/join/[invite]/page.tsx` | **NEW** | Accept group invite |
| **NEW**: `app/(app)/onboarding/page.tsx` | **NEW** | Two-track onboarding (crypto / Apple Pay) |
| **NEW**: `app/(app)/settings/page.tsx` | **NEW** | Rules config, wallets, profile |
| **NEW**: `app/api/groups/route.ts` | **NEW** | CRUD groups (Supabase metadata) |
| **NEW**: `app/api/rules/monitor/route.ts` | **NEW** | Cron — check linked wallets, trigger rules |
| **NEW**: `app/api/ramp/webhook/route.ts` | **NEW** | Ramp Network deposit notifications |
| **NEW**: `app/api/delora/webhook/route.ts` | **NEW** | Delora cross-chain status updates |

### `hooks/`

```
KEEP as-is:
  use-oxar-program.ts     // Privy bridge — generic
  use-faucet.ts           // Devnet utility
  use-sol-balance.ts      // Generic balance
  use-transfer-tokens.ts  // Generic transfer
  use-listings.ts         // Marketplace
  use-create-listing.ts   // Marketplace
  use-cancel-listing.ts   // Marketplace
  use-buy-listing.ts      // Marketplace
  use-portfolio.ts        // Positions (copy update only)
  use-animated-progress.ts // UI helper
  use-canvas-perf.ts      // UI helper
  use-count-up.ts         // UI helper

RENAME / MODIFY:
  use-deposit.ts → use-vault-deposit.ts         (generic personal vault deposit)
  use-claim.ts → use-vault-withdraw.ts          (generic withdraw)
  use-vaults.ts → use-personal-vaults.ts        (filter by vault_type)
  use-vault.ts → use-vault-detail.ts            (handle both personal/group)
  use-bond-deposit.ts → DELETE                  (duplicates use-deposit)
  use-access-gate.ts → DELETE                   (bond gate removed)
  use-waitlist.ts → KEEP, just update copy

NEW:
  use-create-personal-vault.ts
  use-create-group-vault.ts
  use-join-group-vault.ts
  use-leave-group-vault.ts
  use-group-vaults.ts          // fetch user's groups
  use-group-vault-detail.ts    // fetch single group
  use-create-rule.ts
  use-update-rule.ts
  use-cancel-rule.ts
  use-rules.ts                  // fetch user rules
  use-fiat-deposit.ts          // Ramp Network flow
  use-monitor-wallet.ts        // off-chain wallet monitoring
  use-yield-sources.ts         // fetch available sources + current APY
  use-link-wallet.ts           // link external wallet for monitoring
  use-delora-quote.ts          // get cross-chain quote
```

### `components/`

```
KEEP:
  ui/                          // shadcn primitives
  animated-number.tsx          // generic
  animated-section.tsx         // generic
  bottom-sheet.tsx             // generic
  button.tsx                   // generic
  custom-cursor.tsx            // brand
  fade-in.tsx                  // generic
  highlight-text.tsx           // generic
  isometric-boxes.tsx          // brand
  loading-screen.tsx           // generic
  logo-path-data.ts            // logos
  nav.tsx                      // top nav (copy update)
  page-wrapper.tsx             // layout
  section-divider.tsx          // generic
  section-label.tsx            // generic
  section-title.tsx            // generic
  tab-bar.tsx                  // bottom nav (links update)
  top-nav.tsx                  // generic (links update)
  warp-on-entry.tsx            // animation
  warp-transition.tsx          // animation
  marketplace/                 // marketplace generic
  portfolio/                   // positions generic
  yield-calculator.tsx         // generic, may extend

MODIFY:
  auth-guard.tsx               // remove access gate logic
  explore/                     // rename to discover/, remove bond filters
  vault-detail/                // generic vault, handle personal+group
  pitch/                       // update pitch deck content
  waitlist/                    // update copy

REPLACE / DELETE:
  access-gate/                 // DELETE
  bond-detail/                 // DELETE (replaced by group-vault-detail)

NEW:
  onboarding/                  // multi-step wizard
    track-chooser.tsx          // crypto / Apple Pay choice
    salary-link-step.tsx       // (deferred — optional)
    risk-template-step.tsx     // sleepy/walking/running
    pile-creation-step.tsx     // first group vault
  group-vault/
    pile-card.tsx              // group display
    pile-progress.tsx          // goal progress bar
    pile-members.tsx           // contributors list
    pile-activity.tsx          // recent events
    pile-create-form.tsx       // creation flow
    pile-invite-share.tsx      // QR + link
    pile-join-confirm.tsx      // join flow UI
  rules/
    rule-builder.tsx           // visual editor
    rule-summary.tsx           // display existing rule
    rule-status.tsx            // active / paused / triggered
    split-slider.tsx           // yield/pile/liquid slider
  yield/
    yield-source-card.tsx      // source name + APY + balance
    risk-template-card.tsx     // sleepy/walking/running
    daily-yield-display.tsx    // animated counter
  fiat/
    ramp-widget.tsx            // Apple Pay / Google Pay flow
    fiat-amount-input.tsx      // USD amount picker
  dashboard/
    home-balance.tsx           // your sleeping money
    activity-feed.tsx          // recent events across all
    next-deposit-card.tsx      // when expected
    group-piles-grid.tsx       // your groups overview
  shared/
    avatar.tsx                 // user avatar
    contributor-row.tsx        // member + contribution
    progress-bar.tsx           // generic progress
    countdown.tsx              // time to goal deadline
```

### `sections/` (landing)

```
DELETE / REPLACE all:
  header.tsx        // KEEP layout, update brand/links
  hero.tsx          // REPLACE — «Where does your money sleep?»
  problem.tsx       // REPLACE — money sleeping problem
  how-it-works.tsx  // REPLACE — wallet → yield → groups
  vaults.tsx        // REPLACE — featured yield templates + sample groups
  features.tsx      // REPLACE — hub features
  for-whom.tsx      // REPLACE — new ICP
  roadmap.tsx       // MODIFY — new roadmap
  waitlist.tsx      // MODIFY — new copy
  footer.tsx        // KEEP — update links
```

---

## 7. Database (Supabase)

### Existing tables

```
public.waitlist              // KEEP, repurpose
radar.*                      // ANOTHER PROJECT (radar.oxar.app), separate schema, не трогаем
```

### NEW tables нужны

```sql
-- Group vault metadata (on-chain truth, table for fast queries + invites)
CREATE TABLE public.group_vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  on_chain_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  goal_amount NUMERIC NOT NULL,
  goal_deadline TIMESTAMPTZ,
  creator_wallet TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);
CREATE INDEX ON public.group_vaults(creator_wallet);
CREATE INDEX ON public.group_vaults(invite_code);

-- Group membership (mirror of on-chain GroupMember для fast queries)
CREATE TABLE public.group_members (
  group_id UUID REFERENCES group_vaults(id) ON DELETE CASCADE,
  wallet TEXT NOT NULL,
  display_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, wallet)
);

-- Rules metadata
CREATE TABLE public.user_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  on_chain_address TEXT UNIQUE,
  user_wallet TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL,
  action_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_triggered_at TIMESTAMPTZ
);
CREATE INDEX ON public.user_rules(user_wallet, is_active);

-- Linked wallets for monitoring (off-chain only — privacy choice)
CREATE TABLE public.linked_wallets (
  user_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  is_monitoring BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  last_signature TEXT,
  PRIMARY KEY (user_id, wallet_address, chain)
);

-- Yield distributions log (audit + analytics)
CREATE TABLE public.yield_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  from_wallet TEXT,
  to_group_id UUID REFERENCES group_vaults(id),
  to_vault_address TEXT,
  amount NUMERIC NOT NULL,
  token TEXT DEFAULT 'USDC',
  tx_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fiat deposits (Ramp Network)
CREATE TABLE public.fiat_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ramp_session_id TEXT UNIQUE NOT NULL,
  fiat_amount NUMERIC NOT NULL,
  fiat_currency TEXT NOT NULL,
  crypto_amount NUMERIC,
  payment_method TEXT,  -- 'apple_pay' | 'google_pay' | 'card'
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Notifications queue
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON public.notifications(user_id, created_at DESC);
```

### Row-level security policies

- `group_vaults`: read-public (для invite flow), insert by authenticated user (creator)
- `group_members`: read by group members + creator
- `user_rules`: read/write by owner only
- `linked_wallets`: read/write by owner only
- `yield_distributions`: read-only audit log
- `fiat_deposits`: read by owner, write by service role (Ramp webhook)
- `notifications`: read/write by owner

---

## 8. New architectural patterns которые нужны

### 8.1 Yield Source Adapter Pattern

```typescript
// sdk/src/yield-sources/types.ts
export interface YieldSourceAdapter {
  id: string;
  name: string;
  riskLevel: 'low' | 'medium' | 'high';
  baseChain: 'solana' | 'ethereum';
  
  buildDepositInstruction(params: DepositParams): Promise<TransactionInstruction>;
  buildWithdrawInstruction(params: WithdrawParams): Promise<TransactionInstruction>;
  getCurrentValue(account: PublicKey): Promise<bigint>;
  getCurrentApy(): Promise<number>;
}

// sdk/src/yield-sources/kamino.ts
export class KaminoUsdcAdapter implements YieldSourceAdapter { ... }

// sdk/src/yield-sources/jupiter.ts
export class JlpAdapter implements YieldSourceAdapter { ... }

// sdk/src/yield-sources/delora.ts (for cross-chain like Ondo USDY)
export class DeloraOndoUsdyAdapter implements YieldSourceAdapter { ... }

// sdk/src/yield-router.ts
export class YieldRouter {
  private adapters = new Map<string, YieldSourceAdapter>();
  
  register(id: string, adapter: YieldSourceAdapter) { ... }
  async deposit(sourceId: string, amount: bigint): Promise<...>
  async withdraw(sourceId: string, shares: bigint): Promise<...>
  async getPositions(user: PublicKey): Promise<Position[]>
}
```

### 8.2 Rules Engine Pattern (hybrid on-chain + off-chain)

```
┌────────────────────────────────────────────────┐
│  RULE LIFECYCLE                                │
└────────────────────────────────────────────────┘

1. CREATE (one-time, on-chain):
   User calls create_rule with trigger + action
   → Rule PDA created, owned by user
   → Mirrored в Supabase user_rules table

2. MONITOR (continuous, off-chain):
   Vercel cron job (every 2 min):
   → Read all active user_rules
   → For each rule, check linked_wallets для new transactions
   → If trigger condition met:
     a. Build execute_rule transaction (user-signed)
     b. Push notification к user: «$1800 arrived. Apply your rule?»
     c. User taps "Confirm" в app → signs → broadcast

3. EXECUTE (per trigger, on-chain):
   execute_rule {
     rule: <PDA>,
     incoming_tx: <signature>,
     amount: <amount>
   }
   → Verify rule conditions
   → Execute action (split, transfer, etc)
   → Log в yield_distributions
   → Update rule.last_triggered_at

NON-CUSTODIAL: WE never have permission. User always signs.
```

### 8.3 Cross-chain Position Tracking

Positions могут жить на разных chains. Нужен unified view.

```typescript
// web/src/lib/position-tracker.ts
interface UnifiedPosition {
  vaultId: string;
  vaultType: 'personal' | 'group';
  chain: 'solana' | 'ethereum';
  yieldSource: string;
  balance: bigint;
  valueUsd: number;
  apy: number;
  lastUpdated: Date;
}

class PositionTracker {
  async getAllPositions(user: User): Promise<UnifiedPosition[]> {
    const solanaPositions = await fetchSolanaPositions(user.solanaWallet);
    const evmPositions = await fetchEvmPositions(user.evmWallet); // via Delora API
    return [...solanaPositions, ...evmPositions];
  }
}
```

### 8.4 Fiat → Crypto bridge (Ramp Network)

```typescript
// web/src/hooks/use-fiat-deposit.ts
export function useFiatDeposit() {
  const initRamp = useCallback((amountUsd: number) => {
    const ramp = new RampInstantSDK({
      hostAppName: 'OXAR',
      swapAsset: 'SOLANA_USDC',
      userAddress: userSolanaWallet,
      fiatCurrency: 'USD',
      fiatValue: amountUsd.toString(),
      paymentMethodType: 'APPLE_PAY',
      webhookStatusUrl: `${baseUrl}/api/ramp/webhook`,
    });
    
    ramp.on('purchase_created', (event) => {
      // log в Supabase fiat_deposits
    });
    
    ramp.on('widget_close', () => {
      // user cancelled
    });
    
    ramp.show();
  }, []);
  
  return { initRamp };
}

// web/src/app/api/ramp/webhook/route.ts
export async function POST(req: Request) {
  const event = await req.json();
  
  if (event.type === 'RELEASED') {
    // USDC arrived в user's Solana wallet
    // 1. Update fiat_deposits status
    // 2. If user has active rule → trigger it
    await triggerActiveRulesForWallet(event.purchase.receiverAddress);
  }
}
```

---

## 9. Что мешает архитектурно (главные блоки)

### Block 1: PDA seeds bond-specific

**Проблема**: Composite seed (`region + denomination + asset_subtype + series`) hardcoded в `initialize_vault.rs`, `deposit.rs`, `claim.rs`, `crank_nav.rs` (везде signer_seeds compute).

**Решение**: Migrate to simpler `creator + vault_id` seeds. **Это breaking change** для existing deployed contract — нужен либо migration script либо deploy fresh program с новым Program ID.

**Рекомендация**: **Deploy fresh program**. Текущая devnet с 6 bond vaults — это test data, можем выбросить. Новый Program ID, чистый старт. Backup current IDL для документации.

### Block 2: PROTOCOL_ADMIN gate

**Проблема**: `initialize_vault` requires `PROTOCOL_ADMIN` signer. Это OK для bonds (один admin создаёт vaults), но не подходит для user-generated group vaults.

**Решение**: Уберём admin gate из `initialize_personal_vault` и `initialize_group_vault`. Anyone can create. Контроль качества yield sources — через `YieldSource` enum (whitelisted sources).

### Block 3: Vault accepts only one yield source (USDC pool)

**Проблема**: Текущий vault держит USDC в pool, NAV симулирует APY. Нет реальной интеграции с external yield protocols.

**Решение**: Через `route_yield_*` instructions с CPI на Kamino/JLP/Maple. Vault holds **proxy shares** (например kTokens) вместо raw USDC, или vault сам decides когда раутить (lazy routing).

**Дизайн опция**: «Hot pool» (USDC liquid для instant withdrawals) + «Cold capital» (deposited в yield source). Ratio управляется автоматически.

### Block 4: No group vault primitives

**Проблема**: Текущий Vault has one `authority`. Group vault — это **multiple authorities** with **pro-rata claims**.

**Решение**: New `GroupVault` + `GroupMember` accounts. Pro-rata math через share tokens (каждый member holds N shares, withdraws его N × current_value).

### Block 5: No rules / automation

**Проблема**: Текущая логика purely transactional — юзер должен sign каждую операцию manually.

**Решение**: 
- On-chain: `Rule` account stores trigger + action declaration
- Off-chain: Vercel cron monitor reads rules, checks linked wallets, builds tx
- User: gets push, taps confirm, signs
- **Это hybrid pattern**. Полная automation требует delegation contracts (Phase 2-3).

---

## 10. Strategic decisions нужны прежде чем кодить

Прежде чем начать менять код, нужно решить:

### Decision 1: Fresh Program ID или migration?

- **Fresh** ✅ (recommended): Deploy new Program ID, abandon current 6 bond vaults на devnet. Cleaner start, no migration headache.
- **Migration**: Build complex IDL migration, painful, no real benefit (test data anyway).

### Decision 2: Hot pool vs Cold capital ratio

Сколько USDC держим liquid vs роутим в yield?
- **All-in (0/100)**: max yield, slow withdrawals (have to unwind position)
- **20/80** ✅ (recommended): 20% liquid pool for fast withdrawals, 80% earns yield
- **50/50**: too conservative, half capital idle

### Decision 3: Group vault — pooled funds or pro-rata claims?

- **Pooled** (one big bucket, group decisions): Investment club territory — legal risk
- **Pro-rata** ✅ (recommended): each member tracks his own share, independent withdraw — clean legal profile

### Decision 4: Off-chain rule monitor — где живёт?

- **Vercel cron** ✅ (recommended for MVP): простая, cheap, but not 24/7 reliable
- **Dedicated service** (e.g. Railway): более reliable, $20/мес
- **Solana program** (full on-chain): требует cron job сервиса который trigger'ит — same problem

### Decision 5: Marketplace — оставляем или убираем?

Текущая marketplace (create/cancel/buy listing) — для bond shares trading. **Нужна ли нам secondary market для personal yield vault shares?**

- **Keep**: бонус feature, может быть полезна для group vault shares
- **Remove for MVP**: focus, less code, можно вернуть в Phase 2
- **Recommendation**: **Remove from MVP**, восстановим если будет signal

### Decision 6: Что мы делаем с радаром?

`/radar` directory полностью отдельный продукт (radar.oxar.app). Не трогаем — это не часть нового продукта. Но **packages/** workspace для него остаётся в monorepo.

---

## 11. Refactor sequence (revised based on findings)

Учитывая что нужен **fresh Program ID** и большие изменения в state.rs, последовательность такая:

### Phase A: Foundation (Week 1-2)

1. **Day 1-2**: Cleanup
   - Delete `close_vault.rs`, access-gate, bond-detail, etc
   - Update CLAUDE.md в каждом repo
2. **Day 3-7**: New contract scaffolding
   - New `state.rs` with Vault (refactored) + GroupVault + GroupMember + Rule
   - New `constants.rs` with new seeds
   - New `lib.rs` instruction list
   - Empty stubs для new instructions
3. **Day 8-10**: Personal vault flow
   - `initialize_personal_vault` (no admin gate)
   - `deposit`, `withdraw` updated
   - `crank_nav` modified
   - Tests passing
   - **Deploy new Program ID на devnet**, abandon old one

### Phase B: Group vault (Week 3)

4. **Day 11-15**: Group vault contracts
   - `initialize_group_vault`, `join_group_vault`, `leave_group_vault`
   - Pro-rata math tested
   - SDK updated

### Phase C: Rules engine (Week 4)

5. **Day 16-20**: Rules
   - `create_rule`, `execute_rule`, `cancel_rule`
   - Off-chain monitor scaffold
   - Vercel cron for testing

### Phase D: Yield integrations (Week 5)

6. **Day 21-25**: Yield sources
   - Kamino USDC adapter (start with this — simplest)
   - JLP adapter
   - Maple Solana adapter
   - Delora client for one cross-chain source (Ondo USDY)

### Phase E: Frontend (Weeks 6-9)

7. Frontend rewrite в 4 sprints (см. refactor-plan.md)

### Phase F: Audit + Launch (Weeks 10-11)

8. External audit, bug fixes, mainnet deploy

**Total: 11 недель**, совпадает с PRD estimate.

---

## 12. Risks specific to refactor

| Risk | Mitigation |
|---|---|
| Fresh Program ID — нужно migrate test data | Acceptable — current data is throwaway devnet |
| YieldSource enum в Anchor — может быть размер issue | Use indirect refs (Pubkey + sourceId) instead of full enum data |
| Group vault rounding errors на pro-rata math | Standard pattern: shares×NAV/PRECISION, use u128 intermediate |
| Off-chain monitor reliability | Phase 1: best-effort, user knows. Phase 2: dedicated infra |
| Ramp Network webhook delays / failures | Idempotent webhook handler, retry queue |
| Delora API rate limits / downtime | Cache quotes, graceful degradation (показать "unavailable") |
| Кросс-chain settlement delays UX | Optimistic UI: показать «in transit» state, не блокируем |

---

## 13. Что зафиксировать прежде чем кодить

Перед началом Phase A, нужно ваше confirmation по 6 strategic decisions выше:

1. ✅ / ❌  **Fresh Program ID** (новый contract, abandon devnet data) — рекомендую YES
2. ✅ / ❌  **Hot/cold ratio 20/80** — рекомендую YES
3. ✅ / ❌  **Group vault pro-rata** (не pooled) — рекомендую YES
4. ✅ / ❌  **Off-chain monitor через Vercel cron** для MVP — рекомендую YES
5. ✅ / ❌  **Remove marketplace из MVP** (можно вернуть позже) — рекомендую YES
6. ✅ / ❌  **Radar не трогаем** — обязательно YES

Ответь по каждому. После этого начинаем Phase A — cleanup + new state.rs.

---

*Документ — output deep code analysis. Когда decisions confirmed, переходим к implementation по revised sequence.*
