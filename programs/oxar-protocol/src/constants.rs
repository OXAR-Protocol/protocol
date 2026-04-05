pub const VAULT_SEED: &[u8] = b"vault";
pub const LISTING_SEED: &[u8] = b"listing";
pub const ESCROW_SEED: &[u8] = b"escrow";
pub const POOL_SEED: &[u8] = b"pool";
pub const MINT_SEED: &[u8] = b"mint";
pub const INITIAL_NAV: u64 = 1_000_000;
pub const PROTOCOL_VERSION: u8 = 1;
pub const BPS_DENOMINATOR: u64 = 10_000;
pub const DAYS_PER_YEAR: u64 = 365;
pub const SECONDS_PER_DAY: u64 = 86_400;
pub const USDC_DECIMALS: u8 = 6;
pub const NAV_PRECISION: u128 = 1_000_000;

/// Protocol admin who can create vaults. In production, replace with a PDA-based config.
pub const PROTOCOL_ADMIN: &str = "FoRfraJasYqFp2gRniUQyUfJUUenGhYH211n9nk3jwv5";
