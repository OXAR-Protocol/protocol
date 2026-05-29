use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar;

use crate::constants::*;
use crate::error::AdapterError;
use crate::state::AdapterState;

/// Create the per-vault `adapter_state` PDA. Stub — implemented in Task 11.
///
/// Account layout (adapter-standard-v1.md §adapter_initialize):
/// 0 dispatcher_program, 1 instructions_sysvar, 2 vault, 3 adapter_state (init),
/// 4 rent_payer (signer), 5 system_program.
#[derive(Accounts)]
pub struct AdapterInitialize<'info> {
    /// CHECK: OXAR dispatcher program id; identity verified in handler via sysvar.
    pub dispatcher_program: AccountInfo<'info>,

    /// CHECK: instructions sysvar — address enforced; used for caller verification.
    #[account(address = sysvar::instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,

    /// CHECK: OXAR vault PDA this state is keyed to. Only its key is stored.
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
}

pub fn handler(_ctx: Context<AdapterInitialize>, adapter_data: Vec<u8>) -> Result<()> {
    require!(
        adapter_data.len() <= MAX_ADAPTER_DATA_LEN,
        AdapterError::AdapterDataTooLarge
    );
    Err(AdapterError::NotImplemented.into())
}
