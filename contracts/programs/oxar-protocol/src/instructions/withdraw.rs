use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{Vault, VaultType};

/// Withdraw USDC from a vault by burning shares.
///
/// Payout uses current NAV: payout = shares * nav_per_share / NAV_PRECISION.
/// Funds come from the hot pool first. If hot pool is insufficient (cold capital
/// is in a yield source), withdraw will fail and user must first call
/// `route_yield_withdraw` to top up the hot pool.
///
/// No maturity check — vaults are perpetual, withdraw anytime.
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub withdrawer: Signer<'info>,

    #[account(
        mut,
        seeds = [
            VAULT_SEED,
            vault.authority.as_ref(),
            &vault.vault_id.to_le_bytes(),
        ],
        bump = vault.bump,
        constraint = vault.is_active @ OxarError::VaultNotActive,
        constraint = vault.vault_type == VaultType::Personal @ OxarError::VaultTypeMismatch,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [MINT_SEED, vault.key().as_ref()],
        bump,
    )]
    pub vault_token_mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = vault_token_mint,
        token::authority = withdrawer,
    )]
    pub withdrawer_vault_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = vault.usdc_mint,
        token::authority = withdrawer,
    )]
    pub withdrawer_usdc: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [POOL_SEED, vault.key().as_ref()],
        bump,
        token::mint = vault.usdc_mint,
        token::authority = vault,
    )]
    pub usdc_pool: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<Withdraw>, shares: u64) -> Result<()> {
    let vault = &ctx.accounts.vault;

    require!(shares > 0, OxarError::ZeroWithdrawal);
    require!(
        ctx.accounts.withdrawer_vault_token.amount >= shares,
        OxarError::InsufficientShares
    );

    // Payout = shares * nav_per_share / NAV_PRECISION
    let payout_u128 = (shares as u128)
        .checked_mul(vault.nav_per_share as u128)
        .ok_or(OxarError::MathOverflow)?
        .checked_div(NAV_PRECISION)
        .ok_or(OxarError::MathOverflow)?;
    let payout: u64 = payout_u128
        .try_into()
        .map_err(|_| OxarError::MathOverflow)?;

    require!(
        ctx.accounts.usdc_pool.amount >= payout,
        OxarError::InsufficientFunds
    );

    // Burn shares
    let burn_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.vault_token_mint.to_account_info(),
            from: ctx.accounts.withdrawer_vault_token.to_account_info(),
            authority: ctx.accounts.withdrawer.to_account_info(),
        },
    );
    token::burn(burn_ctx, shares)?;

    // Transfer USDC from pool to withdrawer (signed by vault PDA)
    let authority_key = ctx.accounts.vault.authority;
    let vault_id_bytes = ctx.accounts.vault.vault_id.to_le_bytes();
    let seeds = &[
        VAULT_SEED,
        authority_key.as_ref(),
        vault_id_bytes.as_ref(),
        &[ctx.accounts.vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.usdc_pool.to_account_info(),
            to: ctx.accounts.withdrawer_usdc.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, payout)?;

    // Update vault accounting
    let vault = &mut ctx.accounts.vault;
    vault.total_shares = vault
        .total_shares
        .checked_sub(shares)
        .ok_or(OxarError::MathOverflow)?;
    vault.total_deposits = vault.total_deposits.saturating_sub(payout);
    vault.hot_pool_balance = vault.hot_pool_balance.saturating_sub(payout);

    msg!(
        "Withdraw {} shares -> {} USDC for {} (vault {})",
        shares,
        payout,
        ctx.accounts.withdrawer.key(),
        vault.key()
    );
    Ok(())
}
