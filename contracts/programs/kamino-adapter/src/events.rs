use anchor_lang::prelude::*;

/// Emitted by `adapter_deposit` (adapter-standard-v1.md §adapter_deposit).
#[event]
pub struct AdapterDepositEvent {
    pub vault: Pubkey,
    pub amount_in: u64,
    pub shares_minted: u64,
    pub adapter_state_after: Pubkey,
}

/// Emitted by `adapter_withdraw` (adapter-standard-v1.md §adapter_withdraw).
#[event]
pub struct AdapterWithdrawEvent {
    pub vault: Pubkey,
    pub shares_burned: u64,
    pub amount_out: u64,
}

/// Emitted by `adapter_current_value` (adapter-standard-v1.md §adapter_current_value).
#[event]
pub struct AdapterValueEvent {
    pub vault: Pubkey,
    pub current_value_usdc: u64,
    pub as_of_slot: u64,
}
