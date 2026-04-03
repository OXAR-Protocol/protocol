use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::Vault;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED, vault.authority.as_ref(), vault.asset_class.as_bytes()],
        bump = vault.bump,
        constraint = vault.is_active @ OxarError::VaultNotActive,
    )]
    pub vault: Account<'info, Vault>,

    #[account(
        mut,
        seeds = [MINT_SEED, vault.key().as_ref()],
        bump,
    )]
    pub vault_token_mint: Account<'info, Mint>,

    /// Depositor's USDC token account.
    #[account(
        mut,
        token::mint = vault.usdc_mint,
        token::authority = depositor,
    )]
    pub depositor_usdc: Account<'info, TokenAccount>,

    /// Depositor's vault-token account (receives minted shares).
    #[account(
        mut,
        token::mint = vault_token_mint,
        token::authority = depositor,
    )]
    pub depositor_vault_token: Account<'info, TokenAccount>,

    /// Pool that holds USDC.
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

pub fn handler(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let clock = Clock::get()?;
    let vault = &ctx.accounts.vault;

    require!(amount > 0, OxarError::ZeroDeposit);
    require!(clock.unix_timestamp < vault.maturity_ts, OxarError::AlreadyMatured);

    // Calculate shares: shares = amount * NAV_PRECISION / nav_per_share
    let shares = (amount as u128)
        .checked_mul(NAV_PRECISION)
        .ok_or(OxarError::MathOverflow)?
        .checked_div(vault.nav_per_share as u128)
        .ok_or(OxarError::MathOverflow)? as u64;

    // Transfer USDC from depositor to pool
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.depositor_usdc.to_account_info(),
            to: ctx.accounts.usdc_pool.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;

    // Mint vault tokens to depositor
    let authority_key = ctx.accounts.vault.authority;
    let asset_class = ctx.accounts.vault.asset_class.clone();
    let seeds = &[
        VAULT_SEED,
        authority_key.as_ref(),
        asset_class.as_bytes(),
        &[ctx.accounts.vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let mint_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.vault_token_mint.to_account_info(),
            to: ctx.accounts.depositor_vault_token.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );
    token::mint_to(mint_ctx, shares)?;

    // Update vault state
    let vault = &mut ctx.accounts.vault;
    vault.total_deposits = vault
        .total_deposits
        .checked_add(amount)
        .ok_or(OxarError::MathOverflow)?;
    vault.total_shares = vault
        .total_shares
        .checked_add(shares)
        .ok_or(OxarError::MathOverflow)?;

    msg!(
        "Deposited {} USDC, minted {} shares for {}",
        amount,
        shares,
        ctx.accounts.depositor.key()
    );
    Ok(())
}
