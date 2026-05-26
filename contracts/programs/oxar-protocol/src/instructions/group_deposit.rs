use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{GroupMember, GroupVault, Vault};

/// Additional deposit by an existing group member.
#[derive(Accounts)]
pub struct GroupDeposit<'info> {
    #[account(mut)]
    pub member: Signer<'info>,

    #[account(
        constraint = group_vault.is_active @ OxarError::VaultNotActive,
    )]
    pub group_vault: Box<Account<'info, GroupVault>>,

    #[account(
        mut,
        address = group_vault.vault,
        constraint = vault.is_active @ OxarError::VaultNotActive,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        mut,
        seeds = [
            GROUP_MEMBER_SEED,
            group_vault.key().as_ref(),
            member.key().as_ref(),
        ],
        bump = group_member.bump,
        constraint = group_member.member == member.key() @ OxarError::NotMember,
    )]
    pub group_member: Box<Account<'info, GroupMember>>,

    #[account(
        mut,
        seeds = [MINT_SEED, vault.key().as_ref()],
        bump,
    )]
    pub vault_token_mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = vault.usdc_mint,
        token::authority = member,
    )]
    pub member_usdc: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = vault_token_mint,
        token::authority = member,
    )]
    pub member_vault_token: Account<'info, TokenAccount>,

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

pub fn handler(ctx: Context<GroupDeposit>, amount: u64) -> Result<()> {
    require!(amount > 0, OxarError::ZeroDeposit);

    let vault = &ctx.accounts.vault;

    // Shares math
    let shares_u128 = (amount as u128)
        .checked_mul(NAV_PRECISION)
        .ok_or(OxarError::MathOverflow)?
        .checked_div(vault.nav_per_share as u128)
        .ok_or(OxarError::MathOverflow)?;
    let shares: u64 = shares_u128
        .try_into()
        .map_err(|_| OxarError::MathOverflow)?;

    // Transfer USDC
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.member_usdc.to_account_info(),
            to: ctx.accounts.usdc_pool.to_account_info(),
            authority: ctx.accounts.member.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;

    // Mint shares
    let group_vault_key = ctx.accounts.group_vault.key();
    let vault_id_bytes = vault.vault_id.to_le_bytes();
    let seeds = &[
        VAULT_SEED,
        group_vault_key.as_ref(),
        vault_id_bytes.as_ref(),
        &[vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let mint_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.vault_token_mint.to_account_info(),
            to: ctx.accounts.member_vault_token.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );
    token::mint_to(mint_ctx, shares)?;

    // Update GroupMember + Vault
    let group_member = &mut ctx.accounts.group_member;
    group_member.deposited_amount = group_member
        .deposited_amount
        .checked_add(amount)
        .ok_or(OxarError::MathOverflow)?;
    group_member.shares_owned = group_member
        .shares_owned
        .checked_add(shares)
        .ok_or(OxarError::MathOverflow)?;

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
        "Group deposit: {} USDC -> {} shares for {}",
        amount,
        shares,
        ctx.accounts.member.key()
    );
    Ok(())
}
