use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::Vault;

/// Step 2: Create USDC pool and activate vault.
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

    /// USDC mint.
    #[account(address = vault.usdc_mint)]
    pub usdc_mint: Account<'info, Mint>,

    /// Pool token account for USDC deposits.
    #[account(
        init,
        payer = authority,
        seeds = [POOL_SEED, vault.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = vault,
    )]
    pub usdc_pool: Account<'info, TokenAccount>,

    /// CHECK: Treasury wallet pubkey. Stored on the vault so that downstream instructions
    /// (e.g. buy_listing) can validate fee destinations against it. The treasury itself
    /// is not accessed here — only its address is recorded.
    pub treasury: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SetupVaultPool>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.usdc_pool = ctx.accounts.usdc_pool.key();
    vault.treasury = ctx.accounts.treasury.key();
    vault.is_active = true;

    msg!("Vault activated: {}", vault.key());
    Ok(())
}
