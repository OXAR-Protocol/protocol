use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{GroupMember, GroupVault, Vault};

/// Pro-rata withdraw from a group vault. Member can withdraw their portion
/// at any time without consensus from other members. If they withdraw all
/// their shares, GroupMember stays open — call `leave_group_vault` to close
/// and reclaim rent.
#[derive(Accounts)]
pub struct GroupWithdraw<'info> {
    #[account(mut)]
    pub member: Signer<'info>,

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
        token::mint = vault_token_mint,
        token::authority = member,
    )]
    pub member_vault_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = vault.usdc_mint,
        token::authority = member,
    )]
    pub member_usdc: Account<'info, TokenAccount>,

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

pub fn handler(ctx: Context<GroupWithdraw>, shares: u64) -> Result<()> {
    require!(
        ctx.accounts.vault.protocol_version == PROTOCOL_VERSION,
        OxarError::ProtocolVersionMismatch
    );

    require!(shares > 0, OxarError::ZeroWithdrawal);

    let vault = &ctx.accounts.vault;
    let group_member = &ctx.accounts.group_member;

    require!(
        group_member.shares_owned >= shares,
        OxarError::InsufficientShares
    );
    require!(
        ctx.accounts.member_vault_token.amount >= shares,
        OxarError::InsufficientShares
    );

    // payout = shares * nav_per_share / NAV_PRECISION
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
            from: ctx.accounts.member_vault_token.to_account_info(),
            authority: ctx.accounts.member.to_account_info(),
        },
    );
    token::burn(burn_ctx, shares)?;

    // Transfer USDC from pool to member (signed by vault PDA)
    let group_vault_key = ctx.accounts.group_vault.key();
    let vault_id_bytes = vault.vault_id.to_le_bytes();
    let seeds = &[
        VAULT_SEED,
        group_vault_key.as_ref(),
        vault_id_bytes.as_ref(),
        &[vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.usdc_pool.to_account_info(),
            to: ctx.accounts.member_usdc.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, payout)?;

    // Update accounting
    let group_member = &mut ctx.accounts.group_member;
    group_member.shares_owned = group_member
        .shares_owned
        .checked_sub(shares)
        .ok_or(OxarError::MathOverflow)?;
    group_member.deposited_amount =
        group_member.deposited_amount.saturating_sub(payout);

    let vault = &mut ctx.accounts.vault;
    vault.total_shares = vault
        .total_shares
        .checked_sub(shares)
        .ok_or(OxarError::MathOverflow)?;
    vault.total_deposits = vault.total_deposits.saturating_sub(payout);
    vault.hot_pool_balance = vault.hot_pool_balance.saturating_sub(payout);

    msg!(
        "Group withdraw: {} shares -> {} USDC for {}",
        shares,
        payout,
        ctx.accounts.member.key()
    );
    Ok(())
}
