use anchor_lang::prelude::*;

#[error_code]
pub enum OxarError {
    // ===== Vault =====
    #[msg("Vault is not active")]
    VaultNotActive,
    #[msg("Vault is in wrong state for this operation")]
    InvalidVaultState,
    #[msg("Vault type mismatch (personal vs group)")]
    VaultTypeMismatch,

    // ===== Deposits / withdrawals =====
    #[msg("Deposit amount must be greater than zero")]
    ZeroDeposit,
    #[msg("Withdrawal amount must be greater than zero")]
    ZeroWithdrawal,
    #[msg("Withdrawal exceeds your share balance")]
    InsufficientShares,
    #[msg("Insufficient funds in pool for withdrawal")]
    InsufficientFunds,
    #[msg("Deposit below minimum threshold")]
    BelowMinimumDeposit,

    // ===== Math =====
    #[msg("Arithmetic overflow")]
    MathOverflow,

    // ===== Group vault =====
    #[msg("Group vault is full")]
    GroupVaultFull,
    #[msg("Invite code is invalid")]
    InvalidInviteCode,
    #[msg("Already a member of this group vault")]
    AlreadyMember,
    #[msg("Not a member of this group vault")]
    NotMember,
    #[msg("Goal deadline is in the past")]
    InvalidDeadline,

    // ===== Rules =====
    #[msg("Rule destinations must sum to 100% (10_000 bps)")]
    InvalidRuleDestinations,
    #[msg("Rule is not active")]
    RuleInactive,

    // ===== System =====
    #[msg("Unauthorized: signer does not have permission")]
    Unauthorized,
    #[msg("This instruction is not yet implemented")]
    NotImplemented,
    #[msg("Vault pool is already set up")]
    VaultAlreadySetup,
    #[msg("Vault was created under an older protocol version — please re-init")]
    ProtocolVersionMismatch,

    // ===== Adapter registry =====
    #[msg("Adapter registry full — MAX_ADAPTERS reached")]
    RegistryFull,
    #[msg("Adapter name is empty or too long (max 32 bytes)")]
    InvalidAdapterName,
    #[msg("Adapter interface version not supported")]
    UnsupportedInterfaceVersion,
    #[msg("Adapter program account is not executable")]
    InvalidAdapterProgram,
}
