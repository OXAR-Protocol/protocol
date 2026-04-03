use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::OxarError;
use crate::state::Vault;

#[derive(Accounts)]
pub struct CrankNav<'info> {
    #[account(mut)]
    pub cranker: Signer<'info>,

    #[account(
        mut,
        seeds = [VAULT_SEED, vault.region.as_bytes(), vault.denomination.as_bytes(), vault.asset_subtype.as_bytes()],
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

    require!(elapsed > 0, OxarError::NoTimeElapsed);

    // NAV accrual: nav_per_share += nav_per_share * apy_bps * elapsed / (BPS_DENOMINATOR * SECONDS_PER_YEAR)
    let seconds_per_year = DAYS_PER_YEAR
        .checked_mul(SECONDS_PER_DAY)
        .ok_or(OxarError::MathOverflow)?;

    let accrual = (vault.nav_per_share as u128)
        .checked_mul(vault.apy_bps as u128)
        .ok_or(OxarError::MathOverflow)?
        .checked_mul(elapsed as u128)
        .ok_or(OxarError::MathOverflow)?
        .checked_div(
            (BPS_DENOMINATOR as u128)
                .checked_mul(seconds_per_year as u128)
                .ok_or(OxarError::MathOverflow)?,
        )
        .ok_or(OxarError::MathOverflow)? as u64;

    vault.nav_per_share = vault
        .nav_per_share
        .checked_add(accrual)
        .ok_or(OxarError::MathOverflow)?;
    vault.last_update_ts = clock.unix_timestamp;

    // Deactivate if matured
    if clock.unix_timestamp >= vault.maturity_ts {
        vault.is_active = false;
    }

    msg!(
        "NAV updated to {} (accrual: {})",
        vault.nav_per_share,
        accrual
    );
    Ok(())
}
