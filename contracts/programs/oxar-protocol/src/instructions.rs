// ============================================================================
// Personal vault — single-user yield positions
// ============================================================================
pub mod initialize_personal_vault;
pub mod setup_vault_pool;
pub mod deposit;
pub mod withdraw;
pub mod crank_nav;

// ============================================================================
// Group vault — shared savings with pro-rata claims (Phase B)
// ============================================================================
pub mod initialize_group_vault;
pub mod join_group_vault;
pub mod group_deposit;
pub mod group_withdraw;
pub mod leave_group_vault;

// ============================================================================
// Rules engine — auto-distribute and future automation (Phase C)
// ============================================================================
pub mod create_rule;
pub mod execute_rule;
pub mod cancel_rule;

// ============================================================================
// Yield routing — adapters for Kamino, JLP, Maple, Delora (Phase D)
// ============================================================================
pub mod route_yield_deposit;
pub mod route_yield_withdraw;

// ============================================================================
// Adapter registry — whitelist of yield adapter programs (Sprint A)
// ============================================================================
pub mod initialize_adapter_registry;
pub mod whitelist_adapter;
pub mod pause_adapter;

// Re-exports for lib.rs
pub use initialize_personal_vault::*;
pub use setup_vault_pool::*;
pub use deposit::*;
pub use withdraw::*;
pub use crank_nav::*;

pub use initialize_group_vault::*;
pub use join_group_vault::*;
pub use group_deposit::*;
pub use group_withdraw::*;
pub use leave_group_vault::*;

pub use create_rule::*;
pub use execute_rule::*;
pub use cancel_rule::*;

pub use route_yield_deposit::*;
pub use route_yield_withdraw::*;

pub use initialize_adapter_registry::*;
pub use whitelist_adapter::*;
pub use pause_adapter::*;
