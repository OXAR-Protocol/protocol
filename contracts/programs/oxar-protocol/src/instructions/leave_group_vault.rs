use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{GroupMember, GroupVault};

/// Close GroupMember account after the member has withdrawn all shares.
/// Refunds the rent SOL to the member and decrements the group's member_count.
#[derive(Accounts)]
pub struct LeaveGroupVault<'info> {
    #[account(mut)]
    pub member: Signer<'info>,

    #[account(mut)]
    pub group_vault: Box<Account<'info, GroupVault>>,

    #[account(
        mut,
        close = member,
        seeds = [
            GROUP_MEMBER_SEED,
            group_vault.key().as_ref(),
            member.key().as_ref(),
        ],
        bump = group_member.bump,
        constraint = group_member.member == member.key() @ OxarError::NotMember,
        constraint = group_member.shares_owned == 0 @ OxarError::InsufficientShares,
    )]
    pub group_member: Account<'info, GroupMember>,
}

pub fn handler(ctx: Context<LeaveGroupVault>) -> Result<()> {
    let group_vault = &mut ctx.accounts.group_vault;
    group_vault.member_count = group_vault.member_count.saturating_sub(1);

    msg!(
        "Member {} left group {} (account closed, rent refunded)",
        ctx.accounts.member.key(),
        group_vault.key()
    );
    Ok(())
}
