use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar;
use anchor_spl::token::TokenAccount;

use crate::constants::*;
use crate::error::AdapterError;
use crate::events::AdapterWithdrawEvent;
use crate::instructions::verify_caller_is_dispatcher;
use crate::klend_cpi::{self, KlendAccounts};
use crate::state::AdapterState;

/// Redeem `shares` cTokens from the Kamino reserve back into USDC in the vault pool.
///
/// `shares` is denominated in the adapter's native cToken units (NOT USDC). The
/// caller (SDK) converts a USDC target into cTokens via the current exchange rate.
/// The dispatcher's hot/cold bookkeeping is an estimate reconciled by the next
/// `crank_nav` (which reads `adapter_current_value`).
///
/// Standard slots 0–4 (adapter-standard-v1.md §adapter_withdraw) + Kamino slots 5+.
#[derive(Accounts)]
pub struct AdapterWithdraw<'info> {
    /// CHECK: OXAR dispatcher program id; identity verified via sysvar in handler.
    pub dispatcher_program: AccountInfo<'info>,

    /// CHECK: instructions sysvar — address enforced; used for caller verification.
    #[account(address = sysvar::instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,

    /// CHECK: OXAR vault PDA; signs the klend CPI as `owner`. Validated against
    /// adapter_state.vault.
    pub vault: AccountInfo<'info>,

    /// Destination USDC token account owned by the vault PDA (klend `userDestinationLiquidity`).
    #[account(mut)]
    pub vault_usdc_pool: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [ADAPTER_STATE_SEED, crate::ID.as_ref(), vault.key().as_ref()],
        bump = adapter_state.bump,
        has_one = vault @ AdapterError::Unauthorized,
    )]
    pub adapter_state: Account<'info, AdapterState>,

    // ----- Kamino-specific (slots 5+) -----
    /// CHECK: klend reserve; validated == adapter_state.kamino_reserve.
    #[account(
        mut,
        address = adapter_state.kamino_reserve @ AdapterError::Unauthorized,
    )]
    pub reserve: AccountInfo<'info>,

    /// CHECK: klend lending market; validated by klend during CPI.
    pub lending_market: AccountInfo<'info>,
    /// CHECK: klend lending-market authority PDA; validated by klend during CPI.
    pub lending_market_authority: AccountInfo<'info>,
    /// CHECK: reserve liquidity mint (USDC); validated by klend during CPI.
    pub reserve_liquidity_mint: AccountInfo<'info>,
    /// CHECK: reserve liquidity supply vault; validated by klend during CPI.
    #[account(mut)]
    pub reserve_liquidity_supply: AccountInfo<'info>,
    /// CHECK: reserve collateral (cToken) mint; validated by klend during CPI.
    #[account(mut)]
    pub reserve_collateral_mint: AccountInfo<'info>,

    /// Vault-owned collateral account (klend `userSourceCollateral`).
    #[account(
        mut,
        address = adapter_state.collateral_vault @ AdapterError::Unauthorized,
    )]
    pub collateral_vault: Account<'info, TokenAccount>,

    /// CHECK: SPL token program for the collateral mint.
    pub collateral_token_program: AccountInfo<'info>,
    /// CHECK: SPL token program for the liquidity (USDC) mint.
    pub liquidity_token_program: AccountInfo<'info>,
    /// CHECK: Scope price feed for the reserve (refresh_reserve).
    pub scope_prices: AccountInfo<'info>,
    /// CHECK: klend program — CPI target; validated as the owner of `reserve`.
    #[account(
        executable,
        constraint = reserve.owner == klend_program.key @ AdapterError::Unauthorized,
    )]
    pub klend_program: AccountInfo<'info>,
}

pub fn handler<'info>(
    ctx: Context<'_, '_, '_, 'info, AdapterWithdraw<'info>>,
    shares: u64,
    adapter_data: Vec<u8>,
) -> Result<()> {
    require!(shares > 0, AdapterError::ZeroAmount);
    require!(
        adapter_data.len() <= MAX_ADAPTER_DATA_LEN,
        AdapterError::AdapterDataTooLarge
    );
    require!(
        shares <= ctx.accounts.adapter_state.total_shares,
        AdapterError::InsufficientShares
    );
    verify_caller_is_dispatcher(&ctx.accounts.instructions_sysvar)?;

    let klend = KlendAccounts {
        klend_program: ctx.accounts.klend_program.clone(),
        owner: ctx.accounts.vault.clone(),
        reserve: ctx.accounts.reserve.clone(),
        lending_market: ctx.accounts.lending_market.clone(),
        lending_market_authority: ctx.accounts.lending_market_authority.clone(),
        reserve_liquidity_mint: ctx.accounts.reserve_liquidity_mint.clone(),
        reserve_liquidity_supply: ctx.accounts.reserve_liquidity_supply.clone(),
        reserve_collateral_mint: ctx.accounts.reserve_collateral_mint.clone(),
        user_liquidity: ctx.accounts.vault_usdc_pool.to_account_info(),
        user_collateral: ctx.accounts.collateral_vault.to_account_info(),
        collateral_token_program: ctx.accounts.collateral_token_program.clone(),
        liquidity_token_program: ctx.accounts.liquidity_token_program.clone(),
        instruction_sysvar: ctx.accounts.instructions_sysvar.clone(),
        scope_prices: ctx.accounts.scope_prices.clone(),
    };

    klend_cpi::refresh_reserve(
        &klend.klend_program,
        &klend.reserve,
        &klend.lending_market,
        &klend.scope_prices,
    )?;

    let usdc_before = ctx.accounts.vault_usdc_pool.amount;
    klend_cpi::redeem_reserve_collateral(&klend, shares)?;
    ctx.accounts.vault_usdc_pool.reload()?;
    let usdc_after = ctx.accounts.vault_usdc_pool.amount;

    let amount_out = usdc_after
        .checked_sub(usdc_before)
        .ok_or(AdapterError::MathOverflow)?;

    let state = &mut ctx.accounts.adapter_state;
    state.total_shares = state
        .total_shares
        .checked_sub(shares)
        .ok_or(AdapterError::MathOverflow)?;

    emit!(AdapterWithdrawEvent {
        vault: state.vault,
        shares_burned: shares,
        amount_out,
    });
    msg!("kamino withdraw: {} cTokens -> {} USDC", shares, amount_out);
    Ok(())
}
