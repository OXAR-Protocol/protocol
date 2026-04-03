use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer};

use crate::constants::*;
use crate::state::{Listing, Vault};

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

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

    /// Seller's vault-token account (receives tokens back).
    #[account(
        mut,
        token::mint = vault_token_mint,
        token::authority = seller,
    )]
    pub seller_vault_token: Account<'info, TokenAccount>,

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

pub fn handler(ctx: Context<CancelListing>) -> Result<()> {
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

    let amount = ctx.accounts.escrow_token_account.amount;

    // Transfer tokens from escrow back to seller (vault PDA signs)
    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.seller_vault_token.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
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
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );
    token::close_account(close_ctx)?;

    msg!("Listing cancelled, {} tokens returned to seller", amount);
    Ok(())
}
