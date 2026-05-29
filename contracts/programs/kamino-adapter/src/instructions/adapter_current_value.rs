use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::set_return_data, sysvar};

use crate::constants::*;
use crate::error::AdapterError;
use crate::events::AdapterValueEvent;
use crate::instructions::verify_caller_is_dispatcher;
use crate::klend_cpi;
use crate::state::AdapterState;

/// Return the current USDC value of this vault's Kamino holdings.
///
/// Refreshes the reserve (so accrued interest is reflected), computes
/// `total_shares × exchange_rate`, writes the u64 via `set_return_data` for the
/// dispatcher's `crank_nav`, and emits `AdapterValueEvent` for off-chain monitors.
/// Returns ONLY the adapter's holdings (the dispatcher adds the hot pool).
///
/// Account layout (adapter-standard-v1.md §adapter_current_value):
/// 0 dispatcher_program, 1 instructions_sysvar, 2 vault, 3 adapter_state,
/// 4 reserve, 5 lending_market, 6 scope_prices, 7 klend_program.
#[derive(Accounts)]
pub struct AdapterCurrentValue<'info> {
    /// CHECK: OXAR dispatcher program id; identity verified via sysvar in handler.
    pub dispatcher_program: AccountInfo<'info>,

    /// CHECK: instructions sysvar — address enforced; used for caller verification.
    #[account(address = sysvar::instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,

    /// CHECK: OXAR vault PDA. Validated against adapter_state.vault.
    pub vault: AccountInfo<'info>,

    #[account(
        seeds = [ADAPTER_STATE_SEED, crate::ID.as_ref(), vault.key().as_ref()],
        bump = adapter_state.bump,
        has_one = vault @ AdapterError::Unauthorized,
    )]
    pub adapter_state: Account<'info, AdapterState>,

    /// CHECK: klend reserve; refreshed then parsed. Validated == adapter_state.kamino_reserve.
    #[account(
        mut,
        address = adapter_state.kamino_reserve @ AdapterError::Unauthorized,
    )]
    pub reserve: AccountInfo<'info>,

    /// CHECK: klend lending market; validated by klend during refresh CPI.
    pub lending_market: AccountInfo<'info>,
    /// CHECK: Scope price feed for the reserve (refresh_reserve).
    pub scope_prices: AccountInfo<'info>,
    /// CHECK: klend program — CPI target; validated as the owner of `reserve`.
    #[account(
        executable,
        constraint = reserve.owner == klend_program.key @ AdapterError::Unauthorized,
    )]
    pub klend_program: AccountInfo<'info>,
}

pub fn handler<'info>(
    ctx: Context<'_, '_, '_, 'info, AdapterCurrentValue<'info>>,
    adapter_data: Vec<u8>,
) -> Result<()> {
    require!(
        adapter_data.len() <= MAX_ADAPTER_DATA_LEN,
        AdapterError::AdapterDataTooLarge
    );
    verify_caller_is_dispatcher(&ctx.accounts.instructions_sysvar)?;

    // Refresh so accrued interest is reflected in the reserve's borrowed amount.
    klend_cpi::refresh_reserve(
        &ctx.accounts.klend_program,
        &ctx.accounts.reserve,
        &ctx.accounts.lending_market,
        &ctx.accounts.scope_prices,
    )?;

    let shares = ctx.accounts.adapter_state.total_shares;
    let value = {
        let data = ctx.accounts.reserve.try_borrow_data()?;
        klend_cpi::collateral_value_usdc(&data, shares)?
    };

    set_return_data(&value.to_le_bytes());

    let clock = Clock::get()?;
    emit!(AdapterValueEvent {
        vault: ctx.accounts.adapter_state.vault,
        current_value_usdc: value,
        as_of_slot: clock.slot,
    });
    msg!("kamino value: {} cTokens = {} USDC", shares, value);
    Ok(())
}
