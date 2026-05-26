use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{GroupMember, GroupVault, Vault};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct JoinGroupVaultParams {
    /// Plaintext invite code (32 bytes — hashed and compared on-chain)
    pub invite_code: [u8; 32],
    pub initial_deposit: u64,
    pub display_name: String,
}

#[derive(Accounts)]
#[instruction(params: JoinGroupVaultParams)]
pub struct JoinGroupVault<'info> {
    #[account(mut)]
    pub member: Signer<'info>,

    #[account(
        mut,
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
        init,
        payer = member,
        space = 8 + GroupMember::INIT_SPACE,
        seeds = [
            GROUP_MEMBER_SEED,
            group_vault.key().as_ref(),
            member.key().as_ref(),
        ],
        bump,
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
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<JoinGroupVault>,
    params: JoinGroupVaultParams,
) -> Result<()> {
    let clock = Clock::get()?;
    let group_vault = &mut ctx.accounts.group_vault;
    let vault = &ctx.accounts.vault;

    // Verify invite
    let provided_hash = hash(&params.invite_code).to_bytes();
    require!(
        provided_hash == group_vault.invite_hash,
        OxarError::InvalidInviteCode
    );

    // Limits
    require!(
        group_vault.member_count < MAX_GROUP_MEMBERS,
        OxarError::GroupVaultFull
    );
    require!(params.initial_deposit > 0, OxarError::ZeroDeposit);
    require!(
        params.initial_deposit >= MIN_GROUP_DEPOSIT,
        OxarError::BelowMinimumDeposit
    );
    require!(
        params.display_name.len() <= 32,
        OxarError::InvalidVaultState
    );

    // Shares = amount * NAV_PRECISION / nav_per_share
    let shares_u128 = (params.initial_deposit as u128)
        .checked_mul(NAV_PRECISION)
        .ok_or(OxarError::MathOverflow)?
        .checked_div(vault.nav_per_share as u128)
        .ok_or(OxarError::MathOverflow)?;
    let shares: u64 = shares_u128
        .try_into()
        .map_err(|_| OxarError::MathOverflow)?;

    // Transfer USDC from member to pool
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.member_usdc.to_account_info(),
            to: ctx.accounts.usdc_pool.to_account_info(),
            authority: ctx.accounts.member.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, params.initial_deposit)?;

    // Mint vault shares to member (signed by vault PDA — vault.authority is group_vault_pda)
    let group_vault_key = group_vault.key();
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

    // Setup GroupMember
    let group_member = &mut ctx.accounts.group_member;
    group_member.group_vault = group_vault.key();
    group_member.member = ctx.accounts.member.key();
    group_member.deposited_amount = params.initial_deposit;
    group_member.shares_owned = shares;
    group_member.joined_at = clock.unix_timestamp;
    group_member.display_name = params.display_name;
    group_member.bump = ctx.bumps.group_member;

    // Update GroupVault + Vault accounting (drop borrows first)
    group_vault.member_count = group_vault
        .member_count
        .checked_add(1)
        .ok_or(OxarError::MathOverflow)?;

    let vault = &mut ctx.accounts.vault;
    vault.total_deposits = vault
        .total_deposits
        .checked_add(params.initial_deposit)
        .ok_or(OxarError::MathOverflow)?;
    vault.total_shares = vault
        .total_shares
        .checked_add(shares)
        .ok_or(OxarError::MathOverflow)?;
    vault.hot_pool_balance = vault
        .hot_pool_balance
        .checked_add(params.initial_deposit)
        .ok_or(OxarError::MathOverflow)?;

    msg!(
        "Member {} joined group {} with {} USDC -> {} shares",
        ctx.accounts.member.key(),
        ctx.accounts.group_vault.key(),
        params.initial_deposit,
        shares
    );
    Ok(())
}
