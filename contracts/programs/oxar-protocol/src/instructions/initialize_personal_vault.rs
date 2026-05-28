use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::constants::*;
use crate::state::{RiskTemplate, Vault, VaultType};

/// Parameters for creating a personal yield vault.
///
/// `vault_id` is user-scoped; the same user can create multiple vaults
/// (e.g. one Conservative, one Aggressive) with different IDs.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializePersonalVaultParams {
    pub vault_id: u64,
    pub risk_template: RiskTemplate,
    pub adapter_program: Pubkey,
    pub fee_bps: u16,
}

#[derive(Accounts)]
#[instruction(params: InitializePersonalVaultParams)]
pub struct InitializePersonalVault<'info> {
    /// Creator pays for account rent and becomes vault authority.
    /// Anyone can create a personal vault — no admin gate.
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + Vault::INIT_SPACE,
        seeds = [
            VAULT_SEED,
            creator.key().as_ref(),
            &params.vault_id.to_le_bytes(),
        ],
        bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    /// USDC mint (passed in — devnet vs mainnet differ).
    pub usdc_mint: Account<'info, Mint>,

    /// Vault share token mint — PDA-derived from vault.
    #[account(
        init,
        payer = creator,
        seeds = [MINT_SEED, vault.key().as_ref()],
        bump,
        mint::decimals = USDC_DECIMALS,
        mint::authority = vault,
    )]
    pub vault_token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<InitializePersonalVault>,
    params: InitializePersonalVaultParams,
) -> Result<()> {
    let clock = Clock::get()?;
    let vault = &mut ctx.accounts.vault;

    vault.protocol_version = PROTOCOL_VERSION;
    vault.vault_type = VaultType::Personal;
    vault.authority = ctx.accounts.creator.key();
    vault.usdc_mint = ctx.accounts.usdc_mint.key();
    vault.vault_token_mint = ctx.accounts.vault_token_mint.key();
    vault.usdc_pool = Pubkey::default(); // Filled by setup_vault_pool
    vault.adapter_program = params.adapter_program;
    vault.risk_template = params.risk_template;
    vault.nav_per_share = INITIAL_NAV;
    vault.total_deposits = 0;
    vault.total_shares = 0;
    vault.hot_pool_balance = 0;
    vault.cold_capital = 0;
    vault.last_update_ts = clock.unix_timestamp;
    vault.is_active = false; // Activated after setup_vault_pool
    vault.fee_bps = params.fee_bps;
    vault.vault_id = params.vault_id;
    vault.bump = ctx.bumps.vault;

    msg!(
        "Personal vault {} created (id={}, owner={})",
        vault.key(),
        params.vault_id,
        ctx.accounts.creator.key()
    );
    Ok(())
}
