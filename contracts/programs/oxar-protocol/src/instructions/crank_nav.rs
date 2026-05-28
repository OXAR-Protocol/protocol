use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{Vault, YieldSource};

/// Update vault NAV by reading underlying yield source value.
///
/// Permissionless: anyone can crank. NAV growth depends on yield source:
/// - Idle: no growth (NAV stays at last value)
/// - KaminoUsdc / JupiterLp / MapleSolana / DeloraCrossChain: queries adapter (Phase D)
///
/// In Phase A this is a no-op for all sources except Idle. Adapter integration
/// lands in Phase D when CPI wrappers are wired.
#[derive(Accounts)]
pub struct CrankNav<'info> {
    pub cranker: Signer<'info>,

    #[account(
        mut,
        seeds = [
            VAULT_SEED,
            vault.authority.as_ref(),
            &vault.vault_id.to_le_bytes(),
        ],
        bump = vault.bump,
        constraint = vault.is_active @ OxarError::VaultNotActive,
    )]
    pub vault: Account<'info, Vault>,
}

pub fn handler(ctx: Context<CrankNav>) -> Result<()> {
    let clock = Clock::get()?;
    let vault = &mut ctx.accounts.vault;

    let elapsed = clock
        .unix_timestamp
        .checked_sub(vault.last_update_ts)
        .ok_or(OxarError::MathOverflow)?;

    if elapsed <= 0 {
        msg!("No time elapsed, skipping NAV update");
        return Ok(());
    }

    match vault.yield_source {
        YieldSource::Idle => {
            // No yield by design — NAV stays unchanged.
        }
        YieldSource::KaminoUsdc { .. }
        | YieldSource::JupiterLp { .. }
        | YieldSource::MapleSolana { .. }
        | YieldSource::MarginFiUsdc { .. }
        | YieldSource::DriftInsurance { .. }
        | YieldSource::DeloraCrossChain { .. } => {
            // Phase D: read adapter, compute new total_value, derive nav_per_share.
            // For now, no-op until adapter CPIs are wired.
            msg!("Yield source adapter not yet implemented — NAV unchanged");
        }
    }

    vault.last_update_ts = clock.unix_timestamp;
    msg!("NAV cranked: {} (elapsed {}s)", vault.nav_per_share, elapsed);
    Ok(())
}
