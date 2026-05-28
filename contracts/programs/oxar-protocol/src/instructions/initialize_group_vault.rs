use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{
    GroupVault, RiskTemplate, Vault, VaultType,
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeGroupVaultParams {
    pub vault_id: u64,
    pub name: String,
    pub goal_amount: u64,
    pub goal_deadline: i64,
    /// SHA-256(invite_code) — verified at join time
    pub invite_hash: [u8; 32],
    pub risk_template: RiskTemplate,
    pub fee_bps: u16,
}

#[derive(Accounts)]
#[instruction(params: InitializeGroupVaultParams)]
pub struct InitializeGroupVault<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + GroupVault::INIT_SPACE,
        seeds = [
            GROUP_VAULT_SEED,
            creator.key().as_ref(),
            &params.vault_id.to_le_bytes(),
        ],
        bump,
    )]
    pub group_vault: Box<Account<'info, GroupVault>>,

    /// Backing vault that holds the actual funds. Authority = group_vault PDA.
    #[account(
        init,
        payer = creator,
        space = 8 + Vault::INIT_SPACE,
        seeds = [
            VAULT_SEED,
            group_vault.key().as_ref(),
            &params.vault_id.to_le_bytes(),
        ],
        bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    pub usdc_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        seeds = [MINT_SEED, vault.key().as_ref()],
        bump,
        mint::decimals = USDC_DECIMALS,
        mint::authority = vault,
    )]
    pub vault_token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        seeds = [POOL_SEED, vault.key().as_ref()],
        bump,
        token::mint = usdc_mint,
        token::authority = vault,
    )]
    pub usdc_pool: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<InitializeGroupVault>,
    params: InitializeGroupVaultParams,
) -> Result<()> {
    let clock = Clock::get()?;

    require!(params.name.len() <= 48, OxarError::InvalidVaultState);
    if params.goal_deadline > 0 {
        require!(
            params.goal_deadline > clock.unix_timestamp,
            OxarError::InvalidDeadline
        );
    }

    let group_vault_key = ctx.accounts.group_vault.key();
    let vault_id = params.vault_id;

    // Setup backing vault
    let vault = &mut ctx.accounts.vault;
    vault.protocol_version = PROTOCOL_VERSION;
    vault.vault_type = VaultType::Group;
    vault.authority = group_vault_key;
    vault.usdc_mint = ctx.accounts.usdc_mint.key();
    vault.vault_token_mint = ctx.accounts.vault_token_mint.key();
    vault.usdc_pool = ctx.accounts.usdc_pool.key();
    vault.adapter_program = Pubkey::default(); // Idle — no external routing
    vault.risk_template = params.risk_template;
    vault.nav_per_share = INITIAL_NAV;
    vault.total_deposits = 0;
    vault.total_shares = 0;
    vault.hot_pool_balance = 0;
    vault.cold_capital = 0;
    vault.last_update_ts = clock.unix_timestamp;
    vault.is_active = true;
    vault.fee_bps = params.fee_bps;
    vault.vault_id = vault_id;
    vault.bump = ctx.bumps.vault;

    // Setup group vault metadata
    let group_vault = &mut ctx.accounts.group_vault;
    group_vault.vault = ctx.accounts.vault.key();
    group_vault.creator = ctx.accounts.creator.key();
    group_vault.name = params.name;
    group_vault.goal_amount = params.goal_amount;
    group_vault.goal_deadline = params.goal_deadline;
    group_vault.member_count = 0; // First member added by separate join_group_vault call
    group_vault.invite_hash = params.invite_hash;
    group_vault.created_at = clock.unix_timestamp;
    group_vault.is_active = true;
    group_vault.bump = ctx.bumps.group_vault;

    msg!(
        "Group vault created: {} (backing {}, creator {})",
        group_vault.key(),
        ctx.accounts.vault.key(),
        ctx.accounts.creator.key()
    );
    Ok(())
}

/// Helper: hash an invite code to compare against stored invite_hash.
pub fn hash_invite_code(invite_code: &[u8]) -> [u8; 32] {
    hash(invite_code).to_bytes()
}
