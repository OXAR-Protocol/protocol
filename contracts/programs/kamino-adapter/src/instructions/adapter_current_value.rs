use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar;

use crate::constants::*;
use crate::error::AdapterError;
use crate::state::AdapterState;

/// Return current USDC value of this vault's Kamino holdings. Stub — Task 14.
///
/// Account layout (adapter-standard-v1.md §adapter_current_value):
/// 0 dispatcher_program, 1 instructions_sysvar, 2 vault, 3 adapter_state,
/// 4+ remaining_accounts (reserve state, oracle).
///
/// Implementation MUST `set_return_data(value.to_le_bytes())` and emit
/// `AdapterValueEvent`. Returns ONLY the adapter's own holdings.
#[derive(Accounts)]
pub struct AdapterCurrentValue<'info> {
    /// CHECK: OXAR dispatcher program id; identity verified in handler via sysvar.
    pub dispatcher_program: AccountInfo<'info>,

    /// CHECK: instructions sysvar — address enforced; used for caller verification.
    #[account(address = sysvar::instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,

    /// CHECK: OXAR vault PDA. Validated against adapter_state.vault.
    pub vault: AccountInfo<'info>,

    #[account(
        seeds = [ADAPTER_STATE_SEED, crate::ID.as_ref(), vault.key().as_ref()],
        bump = adapter_state.bump,
        has_one = vault @ AdapterError::Unauthorized,
    )]
    pub adapter_state: Account<'info, AdapterState>,
}

pub fn handler<'info>(
    _ctx: Context<'_, '_, '_, 'info, AdapterCurrentValue<'info>>,
    adapter_data: Vec<u8>,
) -> Result<()> {
    require!(
        adapter_data.len() <= MAX_ADAPTER_DATA_LEN,
        AdapterError::AdapterDataTooLarge
    );
    Err(AdapterError::NotImplemented.into())
}
