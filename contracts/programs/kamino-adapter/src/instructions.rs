use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::instructions::{
    load_current_index_checked, load_instruction_at_checked,
};

use crate::constants::OXAR_DISPATCHER_PROGRAM_ID;
use crate::error::AdapterError;

pub mod adapter_current_value;
pub mod adapter_deposit;
pub mod adapter_initialize;
pub mod adapter_withdraw;

// Glob re-export is required: Anchor's `#[program]` macro resolves the generated
// `__client_accounts_*` / `__cpi_client_accounts_*` modules through these globs.
// The resulting `handler` name ambiguity is a benign, expected Anchor artifact
// (lib.rs always calls handlers via their full module path).
pub use adapter_current_value::*;
pub use adapter_deposit::*;
pub use adapter_initialize::*;
pub use adapter_withdraw::*;

/// Verify the CPI caller (the instruction that invoked this adapter) is the OXAR
/// dispatcher. Reads the *currently executing* instruction from the instructions
/// sysvar rather than assuming position 0 — ComputeBudget or other preamble
/// instructions may precede the adapter call (adapter-standard-v1.md §Security).
pub fn verify_caller_is_dispatcher(instructions_sysvar: &AccountInfo) -> Result<()> {
    let current_ix_index = load_current_index_checked(instructions_sysvar)?;
    let parent_ix =
        load_instruction_at_checked(current_ix_index as usize, instructions_sysvar)?;
    require_keys_eq!(
        parent_ix.program_id,
        OXAR_DISPATCHER_PROGRAM_ID,
        AdapterError::Unauthorized
    );
    Ok(())
}
