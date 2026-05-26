use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{Vault, VaultType};

/// Deposit USDC into a vault, receive shares minted at current NAV.
///
/// All USDC initially lands in the hot pool. The `route_yield_deposit` instruction
/// (Phase D) lazily routes the cold portion (80% by default) into the yield source.
#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

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
        token::mint = vault.usdc_mint,
        token::authority = depositor,
    )]
    pub depositor_usdc: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = vault_token_mint,
        token::authority = depositor,
    )]
    pub depositor_vault_token: Account<'info, TokenAccount>,

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
    let vault = &ctx.accounts.vault;

    require!(amount > 0, OxarError::ZeroDeposit);

    // Calculate shares: shares = amount * NAV_PRECISION / nav_per_share
    let shares_u128 = (amount as u128)
        .checked_mul(NAV_PRECISION)
        .ok_or(OxarError::MathOverflow)?
        .checked_div(vault.nav_per_share as u128)
        .ok_or(OxarError::MathOverflow)?;
    let shares: u64 = shares_u128
        .try_into()
        .map_err(|_| OxarError::MathOverflow)?;
    require!(shares > 0, OxarError::BelowMinimumDeposit);

    // Transfer USDC from depositor to hot pool
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.depositor_usdc.to_account_info(),
            to: ctx.accounts.usdc_pool.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;

    // Mint vault shares to depositor (signed by vault PDA)
    let authority_key = ctx.accounts.vault.authority;
    let vault_id_bytes = ctx.accounts.vault.vault_id.to_le_bytes();
    let seeds = &[
        VAULT_SEED,
        authority_key.as_ref(),
        vault_id_bytes.as_ref(),
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

    // Update vault accounting
    let vault = &mut ctx.accounts.vault;
    vault.total_deposits = vault
        .total_deposits
        .checked_add(amount)
        .ok_or(OxarError::MathOverflow)?;
    vault.total_shares = vault
        .total_shares
        .checked_add(shares)
        .ok_or(OxarError::MathOverflow)?;
    vault.hot_pool_balance = vault
        .hot_pool_balance
        .checked_add(amount)
        .ok_or(OxarError::MathOverflow)?;

    msg!(
        "Deposit {} USDC -> {} shares for {} (vault {})",
        amount,
        shares,
        ctx.accounts.depositor.key(),
        vault.key()
    );
    Ok(())
}
