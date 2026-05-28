use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{AdapterEntry, AdapterRegistry};

#[derive(Accounts)]
#[instruction(name: String, interface_version: u8)]
pub struct WhitelistAdapter<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [REGISTRY_SEED],
        bump = registry.bump,
        constraint = registry.admin == admin.key() @ OxarError::Unauthorized,
    )]
    pub registry: Account<'info, AdapterRegistry>,

    #[account(
        init,
        payer = admin,
        space = 8 + AdapterEntry::INIT_SPACE,
        seeds = [ADAPTER_ENTRY_SEED, adapter_program.key().as_ref()],
        bump,
    )]
    pub adapter_entry: Account<'info, AdapterEntry>,

    /// CHECK: adapter program; verified executable to catch fat-finger errors
    #[account(constraint = adapter_program.executable @ OxarError::InvalidAdapterProgram)]
    pub adapter_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<WhitelistAdapter>,
    name: String,
    interface_version: u8,
) -> Result<()> {
    require!(!name.is_empty() && name.len() <= 32, OxarError::InvalidAdapterName);
    require!(
        interface_version == ADAPTER_INTERFACE_VERSION,
        OxarError::UnsupportedInterfaceVersion
    );
    require!(
        ctx.accounts.registry.adapter_count < MAX_ADAPTERS,
        OxarError::RegistryFull
    );

    let clock = Clock::get()?;
    let entry = &mut ctx.accounts.adapter_entry;
    entry.adapter_program = ctx.accounts.adapter_program.key();
    entry.interface_version = interface_version;
    entry.name = name;
    entry.is_active = true;
    entry.added_at = clock.unix_timestamp;
    entry.bump = ctx.bumps.adapter_entry;

    let registry = &mut ctx.accounts.registry;
    registry.adapter_count = registry
        .adapter_count
        .checked_add(1)
        .ok_or(OxarError::MathOverflow)?;

    msg!(
        "Adapter whitelisted: {} ({}), interface v{}",
        entry.name,
        entry.adapter_program,
        entry.interface_version
    );
    Ok(())
}
