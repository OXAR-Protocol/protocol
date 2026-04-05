use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{Listing, Vault};

/// Note: the listing PDA is seeded by (vault, seller), so each seller can have at most
/// one active listing per vault. This is intentional — it simplifies escrow management
/// and prevents spam. Sellers must cancel an existing listing before creating a new one.
#[derive(Accounts)]
pub struct CreateListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        seeds = [VAULT_SEED, vault.region.as_bytes(), vault.denomination.as_bytes(), vault.asset_subtype.as_bytes(), &vault.series.to_le_bytes()],
        bump = vault.bump,
        constraint = vault.is_active @ OxarError::VaultNotActive,
    )]
    pub vault: Box<Account<'info, Vault>>,

    #[account(
        init,
        payer = seller,
        space = 8 + Listing::INIT_SPACE,
        seeds = [LISTING_SEED, vault.key().as_ref(), seller.key().as_ref()],
        bump,
    )]
    pub listing: Box<Account<'info, Listing>>,

    #[account(
        seeds = [MINT_SEED, vault.key().as_ref()],
        bump,
    )]
    pub vault_token_mint: Account<'info, Mint>,

    /// Seller's vault-token account.
    #[account(
        mut,
        token::mint = vault_token_mint,
        token::authority = seller,
    )]
    pub seller_vault_token: Account<'info, TokenAccount>,

    /// Escrow token account to hold listed tokens.
    /// Uses vault PDA as authority (not listing) to avoid init ordering issues.
    #[account(
        init,
        payer = seller,
        seeds = [ESCROW_SEED, vault.key().as_ref(), seller.key().as_ref()],
        bump,
        token::mint = vault_token_mint,
        token::authority = vault,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateListing>, amount: u64, price_per_token: u64) -> Result<()> {
    let clock = Clock::get()?;

    require!(amount > 0, OxarError::ZeroListingAmount);
    require!(price_per_token > 0, OxarError::ZeroListingPrice);
    require!(
        ctx.accounts.seller_vault_token.amount >= amount,
        OxarError::InsufficientFunds
    );

    // Transfer tokens from seller to escrow
    let transfer_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.seller_vault_token.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.seller.to_account_info(),
        },
    );
    token::transfer(transfer_ctx, amount)?;

    // Initialize listing state
    let listing = &mut ctx.accounts.listing;
    listing.seller = ctx.accounts.seller.key();
    listing.vault = ctx.accounts.vault.key();
    listing.token_mint = ctx.accounts.vault_token_mint.key();
    listing.amount = amount;
    listing.price_per_token = price_per_token;
    listing.created_at = clock.unix_timestamp;
    listing.bump = ctx.bumps.listing;

    msg!(
        "Listing created: {} tokens at {} per token",
        amount,
        price_per_token
    );
    Ok(())
}
