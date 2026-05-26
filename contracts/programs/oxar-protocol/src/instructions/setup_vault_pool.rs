use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::Vault;

/// Second step of vault initialization: create the hot USDC pool and activate the vault.
///
/// The pool is a PDA-derived token account that holds liquid USDC for instant withdrawals
/// (per the 20/80 hot/cold ratio). The "cold" portion is routed to the vault's yield source
/// lazily via `route_yield_deposit` (Phase D).
#[derive(Accounts)]
pub struct SetupVaultPool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority,
        constraint = vault.usdc_pool == Pubkey::default() @ OxarError::VaultAlreadySetup,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(address = vault.usdc_mint)]
    pub usdc_mint: Account<'info, Mint>,

    /// Hot pool: holds liquid USDC for instant withdrawals.
    #[account(
        init,
        payer = authority,
        seeds = [POOL_SEED, vault.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = vault,
    )]
    pub usdc_pool: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SetupVaultPool>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.usdc_pool = ctx.accounts.usdc_pool.key();
    vault.is_active = true;

    msg!("Vault activated: {}", vault.key());
    Ok(())
}
