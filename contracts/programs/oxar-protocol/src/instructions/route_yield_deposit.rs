use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::OxarError;
use crate::state::Vault;

/// Route `amount` USDC from the vault's hot pool into its cold yield source.
///
/// Behavior depends on the vault's adapter:
/// - Idle (adapter_program == Pubkey::default()): bookkeeping-only — USDC stays in
///   the pool ATA but accounting moves from `hot_pool_balance` to `cold_capital`.
///   This is the MVP default for every personal vault.
/// - Delegated adapter: CPI dispatch wired in Sprint A · Task 5. Returns
///   `NotImplemented` until then.
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
    require!(
        ctx.accounts.vault.protocol_version == PROTOCOL_VERSION,
        OxarError::ProtocolVersionMismatch
    );

    require!(amount > 0, OxarError::ZeroDeposit);

    let vault = &mut ctx.accounts.vault;
    require!(amount <= vault.hot_pool_balance, OxarError::InsufficientFunds);

    if vault.adapter_program == Pubkey::default() {
        // Idle path: bookkeeping only
        vault.hot_pool_balance = vault
            .hot_pool_balance
            .checked_sub(amount)
            .ok_or(OxarError::MathOverflow)?;
        vault.cold_capital = vault
            .cold_capital
            .checked_add(amount)
            .ok_or(OxarError::MathOverflow)?;
        msg!("Idle route: {} USDC bookkeeping hot->cold", amount);
        Ok(())
    } else {
        // Adapter dispatch lands in Sprint A · Task 5
        Err(error!(OxarError::NotImplemented))
    }
}
