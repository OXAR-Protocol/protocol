use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::OxarError;
use crate::state::Rule;

/// Close a rule account and refund rent to the owner.
#[derive(Accounts)]
pub struct CancelRule<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        close = owner,
        seeds = [
            RULE_SEED,
            owner.key().as_ref(),
            &rule.rule_id.to_le_bytes(),
        ],
        bump = rule.bump,
        constraint = rule.owner == owner.key() @ OxarError::Unauthorized,
    )]
    pub rule: Account<'info, Rule>,
}

pub fn handler(ctx: Context<CancelRule>) -> Result<()> {
    msg!(
        "Rule {} cancelled by owner {}",
        ctx.accounts.rule.key(),
        ctx.accounts.owner.key()
    );
    Ok(())
}
