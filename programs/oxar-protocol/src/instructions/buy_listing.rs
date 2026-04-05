use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{Listing, Vault};

#[derive(Accounts)]
pub struct BuyListing<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Seller receives USDC payment; validated via listing.seller.
    #[account(mut, constraint = seller.key() == listing.seller)]
    pub seller: UncheckedAccount<'info>,

    #[account(
        seeds = [VAULT_SEED, vault.region.as_bytes(), vault.denomination.as_bytes(), vault.asset_subtype.as_bytes(), &vault.series.to_le_bytes()],
        bump = vault.bump,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        mut,
        close = seller,
        seeds = [LISTING_SEED, vault.key().as_ref(), seller.key().as_ref()],
        bump = listing.bump,
        has_one = seller,
        has_one = vault,
    )]
    pub listing: Account<'info, Listing>,

    #[account(
        seeds = [MINT_SEED, vault.key().as_ref()],
        bump,
    )]
    pub vault_token_mint: Account<'info, Mint>,

    #[account(mut, token::mint = vault.usdc_mint, token::authority = buyer)]
    pub buyer_usdc: Account<'info, TokenAccount>,

    #[account(mut, token::mint = vault.usdc_mint, token::authority = seller)]
    pub seller_usdc: Account<'info, TokenAccount>,

    /// Treasury USDC account for protocol fees.
    /// Validated: must be a USDC token account owned by the vault's treasury wallet.
    #[account(mut, token::mint = vault.usdc_mint, token::authority = vault.treasury)]
    pub treasury_usdc: Account<'info, TokenAccount>,

    #[account(mut, token::mint = vault_token_mint, token::authority = buyer)]
    pub buyer_vault_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, vault.key().as_ref(), seller.key().as_ref()],
        bump,
        token::mint = vault_token_mint,
        token::authority = vault,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<BuyListing>) -> Result<()> {
    require!(
        ctx.accounts.buyer.key() != ctx.accounts.listing.seller,
        OxarError::SelfPurchase
    );

    let listing = &ctx.accounts.listing;
    let vault = &ctx.accounts.vault;
    let amount = listing.amount;
    let price_per_token = listing.price_per_token;

    // TODO: use checked u128->u64 casts (e.g. TryInto) instead of `as u64` to catch overflow
    let total_cost = (amount as u128)
        .checked_mul(price_per_token as u128)
        .ok_or(OxarError::MathOverflow)?
        .checked_div(NAV_PRECISION)
        .ok_or(OxarError::MathOverflow)? as u64;

    let fee = (total_cost as u128)
        .checked_mul(vault.fee_bps as u128)
        .ok_or(OxarError::MathOverflow)?
        .checked_div(BPS_DENOMINATOR as u128)
        .ok_or(OxarError::MathOverflow)? as u64;

    let seller_amount = total_cost.checked_sub(fee).ok_or(OxarError::MathOverflow)?;

    require!(ctx.accounts.buyer_usdc.amount >= total_cost, OxarError::InsufficientFunds);

    // USDC: buyer -> seller (minus fee)
    token::transfer(CpiContext::new(ctx.accounts.token_program.to_account_info(), Transfer {
        from: ctx.accounts.buyer_usdc.to_account_info(),
        to: ctx.accounts.seller_usdc.to_account_info(),
        authority: ctx.accounts.buyer.to_account_info(),
    }), seller_amount)?;

    // Fee: buyer -> treasury
    if fee > 0 {
        token::transfer(CpiContext::new(ctx.accounts.token_program.to_account_info(), Transfer {
            from: ctx.accounts.buyer_usdc.to_account_info(),
            to: ctx.accounts.treasury_usdc.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        }), fee)?;
    }

    // Tokens: escrow -> buyer (vault PDA signs)
    let region = vault.region.clone();
    let denomination = vault.denomination.clone();
    let asset_subtype = vault.asset_subtype.clone();
    let vault_seeds = &[
        VAULT_SEED, region.as_bytes(), denomination.as_bytes(),
        asset_subtype.as_bytes(), &vault.series.to_le_bytes(), &[vault.bump],
    ];
    let signer_seeds = &[&vault_seeds[..]];

    token::transfer(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), Transfer {
        from: ctx.accounts.escrow_token_account.to_account_info(),
        to: ctx.accounts.buyer_vault_token.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),
    }, signer_seeds), amount)?;

    token::close_account(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), CloseAccount {
        account: ctx.accounts.escrow_token_account.to_account_info(),
        destination: ctx.accounts.seller.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),
    }, signer_seeds))?;

    msg!("Listing purchased: {} tokens for {} USDC (fee: {})", amount, total_cost, fee);
    Ok(())
}
