use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::OxarError;
use crate::state::Vault;

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
    require!(
        ctx.accounts.vault.protocol_version == PROTOCOL_VERSION,
        OxarError::ProtocolVersionMismatch
    );

    require!(amount > 0, OxarError::ZeroWithdrawal);

    let vault = &mut ctx.accounts.vault;
    require!(amount <= vault.cold_capital, OxarError::InsufficientFunds);

    if vault.adapter_program == Pubkey::default() {
        // Idle path: bookkeeping only
        vault.cold_capital = vault
            .cold_capital
            .checked_sub(amount)
            .ok_or(OxarError::MathOverflow)?;
        vault.hot_pool_balance = vault
            .hot_pool_balance
            .checked_add(amount)
            .ok_or(OxarError::MathOverflow)?;
        msg!("Idle unroute: {} USDC bookkeeping cold->hot", amount);
        Ok(())
    } else {
        // Adapter dispatch lands in Sprint A · Task 5
        Err(error!(OxarError::NotImplemented))
    }
}
