pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("8RCVjQJhfcRYVpAM8v4jhvvbhjfkdqFwPtffEKNcBQwJ");

#[program]
pub mod oxar_protocol {
    use super::*;

    // ========================================================================
    // Personal vault — single-user yield positions
    // ========================================================================

    pub fn initialize_personal_vault(
        ctx: Context<InitializePersonalVault>,
        params: InitializePersonalVaultParams,
    ) -> Result<()> {
        instructions::initialize_personal_vault::handler(ctx, params)
    }

    pub fn setup_vault_pool(ctx: Context<SetupVaultPool>) -> Result<()> {
        instructions::setup_vault_pool::handler(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, shares: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, shares)
    }

    pub fn crank_nav(ctx: Context<CrankNav>) -> Result<()> {
        instructions::crank_nav::handler(ctx)
    }

    // ========================================================================
    // Group vault — shared savings (Phase B)
    // ========================================================================

    pub fn initialize_group_vault(
        ctx: Context<InitializeGroupVault>,
        params: InitializeGroupVaultParams,
    ) -> Result<()> {
        instructions::initialize_group_vault::handler(ctx, params)
    }

    pub fn join_group_vault(
        ctx: Context<JoinGroupVault>,
        params: JoinGroupVaultParams,
    ) -> Result<()> {
        instructions::join_group_vault::handler(ctx, params)
    }

    pub fn group_deposit(ctx: Context<GroupDeposit>, amount: u64) -> Result<()> {
        instructions::group_deposit::handler(ctx, amount)
    }

    pub fn group_withdraw(ctx: Context<GroupWithdraw>, shares: u64) -> Result<()> {
        instructions::group_withdraw::handler(ctx, shares)
    }

    pub fn leave_group_vault(ctx: Context<LeaveGroupVault>) -> Result<()> {
        instructions::leave_group_vault::handler(ctx)
    }

    // ========================================================================
    // Rules engine (Phase C)
    // ========================================================================

    pub fn create_rule(ctx: Context<CreateRule>, params: CreateRuleParams) -> Result<()> {
        instructions::create_rule::handler(ctx, params)
    }

    pub fn execute_rule(ctx: Context<ExecuteRule>, params: ExecuteRuleParams) -> Result<()> {
        instructions::execute_rule::handler(ctx, params)
    }

    pub fn cancel_rule(ctx: Context<CancelRule>) -> Result<()> {
        instructions::cancel_rule::handler(ctx)
    }

    // ========================================================================
    // Yield routing (Phase D)
    // ========================================================================

    pub fn route_yield_deposit(
        ctx: Context<RouteYieldDeposit>,
        amount: u64,
    ) -> Result<()> {
        instructions::route_yield_deposit::handler(ctx, amount)
    }

    pub fn route_yield_withdraw(
        ctx: Context<RouteYieldWithdraw>,
        amount: u64,
    ) -> Result<()> {
        instructions::route_yield_withdraw::handler(ctx, amount)
    }

    // ========================================================================
    // Adapter registry (Sprint A — yield adapter standard)
    // ========================================================================

    pub fn initialize_adapter_registry(ctx: Context<InitializeAdapterRegistry>) -> Result<()> {
        instructions::initialize_adapter_registry::handler(ctx)
    }

    pub fn whitelist_adapter(
        ctx: Context<WhitelistAdapter>,
        name: String,
        interface_version: u8,
    ) -> Result<()> {
        instructions::whitelist_adapter::handler(ctx, name, interface_version)
    }

    pub fn pause_adapter(ctx: Context<PauseAdapter>, paused: bool) -> Result<()> {
        instructions::pause_adapter::handler(ctx, paused)
    }
}
