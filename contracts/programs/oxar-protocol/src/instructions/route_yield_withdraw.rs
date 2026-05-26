use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{Vault, YieldSource};

/// Pull `amount` USDC from the vault's cold yield source back into its hot pool.
///
/// Mirror of `route_yield_deposit`. For `Idle` this is pure bookkeeping; for
/// external adapters this will redeem the underlying position via CPI and
/// transfer USDC back into the pool ATA.
#[derive(Accounts)]
pub struct RouteYieldWithdraw<'info> {
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

pub fn handler(ctx: Context<RouteYieldWithdraw>, amount: u64) -> Result<()> {
    require!(amount > 0, OxarError::ZeroWithdrawal);

    let vault = &mut ctx.accounts.vault;
    require!(amount <= vault.cold_capital, OxarError::InsufficientFunds);

    match vault.yield_source {
        YieldSource::Idle => {
            vault.cold_capital = vault
                .cold_capital
                .checked_sub(amount)
                .ok_or(OxarError::MathOverflow)?;
            vault.hot_pool_balance = vault
                .hot_pool_balance
                .checked_add(amount)
                .ok_or(OxarError::MathOverflow)?;

            msg!(
                "Idle unroute: {} USDC cold->hot for vault {}",
                amount,
                vault.key()
            );
            Ok(())
        }
        YieldSource::KaminoUsdc { .. }
        | YieldSource::JupiterLp { .. }
        | YieldSource::MapleSolana { .. }
        | YieldSource::DeloraCrossChain { .. } => {
            Err(error!(OxarError::NotImplemented))
        }
    }
}
