use anchor_lang::prelude::*;

/// Per-vault adapter state PDA.
///
/// seeds = [ADAPTER_STATE_SEED, adapter_program_id, vault]
///
/// The first four fields are the `AdapterStateHeader` mandated by
/// adapter-standard-v1.md §Adapter State Account — their order MUST NOT change,
/// so off-chain readers can deserialize the header without knowing the
/// adapter-specific tail. Kamino-specific fields follow.
#[account]
#[derive(InitSpace)]
pub struct AdapterState {
    // ----- standard header (fixed layout, do not reorder) -----
    /// The OXAR vault PDA this state belongs to.
    pub vault: Pubkey,
    /// This adapter's program ID.
    pub adapter_program: Pubkey,
    /// Unix timestamp of initialization.
    pub created_at: i64,
    /// Adapter-internal shares this vault holds (Kamino collateral / cTokens
    /// attributable to this vault — NOT Kamino's global supply).
    pub total_shares: u64,

    // ----- Kamino-specific tail -----
    /// The klend reserve this vault deposits into (e.g. main-market USDC reserve).
    pub kamino_reserve: Pubkey,
    /// Adapter-owned token account holding the reserve collateral mint (cUSDC).
    pub collateral_vault: Pubkey,
    /// PDA bump.
    pub bump: u8,
}
