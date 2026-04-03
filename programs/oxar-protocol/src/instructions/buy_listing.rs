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
        seeds = [VAULT_SEED, vault.region.as_bytes(), vault.denomination.as_bytes(), vault.asset_subtype.as_bytes()],
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

    /// Buyer's USDC account (pays for the listing).
    #[account(
        mut,
        token::mint = vault.usdc_mint,
        token::authority = buyer,
    )]
    pub buyer_usdc: Account<'info, TokenAccount>,

    /// Seller's USDC account (receives payment).
    #[account(
        mut,
        token::mint = vault.usdc_mint,
    )]
    pub seller_usdc: Account<'info, TokenAccount>,

    /// Buyer's vault-token account (receives tokens).
    #[account(
        mut,
        token::mint = vault_token_mint,
        token::authority = buyer,
    )]
    pub buyer_vault_token: Account<'info, TokenAccount>,

    /// Escrow holding the listed tokens. Authority = vault PDA.
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
    let amount = listing.amount;
    let price_per_token = listing.price_per_token;

    // Total cost in USDC: amount * price_per_token / NAV_PRECISION
    let total_cost = (amount as u128)
        .checked_mul(price_per_token as u128)
        .ok_or(OxarError::MathOverflow)?
        .checked_div(NAV_PRECISION)
        .ok_or(OxarError::MathOverflow)? as u64;

    require!(
        ctx.accounts.buyer_usdc.amount >= total_cost,
        OxarError::InsufficientFunds
    );

    // Transfer USDC from buyer to seller
    let usdc_transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.buyer_usdc.to_account_info(),
            to: ctx.accounts.seller_usdc.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        },
    );
    token::transfer(usdc_transfer_ctx, total_cost)?;

    // Transfer vault tokens from escrow to buyer (vault PDA signs)
    let vault = &ctx.accounts.vault;
    let region = vault.region.clone();
    let denomination = vault.denomination.clone();
    let asset_subtype = vault.asset_subtype.clone();

    let vault_seeds = &[
        VAULT_SEED,
        region.as_bytes(),
        denomination.as_bytes(),
        asset_subtype.as_bytes(),
        &[vault.bump],
    ];
    let signer_seeds = &[&vault_seeds[..]];

    let token_transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.buyer_vault_token.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(token_transfer_ctx, amount)?;

    // Close the escrow token account, return rent to seller
    let close_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.escrow_token_account.to_account_info(),
            destination: ctx.accounts.seller.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );
    token::close_account(close_ctx)?;

    msg!(
        "Listing purchased: {} tokens for {} USDC",
        amount,
        total_cost
    );
    Ok(())
}
