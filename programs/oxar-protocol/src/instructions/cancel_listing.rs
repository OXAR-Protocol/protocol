use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::state::{Listing, Vault};

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        seeds = [VAULT_SEED, vault.authority.as_ref(), vault.asset_class.as_bytes()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

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

    /// Seller's vault-token account (receives tokens back).
    #[account(
        mut,
        token::mint = vault_token_mint,
        token::authority = seller,
    )]
    pub seller_vault_token: Account<'info, TokenAccount>,

    /// Escrow holding the listed tokens.
    #[account(
        mut,
        seeds = [ESCROW_SEED, listing.key().as_ref()],
        bump,
        token::mint = vault_token_mint,
        token::authority = listing,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CancelListing>) -> Result<()> {
    let vault_key = ctx.accounts.vault.key();
    let seller_key = ctx.accounts.seller.key();

    let listing_seeds = &[
        LISTING_SEED,
        vault_key.as_ref(),
        seller_key.as_ref(),
        &[ctx.accounts.listing.bump],
    ];
    let signer_seeds = &[&listing_seeds[..]];

    let amount = ctx.accounts.escrow_token_account.amount;

    // Transfer tokens from escrow back to seller
    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.seller_vault_token.to_account_info(),
            authority: ctx.accounts.listing.to_account_info(),
        },
        signer_seeds,
    );
    token::transfer(transfer_ctx, amount)?;

    // Close the escrow token account
    let close_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        CloseAccount {
            account: ctx.accounts.escrow_token_account.to_account_info(),
            destination: ctx.accounts.seller.to_account_info(),
            authority: ctx.accounts.listing.to_account_info(),
        },
        signer_seeds,
    );
    token::close_account(close_ctx)?;

    msg!("Listing cancelled, {} tokens returned to seller", amount);
    Ok(())
}
