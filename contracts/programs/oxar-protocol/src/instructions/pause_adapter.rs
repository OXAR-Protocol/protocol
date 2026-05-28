use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{AdapterEntry, AdapterRegistry};

#[derive(Accounts)]
pub struct PauseAdapter<'info> {
    pub admin: Signer<'info>,

    #[account(
        seeds = [REGISTRY_SEED],
        bump = registry.bump,
        constraint = registry.admin == admin.key() @ OxarError::Unauthorized,
    )]
    pub registry: Account<'info, AdapterRegistry>,

    #[account(
        mut,
        seeds = [ADAPTER_ENTRY_SEED, adapter_entry.adapter_program.as_ref()],
        bump = adapter_entry.bump,
    )]
    pub adapter_entry: Account<'info, AdapterEntry>,
}

pub fn handler(ctx: Context<PauseAdapter>, active: bool) -> Result<()> {
    let entry = &mut ctx.accounts.adapter_entry;
    entry.is_active = active;
    msg!(
        "Adapter {} ({}) is_active={}",
        entry.name,
        entry.adapter_program,
        entry.is_active
    );
    Ok(())
}
