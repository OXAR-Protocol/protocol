use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::Vault;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED, vault.region.as_bytes(), vault.denomination.as_bytes(), vault.asset_subtype.as_bytes(), &vault.series.to_le_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [MINT_SEED, vault.key().as_ref()],
        bump,
    )]
    pub vault_token_mint: Account<'info, Mint>,

    /// Claimer's vault-token account (tokens to burn).
    #[account(
        mut,
        token::mint = vault_token_mint,
        token::authority = claimer,
    )]
    pub claimer_vault_token: Account<'info, TokenAccount>,

    /// Claimer's USDC account (receives payout).
    #[account(
        mut,
        token::mint = vault.usdc_mint,
        token::authority = claimer,
    )]
    pub claimer_usdc: Account<'info, TokenAccount>,

    /// Pool holding USDC.
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

pub fn handler(ctx: Context<Claim>) -> Result<()> {
    let clock = Clock::get()?;
    let vault = &ctx.accounts.vault;

    require!(
        clock.unix_timestamp >= vault.maturity_ts,
        OxarError::NotMatured
    );

    let shares = ctx.accounts.claimer_vault_token.amount;
    require!(shares > 0, OxarError::InsufficientTokens);

    // Calculate USDC payout: payout = shares * nav_per_share / NAV_PRECISION
    let payout = (shares as u128)
        .checked_mul(vault.nav_per_share as u128)
        .ok_or(OxarError::MathOverflow)?
        .checked_div(NAV_PRECISION)
        .ok_or(OxarError::MathOverflow)? as u64;

    require!(
        ctx.accounts.usdc_pool.amount >= payout,
        OxarError::InsufficientFunds
    );

    // Burn vault tokens
    let burn_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.vault_token_mint.to_account_info(),
            from: ctx.accounts.claimer_vault_token.to_account_info(),
            authority: ctx.accounts.claimer.to_account_info(),
        },
    );
    token::burn(burn_ctx, shares)?;

    // Transfer USDC from pool to claimer (signed by vault PDA)
    let region = ctx.accounts.vault.region.clone();
    let denomination = ctx.accounts.vault.denomination.clone();
    let asset_subtype = ctx.accounts.vault.asset_subtype.clone();
    let seeds = &[
        VAULT_SEED,
        region.as_bytes(),
        denomination.as_bytes(),
        asset_subtype.as_bytes(),
        &vault.series.to_le_bytes(),
        &[ctx.accounts.vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.usdc_pool.to_account_info(),
            to: ctx.accounts.claimer_usdc.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, payout)?;

    // Update vault state
    let vault = &mut ctx.accounts.vault;
    vault.total_shares = vault
        .total_shares
        .checked_sub(shares)
        .ok_or(OxarError::MathOverflow)?;
    vault.total_deposits = vault
        .total_deposits
        .checked_sub(payout.min(vault.total_deposits))
        .ok_or(OxarError::MathOverflow)?;

    msg!(
        "Claimed {} shares for {} USDC by {}",
        shares,
        payout,
        ctx.accounts.claimer.key()
    );
    Ok(())
}
