use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod klend_cpi;
pub mod state;

pub use constants::*;
pub use events::*;
pub use instructions::*;
pub use state::*;

declare_id!("FhGXjrzLvpLUCTxbvN85isLpYoQG9TRnDWRTAaPdK2H9");

/// Reference OXAR yield adapter for Kamino Lend (klend) USDC reserve.
///
/// Implements the OXAR Yield Adapter Standard v1
/// (`docs/contracts/adapter-standard-v1.md`). The dispatcher (`oxar-protocol`)
/// CPIs into `adapter_deposit` / `adapter_withdraw` / `adapter_current_value`;
/// `adapter_initialize` is called directly to create the per-vault state PDA.
#[program]
pub mod kamino_adapter {
    use super::*;

    /// Create the per-vault `adapter_state` PDA. MUST be called before
    /// `adapter_deposit`. One state account per vault.
    pub fn adapter_initialize(
        ctx: Context<AdapterInitialize>,
        adapter_data: Vec<u8>,
    ) -> Result<()> {
        instructions::adapter_initialize::handler(ctx, adapter_data)
    }

    /// Pull `amount` USDC from the vault pool and deposit into the Kamino reserve.
    pub fn adapter_deposit<'info>(
        ctx: Context<'_, '_, '_, 'info, AdapterDeposit<'info>>,
        amount: u64,
        adapter_data: Vec<u8>,
    ) -> Result<()> {
        instructions::adapter_deposit::handler(ctx, amount, adapter_data)
    }

    /// Redeem `shares` of Kamino collateral back into USDC in the vault pool.
    pub fn adapter_withdraw<'info>(
        ctx: Context<'_, '_, '_, 'info, AdapterWithdraw<'info>>,
        shares: u64,
        adapter_data: Vec<u8>,
    ) -> Result<()> {
        instructions::adapter_withdraw::handler(ctx, shares, adapter_data)
    }

    /// Return current USDC value of this vault's Kamino holdings via
    /// `set_return_data` + event. Adapter returns ONLY its own holdings.
    pub fn adapter_current_value<'info>(
        ctx: Context<'_, '_, '_, 'info, AdapterCurrentValue<'info>>,
        adapter_data: Vec<u8>,
    ) -> Result<()> {
        instructions::adapter_current_value::handler(ctx, adapter_data)
    }
}
