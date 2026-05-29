use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke_signed,
    sysvar,
};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{AdapterEntry, AdapterRegistry, Vault};

/// Route `amount` USDC from the vault's hot pool into its cold yield source.
///
/// Behavior depends on the vault's adapter:
/// - Idle (adapter_program == Pubkey::default()): bookkeeping-only — USDC stays in
///   the pool ATA but accounting moves from `hot_pool_balance` to `cold_capital`.
///   Adapter-specific accounts (registry … instructions_sysvar) are ignored.
/// - Delegated adapter: validates the registry entry and dispatches a CPI to the
///   whitelisted adapter program using the vault PDA as the CPI signer.
///
/// Signer must equal `vault.authority` — personal-vault owner only.
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

    // ------------------------------------------------------------------
    // Adapter-path accounts (required when vault.adapter_program != default)
    // Passed as Option so Idle vaults don't need them.
    // ------------------------------------------------------------------

    /// Adapter registry — read-only; seeds enforce this is the canonical registry.
    #[account(
        seeds = [REGISTRY_SEED],
        bump = registry.bump,
    )]
    pub registry: Option<Account<'info, AdapterRegistry>>,

    /// Per-adapter entry — seeds enforce it is keyed by vault.adapter_program.
    ///
    /// CHECK guard in handler: entry.adapter_program == vault.adapter_program.
    #[account(
        seeds = [ADAPTER_ENTRY_SEED, vault.adapter_program.as_ref()],
        bump = adapter_entry.bump,
    )]
    pub adapter_entry: Option<Account<'info, AdapterEntry>>,

    /// The actual adapter program to CPI into.
    ///
    /// CHECK: key validated against adapter_entry.adapter_program in handler;
    /// adapter_entry is PDA-gated on vault.adapter_program.
    pub adapter_program: Option<AccountInfo<'info>>,

    /// Vault USDC pool — source of funds forwarded to the adapter. Writable: the
    /// adapter (and klend, via CPI) debits USDC from it, so it must be mut here or
    /// the onward CPI's writable flag is an illegal privilege escalation.
    ///
    /// CHECK: validated by the adapter (verifies token account authority = vault PDA,
    /// mint = USDC).
    #[account(mut)]
    pub vault_usdc_pool: Option<AccountInfo<'info>>,

    /// Adapter-owned state PDA for this vault; writable so the adapter can update it.
    ///
    /// CHECK: adapter owns and validates; must be initialized via adapter_initialize
    /// before this instruction.
    #[account(mut)]
    pub adapter_state: Option<AccountInfo<'info>>,

    /// Instructions sysvar — forwarded to adapter for caller-verification.
    ///
    /// CHECK: address enforced by the constraint below.
    #[account(address = sysvar::instructions::ID)]
    pub instructions_sysvar: Option<AccountInfo<'info>>,
}

pub fn handler<'info>(
    ctx: Context<'_, '_, '_, 'info, RouteYieldDeposit<'info>>,
    amount: u64,
    adapter_data: Vec<u8>,
) -> Result<()> {
    require!(
        ctx.accounts.vault.protocol_version == PROTOCOL_VERSION,
        OxarError::ProtocolVersionMismatch
    );
    require!(amount > 0, OxarError::ZeroDeposit);
    require!(
        adapter_data.len() <= 256,
        OxarError::AdapterDataTooLarge
    );
    require!(
        amount <= ctx.accounts.vault.hot_pool_balance,
        OxarError::InsufficientFunds
    );

    if ctx.accounts.vault.adapter_program == Pubkey::default() {
        // ----------------------------------------------------------------
        // Idle path: bookkeeping only — USDC stays in the pool ATA
        // ----------------------------------------------------------------
        let vault = &mut ctx.accounts.vault;
        vault.hot_pool_balance = vault
            .hot_pool_balance
            .checked_sub(amount)
            .ok_or(OxarError::MathOverflow)?;
        vault.cold_capital = vault
            .cold_capital
            .checked_add(amount)
            .ok_or(OxarError::MathOverflow)?;
        msg!("Idle route: {} USDC bookkeeping hot->cold", amount);
    } else {
        // ----------------------------------------------------------------
        // Delegated adapter path: validate registry entry then CPI
        // ----------------------------------------------------------------

        // Unpack required accounts — all must be present for non-Idle vaults
        let entry = ctx
            .accounts
            .adapter_entry
            .as_ref()
            .ok_or(OxarError::NotImplemented)?;
        let adapter_program_info = ctx
            .accounts
            .adapter_program
            .as_ref()
            .ok_or(OxarError::NotImplemented)?;
        let vault_usdc_pool_info = ctx
            .accounts
            .vault_usdc_pool
            .as_ref()
            .ok_or(OxarError::NotImplemented)?;
        let adapter_state_info = ctx
            .accounts
            .adapter_state
            .as_ref()
            .ok_or(OxarError::NotImplemented)?;
        let instructions_sysvar_info = ctx
            .accounts
            .instructions_sysvar
            .as_ref()
            .ok_or(OxarError::NotImplemented)?;

        // Defensive key checks — PDA seeds enforce these, but belt-and-suspenders
        require!(
            entry.adapter_program == ctx.accounts.vault.adapter_program,
            OxarError::Unauthorized
        );
        // Paused adapters cannot accept new deposits
        require!(entry.is_active, OxarError::VaultNotActive);
        // Dispatcher only calls adapters at the expected interface version
        require!(
            entry.interface_version == ADAPTER_INTERFACE_VERSION,
            OxarError::UnsupportedInterfaceVersion
        );
        // Verify the passed adapter_program AccountInfo key matches what the registry says
        require!(
            adapter_program_info.key() == ctx.accounts.vault.adapter_program,
            OxarError::Unauthorized
        );

        // Snapshot values needed for seeds + bookkeeping before any mutable borrow
        let authority_key = ctx.accounts.vault.authority;
        let vault_id_val = ctx.accounts.vault.vault_id;
        let bump_val = ctx.accounts.vault.bump;

        // Clone AccountInfos so we can take &mut ctx.accounts.vault later
        let adapter_program_clone = adapter_program_info.clone();
        let instructions_sysvar_clone = instructions_sysvar_info.clone();
        let vault_account_info = ctx.accounts.vault.to_account_info();
        let vault_usdc_pool_clone = vault_usdc_pool_info.clone();
        let adapter_state_clone = adapter_state_info.clone();
        let remaining: Vec<AccountInfo> = ctx.remaining_accounts.to_vec();

        // Build vault PDA signer seeds
        let vault_id_bytes = vault_id_val.to_le_bytes();
        let bump_byte = [bump_val];
        let seeds = crate::cpi_adapter::vault_signer_seeds(
            authority_key.as_ref(),
            &vault_id_bytes,
            &bump_byte,
        );
        let signer_seeds = &[&seeds[..]];

        // Build CPI account list (positional layout from adapter-standard-v1.md §adapter_deposit):
        // 0: instructions_sysvar (read-only)
        // 1: vault (writable, signer — PDA)
        // 2: vault_usdc_pool (writable)
        // 3: adapter_state (writable)
        // 5+: remaining_accounts (pass-through to underlying protocol)
        let mut metas = vec![
            AccountMeta::new_readonly(instructions_sysvar_clone.key(), false),
            AccountMeta::new(vault_account_info.key(), true),
            AccountMeta::new(vault_usdc_pool_clone.key(), false),
            AccountMeta::new(adapter_state_clone.key(), false),
        ];
        let mut infos = vec![
            adapter_program_clone.clone(),
            instructions_sysvar_clone,
            vault_account_info,
            vault_usdc_pool_clone,
            adapter_state_clone,
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
            program_id: adapter_program_clone.key(),
            accounts: metas,
            data: crate::cpi_adapter::encode_deposit_args(amount, &adapter_data),
        };

        invoke_signed(&ix, &infos, signer_seeds).map_err(|e| {
            msg!("Adapter CPI (deposit) failed: {:?}", e);
            error!(OxarError::NotImplemented)
        })?;

        // Bookkeeping — dispatcher trusts adapter moved the USDC from vault_usdc_pool
        let vault = &mut ctx.accounts.vault;
        vault.hot_pool_balance = vault
            .hot_pool_balance
            .checked_sub(amount)
            .ok_or(OxarError::MathOverflow)?;
        vault.cold_capital = vault
            .cold_capital
            .checked_add(amount)
            .ok_or(OxarError::MathOverflow)?;
        msg!(
            "Adapter route: {} USDC dispatched to {:?}",
            amount,
            vault.adapter_program
        );
    }
    Ok(())
}
