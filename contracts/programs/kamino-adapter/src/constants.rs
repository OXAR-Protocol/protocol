use anchor_lang::prelude::*;

/// Adapter interface version — MUST match what the dispatcher expects and what
/// the registry stores for this adapter. See adapter-standard-v1.md §Versioning.
pub const ADAPTER_INTERFACE_VERSION: u8 = 1;

/// OXAR dispatcher program ID. Every adapter instruction verifies the CPI caller
/// is this program via the instructions sysvar (adapter-standard-v1.md §Security).
pub const OXAR_DISPATCHER_PROGRAM_ID: Pubkey =
    pubkey!("8RCVjQJhfcRYVpAM8v4jhvvbhjfkdqFwPtffEKNcBQwJ");

/// PDA seed prefix for the per-vault adapter state account.
/// seeds = [ADAPTER_STATE_SEED, adapter_program_id, vault]
pub const ADAPTER_STATE_SEED: &[u8] = b"adapter_state";

/// Maximum size of the opaque `adapter_data` arg (adapter-standard-v1.md §Versioning).
pub const MAX_ADAPTER_DATA_LEN: usize = 256;

/// A value computed from an oracle/state older than this many slots is rejected
/// as stale (adapter-standard-v1.md §adapter_current_value).
pub const MAX_VALUE_STALENESS_SLOTS: u64 = 60;
