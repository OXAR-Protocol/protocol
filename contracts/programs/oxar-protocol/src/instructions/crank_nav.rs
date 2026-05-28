use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke,
    program::get_return_data,
    sysvar,
};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{AdapterEntry, AdapterRegistry, Vault};

/// Update vault NAV by reading underlying yield source value.
///
/// Permissionless: anyone can crank. Behavior depends on the routed adapter:
/// - Idle (adapter_program == Pubkey::default()): NAV stays at last value.
/// - Delegated adapter: CPI to adapter_current_value; adapter MUST call
///   set_return_data(value_usdc.to_le_bytes()) so the dispatcher can read
///   the u64 via get_return_data() and update vault.nav_per_share.
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

    /// Adapter-owned state PDA for this vault; read-only for current_value query.
    ///
    /// CHECK: adapter owns and validates; must be initialized via adapter_initialize
    /// before crank_nav can use it.
    pub adapter_state: Option<AccountInfo<'info>>,

    /// Instructions sysvar — forwarded to adapter for caller-verification.
    ///
    /// CHECK: address enforced by the constraint below.
    #[account(address = sysvar::instructions::ID)]
    pub instructions_sysvar: Option<AccountInfo<'info>>,
}

pub fn handler<'info>(
    ctx: Context<'_, '_, '_, 'info, CrankNav<'info>>,
    adapter_data: Vec<u8>,
) -> Result<()> {
    require!(
        adapter_data.len() <= 256,
        OxarError::AdapterDataTooLarge
    );
    require!(
        ctx.accounts.vault.protocol_version == PROTOCOL_VERSION,
        OxarError::ProtocolVersionMismatch
    );

    let clock = Clock::get()?;
    let elapsed = clock
        .unix_timestamp
        .checked_sub(ctx.accounts.vault.last_update_ts)
        .ok_or(OxarError::MathOverflow)?;

    if elapsed <= 0 {
        msg!("No time elapsed, skipping NAV update");
        return Ok(());
    }

    if ctx.accounts.vault.adapter_program == Pubkey::default() {
        // Idle path — no yield source; NAV stays unchanged.
    } else {
        // ----------------------------------------------------------------
        // Delegated adapter path: CPI to adapter_current_value, read
        // return data to update nav_per_share.
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
        // Paused adapters cannot be queried for NAV
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

        // Clone AccountInfos before the mutable vault borrow
        let adapter_program_clone = adapter_program_info.clone();
        let instructions_sysvar_clone = instructions_sysvar_info.clone();
        let vault_account_info = ctx.accounts.vault.to_account_info();
        let adapter_state_clone = adapter_state_info.clone();
        let remaining: Vec<AccountInfo> = ctx.remaining_accounts.to_vec();

        // Build CPI account list (positional layout from adapter-standard-v1.md §adapter_current_value):
        // 0: dispatcher_program (read-only)
        // 1: instructions_sysvar (read-only)
        // 2: vault (read-only — current_value is a query, not a mutation)
        // 3: adapter_state (read-only)
        // 4+: remaining_accounts (oracle accounts, reserve state, etc.)
        let mut metas = vec![
            AccountMeta::new_readonly(crate::ID, false),
            AccountMeta::new_readonly(instructions_sysvar_clone.key(), false),
            AccountMeta::new_readonly(vault_account_info.key(), false),
            AccountMeta::new_readonly(adapter_state_clone.key(), false),
        ];
        let mut infos = vec![
            adapter_program_clone.clone(),
            instructions_sysvar_clone,
            vault_account_info,
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
            data: crate::cpi_adapter::encode_current_value_args(&adapter_data),
        };

        invoke(&ix, &infos).map_err(|e| {
            msg!("Adapter CPI (current_value) failed: {:?}", e);
            error!(OxarError::NotImplemented)
        })?;

        // Read return data written by adapter via set_return_data(value.to_le_bytes()).
        // Adapter MUST set return data; if absent we treat it as an implementation error.
        let (return_program, return_bytes) =
            get_return_data().ok_or(error!(OxarError::NotImplemented))?;
        require_keys_eq!(return_program, adapter_program_clone.key());
        require!(return_bytes.len() >= 8, OxarError::MathOverflow);

        let current_value =
            u64::from_le_bytes(return_bytes[..8].try_into().unwrap());

        // total_value = hot_pool_balance + adapter current_value (cold capital)
        // nav_per_share = total_value * NAV_PRECISION / total_shares
        // Skip update if total_shares == 0 (no depositors yet).
        let vault = &mut ctx.accounts.vault;
        if vault.total_shares > 0 {
            let total_value = (vault.hot_pool_balance as u128)
                .checked_add(current_value as u128)
                .ok_or(OxarError::MathOverflow)?;
            let new_nav = total_value
                .checked_mul(NAV_PRECISION)
                .ok_or(OxarError::MathOverflow)?
                .checked_div(vault.total_shares as u128)
                .ok_or(OxarError::MathOverflow)?;
            vault.nav_per_share = new_nav
                .try_into()
                .map_err(|_| OxarError::MathOverflow)?;
            msg!(
                "NAV updated via adapter: hot_pool={} adapter_value={} total={} nav_per_share={}",
                vault.hot_pool_balance,
                current_value,
                total_value,
                vault.nav_per_share
            );
        } else {
            msg!(
                "Adapter current_value={} but total_shares=0; nav_per_share unchanged",
                current_value
            );
        }
    }

    let vault = &mut ctx.accounts.vault;
    vault.last_update_ts = clock.unix_timestamp;
    msg!("NAV cranked: {} (elapsed {}s)", vault.nav_per_share, elapsed);
    Ok(())
}
