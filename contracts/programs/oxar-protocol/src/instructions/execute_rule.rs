use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::OxarError;
use crate::state::Rule;

/// Mark a rule as triggered.
///
/// This is a lightweight bookkeeping call — the actual distribution happens
/// client-side via a multi-instruction tx assembled from the rule's Action.
/// The off-chain monitor builds the tx; the user signs; this call updates
/// last_triggered_at + trigger_count for telemetry and rate-limiting.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ExecuteRuleParams {
    pub incoming_amount: u64,
    /// 64-byte tx signature of the deposit that triggered the rule (for audit)
    pub incoming_tx_signature: [u8; 64],
}

#[derive(Accounts)]
pub struct ExecuteRule<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [
            RULE_SEED,
            owner.key().as_ref(),
            &rule.rule_id.to_le_bytes(),
        ],
        bump = rule.bump,
        constraint = rule.owner == owner.key() @ OxarError::Unauthorized,
        constraint = rule.is_active @ OxarError::RuleInactive,
    )]
    pub rule: Box<Account<'info, Rule>>,
}

pub fn handler(ctx: Context<ExecuteRule>, params: ExecuteRuleParams) -> Result<()> {
    let clock = Clock::get()?;
    let rule = &mut ctx.accounts.rule;

    require!(params.incoming_amount > 0, OxarError::ZeroDeposit);

    rule.last_triggered_at = clock.unix_timestamp;
    rule.trigger_count = rule.trigger_count.checked_add(1).unwrap_or(rule.trigger_count);

    msg!(
        "Rule {} triggered (#{}) for {} lamports",
        rule.key(),
        rule.trigger_count,
        params.incoming_amount
    );
    let _ = params.incoming_tx_signature; // logged off-chain via tx
    Ok(())
}
