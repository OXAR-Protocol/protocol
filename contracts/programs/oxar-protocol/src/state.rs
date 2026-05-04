use anchor_lang::prelude::*;

// TODO: Add a helper method on Vault to build signer seeds, reducing duplication
// across deposit, claim, buy_listing, cancel_listing, and close_vault handlers.
#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub protocol_version: u8,
    pub authority: Pubkey,
    pub usdc_mint: Pubkey,
    pub vault_token_mint: Pubkey,
    pub usdc_pool: Pubkey,
    pub treasury: Pubkey,
    #[max_len(16)]
    pub asset_class: String,
    #[max_len(4)]
    pub region: String,
    #[max_len(4)]
    pub denomination: String,
    #[max_len(8)]
    pub asset_subtype: String,
    pub apy_bps: u64,
    pub nav_per_share: u64,
    pub total_deposits: u64,
    pub total_shares: u64,
    pub last_update_ts: i64,
    pub maturity_ts: i64,
    pub is_active: bool,
    pub fee_bps: u16,
    pub series: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Listing {
    pub seller: Pubkey,
    pub vault: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub price_per_token: u64,
    pub created_at: i64,
    pub bump: u8,
}
