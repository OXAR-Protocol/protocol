use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::constants::*;
use crate::error::AdapterError;
use crate::instructions::verify_caller_is_dispatcher;
use crate::state::AdapterState;

/// Create the per-vault `adapter_state` PDA and the vault-owned collateral
/// token account (cToken/cUSDC) that will hold Kamino reserve collateral.
///
/// CPI'd by the OXAR dispatcher (`route_yield_init`) — the top-level instruction
/// is the dispatcher, verified via the instructions sysvar.
///
/// Standard account slots 0–5 (adapter-standard-v1.md §adapter_initialize):
/// 0 dispatcher_program, 1 instructions_sysvar, 2 vault, 3 adapter_state (init),
/// 4 rent_payer (signer), 5 system_program.
/// Kamino-specific slots 6–10 appended per this adapter's README.
#[derive(Accounts)]
pub struct AdapterInitialize<'info> {
    /// CHECK: OXAR dispatcher program id; identity verified in handler via sysvar.
    #[account(address = OXAR_DISPATCHER_PROGRAM_ID @ AdapterError::Unauthorized)]
    pub dispatcher_program: AccountInfo<'info>,

    /// CHECK: instructions sysvar — address enforced; used for caller verification.
    #[account(address = sysvar::instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,

    /// CHECK: OXAR vault PDA this state is keyed to; also the collateral authority.
    pub vault: AccountInfo<'info>,

    #[account(
        init,
        payer = rent_payer,
        space = 8 + AdapterState::INIT_SPACE,
        seeds = [ADAPTER_STATE_SEED, crate::ID.as_ref(), vault.key().as_ref()],
        bump,
    )]
    pub adapter_state: Account<'info, AdapterState>,

    #[account(mut)]
    pub rent_payer: Signer<'info>,

    pub system_program: Program<'info, System>,

    // ----- Kamino-specific (slots 6+) -----
    /// CHECK: the klend reserve this vault deposits into. Only its key is recorded;
    /// klend validates the reserve↔collateral-mint binding at deposit time.
    pub reserve: AccountInfo<'info>,

    /// Reserve collateral mint (cToken). Used to derive the vault's collateral ATA.
    pub reserve_collateral_mint: Account<'info, Mint>,

    /// Vault-owned collateral token account — holds cTokens received from Kamino.
    /// Authority is the vault PDA so deposit/withdraw use a single consistent signer.
    #[account(
        init,
        payer = rent_payer,
        associated_token::mint = reserve_collateral_mint,
        associated_token::authority = vault,
    )]
    pub collateral_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handler(ctx: Context<AdapterInitialize>, adapter_data: Vec<u8>) -> Result<()> {
    require!(
        adapter_data.len() <= MAX_ADAPTER_DATA_LEN,
        AdapterError::AdapterDataTooLarge
    );
    verify_caller_is_dispatcher(&ctx.accounts.instructions_sysvar)?;

    let clock = Clock::get()?;
    let state = &mut ctx.accounts.adapter_state;
    state.vault = ctx.accounts.vault.key();
    state.adapter_program = crate::ID;
    state.created_at = clock.unix_timestamp;
    state.total_shares = 0;
    state.kamino_reserve = ctx.accounts.reserve.key();
    state.collateral_vault = ctx.accounts.collateral_vault.key();
    state.bump = ctx.bumps.adapter_state;

    msg!(
        "kamino-adapter init: vault={} reserve={} collateral_vault={}",
        state.vault,
        state.kamino_reserve,
        state.collateral_vault
    );
    Ok(())
}
