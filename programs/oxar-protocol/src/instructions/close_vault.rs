use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Token, TokenAccount};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::Vault;

#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        close = authority,
        has_one = authority,
        seeds = [VAULT_SEED, vault.region.as_bytes(), vault.denomination.as_bytes(), vault.asset_subtype.as_bytes(), &vault.series.to_le_bytes()],
        bump = vault.bump,
        // Can only close if no shares outstanding
        constraint = vault.total_shares == 0 @ OxarError::VaultNotEmpty,
    )]
    pub vault: Box<Account<'info, Vault>>,

    /// USDC pool to close and recover rent.
    #[account(
        mut,
        address = vault.usdc_pool,
    )]
    pub usdc_pool: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CloseVault>) -> Result<()> {
    let vault = &ctx.accounts.vault;
    let region = vault.region.clone();
    let denomination = vault.denomination.clone();
    let asset_subtype = vault.asset_subtype.clone();

    let vault_seeds = &[
        VAULT_SEED,
        region.as_bytes(),
        denomination.as_bytes(),
        asset_subtype.as_bytes(),
        &vault.series.to_le_bytes(),
        &[vault.bump],
    ];
    let signer_seeds = &[&vault_seeds[..]];

    // Close USDC pool, return rent to authority
    token::close_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.usdc_pool.to_account_info(),
            destination: ctx.accounts.authority.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    ))?;

    msg!("Vault closed: {}", ctx.accounts.vault.key());
    Ok(())
}
