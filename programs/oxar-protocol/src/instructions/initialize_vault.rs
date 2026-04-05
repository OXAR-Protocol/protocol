use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::Vault;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeVaultParams {
    pub asset_class: String,
    pub region: String,
    pub denomination: String,
    pub asset_subtype: String,
    pub apy_bps: u64,
    pub maturity_ts: i64,
    pub fee_bps: u16,
    pub series: u16,
}

/// Step 1: Create vault PDA and vault token mint.
#[derive(Accounts)]
#[instruction(params: InitializeVaultParams)]
pub struct InitializeVault<'info> {
    #[account(
        mut,
        constraint = authority.key().to_string() == PROTOCOL_ADMIN @ OxarError::Unauthorized,
    )]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [
            VAULT_SEED,
            params.region.as_bytes(),
            params.denomination.as_bytes(),
            params.asset_subtype.as_bytes(),
            &params.series.to_le_bytes(),
        ],
        bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    /// The USDC mint (existing).
    pub usdc_mint: Account<'info, Mint>,

    /// The vault's own token mint.
    #[account(
        init,
        payer = authority,
        seeds = [MINT_SEED, vault.key().as_ref()],
        bump,
        mint::decimals = USDC_DECIMALS,
        mint::authority = vault,
    )]
    pub vault_token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeVault>, params: InitializeVaultParams) -> Result<()> {
    let clock = Clock::get()?;

    // maturity_ts = 0 means perpetual (no maturity), otherwise must be in the future
    if params.maturity_ts > 0 {
        require!(params.maturity_ts > clock.unix_timestamp, OxarError::AlreadyMatured);
    }

    let vault = &mut ctx.accounts.vault;
    vault.protocol_version = PROTOCOL_VERSION;
    vault.authority = ctx.accounts.authority.key();
    vault.usdc_mint = ctx.accounts.usdc_mint.key();
    vault.vault_token_mint = ctx.accounts.vault_token_mint.key();
    vault.usdc_pool = Pubkey::default();
    vault.treasury = Pubkey::default();
    vault.asset_class = params.asset_class;
    vault.region = params.region;
    vault.denomination = params.denomination;
    vault.asset_subtype = params.asset_subtype;
    vault.apy_bps = params.apy_bps;
    vault.nav_per_share = INITIAL_NAV;
    vault.total_deposits = 0;
    vault.total_shares = 0;
    vault.last_update_ts = clock.unix_timestamp;
    vault.maturity_ts = params.maturity_ts;
    vault.is_active = false;
    vault.fee_bps = params.fee_bps;
    vault.series = params.series;
    vault.bump = ctx.bumps.vault;

    msg!("Vault created: {} (series {})", vault.key(), vault.series);
    Ok(())
}
