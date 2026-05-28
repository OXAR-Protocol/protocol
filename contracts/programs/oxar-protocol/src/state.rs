use anchor_lang::prelude::*;

// ============================================================================
// Vault — personal yield position OR backing storage for a group vault
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub protocol_version: u8,
    pub vault_type: VaultType,
    pub authority: Pubkey,            // Owner: user (personal) or group_vault PDA (group)
    pub usdc_mint: Pubkey,
    pub vault_token_mint: Pubkey,     // Share mint
    pub usdc_pool: Pubkey,            // Hot pool (liquid USDC for fast withdrawals)
    pub yield_source: YieldSource,
    pub risk_template: RiskTemplate,
    pub nav_per_share: u64,           // Current value per share, NAV_PRECISION
    pub total_deposits: u64,          // Net USDC principal (deposits − withdrawals, saturating). NOT cumulative.
    pub total_shares: u64,            // Total share supply
    pub hot_pool_balance: u64,        // USDC in hot pool (instant withdrawable)
    pub cold_capital: u64,            // USDC routed to yield_source
    pub last_update_ts: i64,
    pub is_active: bool,
    pub fee_bps: u16,                 // Protocol performance fee in basis points
    pub vault_id: u64,                // User-scoped incrementing ID
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum VaultType {
    Personal,
    Group,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum RiskTemplate {
    Conservative,  // ~5% APY target
    Balanced,      // ~7% APY target
    Aggressive,    // ~10% APY target
}

/// Where the cold capital is routed.
///
/// Each variant carries minimal data — full integration details live in the
/// adapter contracts. `source_id` references off-chain Delora source for
/// cross-chain yields.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum YieldSource {
    Idle,                                // No yield, USDC just sits (MVP fallback)
    KaminoUsdc { pool: Pubkey },         // Kamino USDC lending
    JupiterLp { jlp_mint: Pubkey },      // Jupiter Perps LP token
    MapleSolana { pool: Pubkey },        // Maple syrupUSDC pool
    MarginFiUsdc { bank: Pubkey },       // MarginFi USDC bank
    DriftInsurance { vault: Pubkey },    // Drift Insurance Fund vault
    DeloraCrossChain { source_id: u64 }, // Off-chain Delora source (Ondo, USDM, USDY, TBILL, sUSDe, sDAI...)
}

// ============================================================================
// GroupVault — shared savings vault with multiple members
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct GroupVault {
    pub vault: Pubkey,                // Backing Vault PDA holding the funds
    pub creator: Pubkey,
    #[max_len(48)]
    pub name: String,                 // "Lisbon apartment"
    pub goal_amount: u64,             // Target USDC accumulation
    pub goal_deadline: i64,           // Unix timestamp (0 = no deadline)
    pub member_count: u8,
    pub invite_hash: [u8; 32],        // SHA256(invite_code) for verification
    pub created_at: i64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct GroupMember {
    pub group_vault: Pubkey,
    pub member: Pubkey,
    pub deposited_amount: u64,        // Cumulative principal contributed
    pub shares_owned: u64,            // Pro-rata share of group vault
    pub joined_at: i64,
    #[max_len(32)]
    pub display_name: String,
    pub bump: u8,
}

// ============================================================================
// Rule — user-defined automation (auto-distribute, etc.)
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct Rule {
    pub owner: Pubkey,
    pub rule_id: u64,                 // User-scoped incrementing ID
    pub rule_type: RuleType,
    pub trigger: Trigger,
    pub action: Action,
    pub is_active: bool,
    pub last_triggered_at: i64,
    pub trigger_count: u32,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum RuleType {
    AutoDistribute,                   // Split incoming USDC across destinations
    // Future Phase 2+:
    // BufferTopUp, OverflowCleanup, RoundUp, CatchUp, Recurring
}

/// Fully flexible trigger: monitored wallet's balance change on `mint`,
/// in `direction`, compared (`comparator`) to `amount`.
///
/// `mint == Pubkey::default()` means native SOL.
/// The off-chain monitor watches the wallet's token account (or SOL balance),
/// detects matching transfers, builds the distribution tx and prompts the
/// user to sign.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub struct Trigger {
    pub wallet: Pubkey,
    pub mint: Pubkey,
    pub direction: Direction,
    pub comparator: Comparator,
    pub amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Direction {
    Receives,
    Sends,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Comparator {
    Greater,        // strictly >
    GreaterOrEqual, // >=
    Equal,          // ==
    LessOrEqual,    // <=
    Less,           // strictly <
}

/// Action stores up to 5 destinations for split routing.
///
/// `destinations` is a fixed-size array; unused slots have `percent_bps = 0`.
/// Sum of all `percent_bps` MUST equal 10_000 (100%).
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub struct Action {
    pub destinations: [Destination; 5],
    pub destinations_used: u8,        // How many slots are populated (1..=5)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub struct Destination {
    pub dest_type: DestinationType,
    pub percent_bps: u16,             // 0..=10_000
    pub target: Pubkey,               // Vault or GroupVault PDA; ignored for StayInWallet
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum DestinationType {
    PersonalYield,
    GroupVault,
    StayInWallet,
}

