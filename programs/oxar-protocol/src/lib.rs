pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("8kwBnCQJf8WMgA1C1NiADbd3yGbP7TTmzRNZ8B3N1pmr");

#[program]
pub mod oxar_protocol {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>, params: InitializeVaultParams) -> Result<()> {
        instructions::initialize_vault::handler(ctx, params)
    }

    pub fn setup_vault_pool(ctx: Context<SetupVaultPool>) -> Result<()> {
        instructions::initialize_vault::setup_vault_pool_handler(ctx)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount)
    }

    pub fn crank_nav(ctx: Context<CrankNav>) -> Result<()> {
        instructions::crank_nav::handler(ctx)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        instructions::claim::handler(ctx)
    }

    pub fn create_listing(ctx: Context<CreateListing>, amount: u64, price_per_token: u64) -> Result<()> {
        instructions::create_listing::handler(ctx, amount, price_per_token)
    }

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        instructions::cancel_listing::handler(ctx)
    }

    pub fn buy_listing(ctx: Context<BuyListing>) -> Result<()> {
        instructions::buy_listing::handler(ctx)
    }
}
