use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar;

use crate::constants::*;
use crate::error::AdapterError;
use crate::state::AdapterState;

/// Pull `amount` USDC from the vault pool into the Kamino reserve. Stub — Task 12.
///
/// Account layout (adapter-standard-v1.md §adapter_deposit):
/// 0 dispatcher_program, 1 instructions_sysvar, 2 vault (signer), 3 vault_usdc_pool,
/// 4 adapter_state, 5+ remaining_accounts (klend reserve, market, etc.).
#[derive(Accounts)]
pub struct AdapterDeposit<'info> {
    /// CHECK: OXAR dispatcher program id; identity verified in handler via sysvar.
    pub dispatcher_program: AccountInfo<'info>,

    /// CHECK: instructions sysvar — address enforced; used for caller verification.
    #[account(address = sysvar::instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,

    /// CHECK: OXAR vault PDA; signs the CPI. Validated against adapter_state.vault.
    pub vault: AccountInfo<'info>,

    /// CHECK: source USDC token account owned by the vault PDA. Validated by the
    /// underlying token-program CPI in the implementation.
    #[account(mut)]
    pub vault_usdc_pool: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [ADAPTER_STATE_SEED, crate::ID.as_ref(), vault.key().as_ref()],
        bump = adapter_state.bump,
        has_one = vault @ AdapterError::Unauthorized,
    )]
    pub adapter_state: Account<'info, AdapterState>,
}

pub fn handler<'info>(
    _ctx: Context<'_, '_, '_, 'info, AdapterDeposit<'info>>,
    amount: u64,
    adapter_data: Vec<u8>,
) -> Result<()> {
    require!(amount > 0, AdapterError::ZeroAmount);
    require!(
        adapter_data.len() <= MAX_ADAPTER_DATA_LEN,
        AdapterError::AdapterDataTooLarge
    );
    Err(AdapterError::NotImplemented.into())
}
