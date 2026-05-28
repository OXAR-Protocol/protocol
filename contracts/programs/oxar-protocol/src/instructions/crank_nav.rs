use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::OxarError;
use crate::state::Vault;

/// Update vault NAV by reading underlying yield source value.
///
/// Permissionless: anyone can crank. Behavior depends on the routed adapter:
/// - Idle (adapter_program == Pubkey::default()): NAV stays at last value
/// - Delegated adapter: CPI to adapter_current_value (wired in Sprint A · Task 7)
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
    require!(
        ctx.accounts.vault.protocol_version == PROTOCOL_VERSION,
        OxarError::ProtocolVersionMismatch
    );

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

    if vault.adapter_program == Pubkey::default() {
        // No yield by design — NAV stays unchanged.
    } else {
        // Adapter NAV update lands in Sprint A · Task 7
        msg!("Adapter NAV update not yet implemented — NAV unchanged");
    }

    vault.last_update_ts = clock.unix_timestamp;
    msg!("NAV cranked: {} (elapsed {}s)", vault.nav_per_share, elapsed);
    Ok(())
}
