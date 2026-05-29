use anchor_lang::prelude::*;

/// Canonical adapter error codes (adapter-standard-v1.md §Canonical Error Codes).
///
/// Variant order is LOAD-BEARING: Anchor assigns codes starting at 6000 in
/// declaration order, and the standard pins each code to a specific meaning.
/// Do NOT reorder or insert variants before `AdapterStateUninit`.
#[error_code]
pub enum AdapterError {
    /// 6000 — CPI caller is not the OXAR dispatcher.
    #[msg("Unauthorized: caller is not the OXAR dispatcher")]
    Unauthorized,
    /// 6001 — `amount == 0` or `shares == 0`.
    #[msg("Amount or shares must be greater than zero")]
    ZeroAmount,
    /// 6002 — Withdraw exceeds `adapter_state.total_shares`.
    #[msg("Withdraw exceeds adapter share balance")]
    InsufficientShares,
    /// 6003 — Checked arithmetic returned `None`.
    #[msg("Arithmetic overflow")]
    MathOverflow,
    /// 6004 — `adapter_data` version byte does not match ADAPTER_INTERFACE_VERSION.
    #[msg("adapter_data version mismatch")]
    VersionMismatch,
    /// 6005 — Oracle / reserve state older than MAX_VALUE_STALENESS_SLOTS.
    #[msg("Oracle data is stale")]
    StaleOracle,
    /// 6006 — `adapter_state` not yet initialized via `adapter_initialize`.
    #[msg("adapter_state is not initialized")]
    AdapterStateUninit,

    // ----------------------------------------------------------------------
    // Non-canonical codes (>= 6007) — adapter-internal, beyond the standard.
    // ----------------------------------------------------------------------
    /// 6007 — `adapter_data` exceeds MAX_ADAPTER_DATA_LEN bytes.
    #[msg("adapter_data exceeds 256 bytes")]
    AdapterDataTooLarge,
    /// 6008 — Instruction handler is not yet implemented (scaffold stub).
    #[msg("Not implemented")]
    NotImplemented,
}
