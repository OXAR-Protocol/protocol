use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke_signed,
};

use crate::constants::VAULT_SEED;

// ============================================================================
// Anchor discriminators for adapter instructions
// sha256("global:<name>")[..8]
// ============================================================================

/// discriminator for `adapter_deposit`
pub const ADAPTER_DEPOSIT_DISCRIMINATOR: [u8; 8] = [11, 175, 18, 26, 16, 219, 7, 124];
/// discriminator for `adapter_withdraw`
pub const ADAPTER_WITHDRAW_DISCRIMINATOR: [u8; 8] = [4, 39, 175, 195, 230, 220, 246, 215];
/// discriminator for `adapter_current_value`
pub const ADAPTER_CURRENT_VALUE_DISCRIMINATOR: [u8; 8] = [167, 86, 217, 173, 96, 53, 21, 7];

// ============================================================================
// Instruction data builders (Borsh layout: discriminator + args)
// ============================================================================

/// `adapter_deposit`: discriminator + amount (LE u64) + adapter_data (Vec<u8>)
pub fn encode_deposit_args(amount: u64, adapter_data: &[u8]) -> Vec<u8> {
    let mut buf = Vec::with_capacity(8 + 8 + 4 + adapter_data.len());
    buf.extend_from_slice(&ADAPTER_DEPOSIT_DISCRIMINATOR);
    buf.extend_from_slice(&amount.to_le_bytes());
    // Vec<u8> in Borsh: u32 length prefix + bytes
    buf.extend_from_slice(&(adapter_data.len() as u32).to_le_bytes());
    buf.extend_from_slice(adapter_data);
    buf
}

/// `adapter_withdraw`: discriminator + shares (LE u64) + adapter_data (Vec<u8>)
pub fn encode_withdraw_args(shares: u64, adapter_data: &[u8]) -> Vec<u8> {
    let mut buf = Vec::with_capacity(8 + 8 + 4 + adapter_data.len());
    buf.extend_from_slice(&ADAPTER_WITHDRAW_DISCRIMINATOR);
    buf.extend_from_slice(&shares.to_le_bytes());
    buf.extend_from_slice(&(adapter_data.len() as u32).to_le_bytes());
    buf.extend_from_slice(adapter_data);
    buf
}

/// `adapter_current_value`: discriminator + adapter_data (Vec<u8>)
pub fn encode_current_value_args(adapter_data: &[u8]) -> Vec<u8> {
    let mut buf = Vec::with_capacity(8 + 4 + adapter_data.len());
    buf.extend_from_slice(&ADAPTER_CURRENT_VALUE_DISCRIMINATOR);
    buf.extend_from_slice(&(adapter_data.len() as u32).to_le_bytes());
    buf.extend_from_slice(adapter_data);
    buf
}

// ============================================================================
// Signer seeds helper
// ============================================================================

/// Build vault PDA signer seeds slice from authority + vault_id_le + bump.
/// Returns a fixed-length array of byte slices — caller passes `&[&seeds[..]]`
/// to `invoke_signed`.
pub fn vault_signer_seeds<'a>(
    authority: &'a [u8],
    vault_id_le: &'a [u8],
    bump: &'a [u8],
) -> [&'a [u8]; 4] {
    [VAULT_SEED, authority, vault_id_le, bump]
}

// ============================================================================
// CPI dispatch
// ============================================================================

/// Issue a signed CPI to an adapter's `adapter_deposit` instruction.
///
/// The vault PDA is the CPI signer — it signs with its own seeds so the
/// adapter can verify the call originates from a legitimate OXAR vault.
pub fn cpi_adapter_deposit<'info>(
    adapter_program: &AccountInfo<'info>,
    instructions_sysvar: &AccountInfo<'info>,
    vault: &AccountInfo<'info>,
    vault_usdc_pool: &AccountInfo<'info>,
    adapter_state: &AccountInfo<'info>,
    remaining_accounts: &[AccountInfo<'info>],
    amount: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    let dispatcher_program_id = crate::ID;

    // Positional account layout (matches adapter-standard-v1.md §adapter_deposit):
    // 0: dispatcher_program (read-only)
    // 1: instructions_sysvar (read-only)
    // 2: vault (writable, signer — PDA)
    // 3: vault_usdc_pool (writable)
    // 4: adapter_state (writable)
    // 5+: remaining_accounts (pass-through)
    let mut metas = vec![
        AccountMeta::new_readonly(dispatcher_program_id, false),
        AccountMeta::new_readonly(instructions_sysvar.key(), false),
        AccountMeta::new(vault.key(), true),
        AccountMeta::new(vault_usdc_pool.key(), false),
        AccountMeta::new(adapter_state.key(), false),
    ];
    let mut infos = vec![
        // adapter_program itself is the program being invoked; Solana adds it
        // automatically — but we still need it in account_infos for invoke_signed.
        adapter_program.clone(),
        instructions_sysvar.clone(),
        vault.clone(),
        vault_usdc_pool.clone(),
        adapter_state.clone(),
    ];

    for acc in remaining_accounts {
        metas.push(AccountMeta {
            pubkey: acc.key(),
            is_signer: acc.is_signer,
            is_writable: acc.is_writable,
        });
        infos.push(acc.clone());
    }

    let ix = Instruction {
        program_id: adapter_program.key(),
        accounts: metas,
        data: encode_deposit_args(amount, &[]),
    };

    invoke_signed(&ix, &infos, signer_seeds)
        .map_err(|e| {
            msg!("Adapter CPI (deposit) failed: {:?}", e);
            error!(crate::error::OxarError::NotImplemented)
        })?;

    Ok(())
}
