use anchor_lang::prelude::*;

#[error_code]
pub enum OxarError {
    #[msg("Vault is not active")]
    VaultNotActive,
    #[msg("Deposit amount must be greater than zero")]
    ZeroDeposit,
    #[msg("Insufficient funds for this operation")]
    InsufficientFunds,
    #[msg("Bond has not matured yet")]
    NotMatured,
    #[msg("Bond has already matured, no new deposits allowed")]
    AlreadyMatured,
    #[msg("NAV calculation overflow")]
    MathOverflow,
    #[msg("No time has elapsed since last NAV update")]
    NoTimeElapsed,
    #[msg("Listing amount must be greater than zero")]
    ZeroListingAmount,
    #[msg("Listing price must be greater than zero")]
    ZeroListingPrice,
    #[msg("Seller cannot buy their own listing")]
    SelfPurchase,
    #[msg("Insufficient tokens for claim")]
    InsufficientTokens,
    #[msg("Vault still has outstanding shares, cannot close")]
    VaultNotEmpty,
}
