use anchor_lang::prelude::*;

use crate::constants::*;
use crate::state::AdapterRegistry;

#[derive(Accounts)]
pub struct InitializeAdapterRegistry<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + AdapterRegistry::INIT_SPACE,
        seeds = [REGISTRY_SEED],
        bump,
    )]
    pub registry: Account<'info, AdapterRegistry>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeAdapterRegistry>) -> Result<()> {
    let registry = &mut ctx.accounts.registry;
    registry.admin = ctx.accounts.admin.key();
    registry.adapter_count = 0;
    registry.bump = ctx.bumps.registry;
    msg!("Adapter registry initialized by {}", registry.admin);
    Ok(())
}
