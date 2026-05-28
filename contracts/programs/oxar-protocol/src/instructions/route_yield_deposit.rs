use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{Vault, YieldSource};

/// Route `amount` USDC from the vault's hot pool into its cold yield source.
///
/// Phase D scope:
/// - `Idle`: bookkeeping-only (USDC stays in the same pool ATA, but accounting moves
///   from `hot_pool_balance` to `cold_capital`). This is the MVP default and is
///   used by every personal vault until an external adapter is wired up.
/// - `KaminoUsdc` / `JupiterLp` / `MapleSolana` / `DeloraCrossChain`: stubs that
///   return `NotImplemented`. They will be wired via CPI in subsequent phases
///   without breaking the existing instruction signature.
///
/// Signer must equal `vault.authority` — i.e. the personal vault owner. Group
/// vaults route via their own `group_*` instructions; this path is personal-only
/// for now.
#[derive(Accounts)]
pub struct RouteYieldDeposit<'info> {
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [
            VAULT_SEED,
            vault.authority.as_ref(),
            &vault.vault_id.to_le_bytes(),
        ],
        bump = vault.bump,
        constraint = vault.is_active @ OxarError::VaultNotActive,
        constraint = vault.authority == signer.key() @ OxarError::Unauthorized,
    )]
    pub vault: Account<'info, Vault>,
}

pub fn handler(ctx: Context<RouteYieldDeposit>, amount: u64) -> Result<()> {
    require!(amount > 0, OxarError::ZeroDeposit);

    let vault = &mut ctx.accounts.vault;
    require!(amount <= vault.hot_pool_balance, OxarError::InsufficientFunds);

    match vault.yield_source {
        YieldSource::Idle => {
            vault.hot_pool_balance = vault
                .hot_pool_balance
                .checked_sub(amount)
                .ok_or(OxarError::MathOverflow)?;
            vault.cold_capital = vault
                .cold_capital
                .checked_add(amount)
                .ok_or(OxarError::MathOverflow)?;

            msg!(
                "Idle route: {} USDC hot->cold for vault {}",
                amount,
                vault.key()
            );
            Ok(())
        }
        YieldSource::KaminoUsdc { .. }
        | YieldSource::JupiterLp { .. }
        | YieldSource::MapleSolana { .. }
        | YieldSource::MarginFiUsdc { .. }
        | YieldSource::DriftInsurance { .. }
        | YieldSource::DeloraCrossChain { .. } => {
            // External adapter CPIs land here in future phases. Each variant
            // will require its own remaining_accounts schema and dispatcher.
            Err(error!(OxarError::NotImplemented))
        }
    }
}
