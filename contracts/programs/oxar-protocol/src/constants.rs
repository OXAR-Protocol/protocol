// ============================================================================
// PDA Seeds
// ============================================================================

/// Personal vault: ["vault", creator, vault_id_le_bytes]
pub const VAULT_SEED: &[u8] = b"vault";

/// Group vault: ["group", creator, vault_id_le_bytes]
pub const GROUP_VAULT_SEED: &[u8] = b"group";

/// Group member: ["member", group_vault, member_pubkey]
pub const GROUP_MEMBER_SEED: &[u8] = b"member";

/// Rule: ["rule", owner, rule_id_le_bytes]
pub const RULE_SEED: &[u8] = b"rule";

/// Vault share mint: ["mint", vault_pubkey]
pub const MINT_SEED: &[u8] = b"mint";

/// Hot USDC pool: ["pool", vault_pubkey]
pub const POOL_SEED: &[u8] = b"pool";

// Marketplace seeds removed per Decision 5.

// ============================================================================
// Math constants
// ============================================================================

/// Initial NAV (1.0 USDC representation with 6 decimals)
pub const INITIAL_NAV: u64 = 1_000_000;

/// Basis points denominator (100% = 10_000 bps)
pub const BPS_DENOMINATOR: u64 = 10_000;

/// Hot/cold ratio: 20% USDC stays liquid for instant withdrawals
pub const HOT_RATIO_BPS: u16 = 2_000;

/// NAV precision for u128 intermediate math
pub const NAV_PRECISION: u128 = 1_000_000;

/// USDC has 6 decimals
pub const USDC_DECIMALS: u8 = 6;

// ============================================================================
// Time constants
// ============================================================================

pub const DAYS_PER_YEAR: u64 = 365;
pub const SECONDS_PER_DAY: u64 = 86_400;
pub const SECONDS_PER_YEAR: u64 = 31_536_000;

// ============================================================================
// Protocol versioning
// ============================================================================

/// Bump when changing account layout (breaks deserialization)
pub const PROTOCOL_VERSION: u8 = 2;

// ============================================================================
// Group vault limits
// ============================================================================

/// Max members per group vault (for tx size and accounting safety)
pub const MAX_GROUP_MEMBERS: u8 = 20;

/// Max destinations per rule action
pub const MAX_RULE_DESTINATIONS: u8 = 5;

/// Min deposit to a group vault (prevent dust)
pub const MIN_GROUP_DEPOSIT: u64 = 1_000_000; // 1 USDC
