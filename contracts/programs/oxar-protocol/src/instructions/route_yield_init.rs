use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke_signed,
    sysvar,
};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{AdapterEntry, AdapterRegistry, Vault};

/// Initialize the adapter-owned state for this vault's yield adapter, by
/// dispatching `adapter_initialize` to the whitelisted adapter program.
///
/// MUST be called once after the vault is created (with a non-Idle
/// `adapter_program`) and before the first `route_yield_deposit`. The vault PDA
/// signs the CPI so the adapter can attribute its state to a legitimate vault.
///
/// Adapter-specific accounts (reserve, collateral mint, collateral ATA, token
/// programs, …) are forwarded verbatim via `remaining_accounts` as CPI slots 6+.
#[derive(Accounts)]
pub struct RouteYieldInit<'info> {
    #[account(mut)]
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

    /// Adapter registry — seeds enforce this is the canonical registry.
    #[account(seeds = [REGISTRY_SEED], bump = registry.bump)]
    pub registry: Account<'info, AdapterRegistry>,

    /// Per-adapter entry — PDA-gated on vault.adapter_program.
    #[account(
        seeds = [ADAPTER_ENTRY_SEED, vault.adapter_program.as_ref()],
        bump = adapter_entry.bump,
    )]
    pub adapter_entry: Account<'info, AdapterEntry>,

    /// CHECK: key validated against vault.adapter_program; PDA-gated via adapter_entry.
    pub adapter_program: AccountInfo<'info>,

    /// Adapter-owned state PDA, created by the adapter during the CPI.
    ///
    /// CHECK: adapter owns and initializes; seeds/space enforced adapter-side.
    #[account(mut)]
    pub adapter_state: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: address enforced; forwarded to the adapter for caller verification.
    #[account(address = sysvar::instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,
}

pub fn handler<'info>(
    ctx: Context<'_, '_, '_, 'info, RouteYieldInit<'info>>,
    adapter_data: Vec<u8>,
) -> Result<()> {
    require!(
        ctx.accounts.vault.protocol_version == PROTOCOL_VERSION,
        OxarError::ProtocolVersionMismatch
    );
    require!(adapter_data.len() <= 256, OxarError::AdapterDataTooLarge);
    // Idle vaults have no adapter state to initialize.
    require!(
        ctx.accounts.vault.adapter_program != Pubkey::default(),
        OxarError::InvalidVaultState
    );

    let entry = &ctx.accounts.adapter_entry;
    require!(
        entry.adapter_program == ctx.accounts.vault.adapter_program,
        OxarError::Unauthorized
    );
    require!(entry.is_active, OxarError::VaultNotActive);
    require!(
        entry.interface_version == ADAPTER_INTERFACE_VERSION,
        OxarError::UnsupportedInterfaceVersion
    );
    require!(
        ctx.accounts.adapter_program.key() == ctx.accounts.vault.adapter_program,
        OxarError::Unauthorized
    );

    // Snapshot for vault PDA signer seeds.
    let authority_key = ctx.accounts.vault.authority;
    let vault_id_val = ctx.accounts.vault.vault_id;
    let bump_val = ctx.accounts.vault.bump;

    let adapter_program_info = ctx.accounts.adapter_program.clone();
    let instructions_sysvar_info = ctx.accounts.instructions_sysvar.clone();
    let vault_account_info = ctx.accounts.vault.to_account_info();
    let rent_payer_info = ctx.accounts.signer.to_account_info();
    let adapter_state_info = ctx.accounts.adapter_state.clone();
    let system_program_info = ctx.accounts.system_program.to_account_info();
    let remaining: Vec<AccountInfo> = ctx.remaining_accounts.to_vec();

    let vault_id_bytes = vault_id_val.to_le_bytes();
    let bump_byte = [bump_val];
    let seeds =
        crate::cpi_adapter::vault_signer_seeds(authority_key.as_ref(), &vault_id_bytes, &bump_byte);
    let signer_seeds = &[&seeds[..]];

    // CPI account layout (adapter-standard-v1.md §adapter_initialize):
    // 1 vault (signer, via invoke_signed), 3 adapter_state (writable, init),
    // 3 rent_payer (writable, signer), 5 system_program (ro),
    // 6+ remaining_accounts (adapter-specific).
    let mut metas = vec![
        AccountMeta::new_readonly(instructions_sysvar_info.key(), false),
        AccountMeta::new_readonly(vault_account_info.key(), true),
        AccountMeta::new(adapter_state_info.key(), false),
        AccountMeta::new(rent_payer_info.key(), true),
        AccountMeta::new_readonly(system_program_info.key(), false),
    ];
    let mut infos = vec![
        adapter_program_info.clone(),
        instructions_sysvar_info,
        vault_account_info,
        adapter_state_info,
        rent_payer_info,
        system_program_info,
    ];
    for acc in &remaining {
        metas.push(AccountMeta {
            pubkey: acc.key(),
            is_signer: acc.is_signer,
            is_writable: acc.is_writable,
        });
        infos.push(acc.clone());
    }

    let ix = Instruction {
        program_id: adapter_program_info.key(),
        accounts: metas,
        data: crate::cpi_adapter::encode_initialize_args(&adapter_data),
    };

    invoke_signed(&ix, &infos, signer_seeds).map_err(|e| {
        msg!("Adapter CPI (initialize) failed: {:?}", e);
        error!(OxarError::NotImplemented)
    })?;

    msg!(
        "Adapter state initialized for vault via {:?}",
        ctx.accounts.vault.adapter_program
    );
    Ok(())
}
