use anchor_lang::prelude::*;

use crate::constants::*;
use crate::error::OxarError;
use crate::state::{Action, Rule, RuleType, Trigger};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateRuleParams {
    pub rule_id: u64,
    pub rule_type: RuleType,
    pub trigger: Trigger,
    pub action: Action,
}

#[derive(Accounts)]
#[instruction(params: CreateRuleParams)]
pub struct CreateRule<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + Rule::INIT_SPACE,
        seeds = [
            RULE_SEED,
            owner.key().as_ref(),
            &params.rule_id.to_le_bytes(),
        ],
        bump,
    )]
    pub rule: Box<Account<'info, Rule>>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateRule>, params: CreateRuleParams) -> Result<()> {
    // Validate destinations: count + percent_bps sum to 10_000
    require!(
        params.action.destinations_used > 0
            && params.action.destinations_used <= MAX_RULE_DESTINATIONS,
        OxarError::InvalidRuleDestinations
    );

    let used = params.action.destinations_used as usize;
    let mut bps_sum: u32 = 0;
    for i in 0..used {
        let dest = params.action.destinations[i];
        require!(dest.percent_bps > 0, OxarError::InvalidRuleDestinations);
        bps_sum = bps_sum
            .checked_add(dest.percent_bps as u32)
            .ok_or(OxarError::MathOverflow)?;
    }
    // Unused slots must be zero
    for i in used..MAX_RULE_DESTINATIONS as usize {
        require!(
            params.action.destinations[i].percent_bps == 0,
            OxarError::InvalidRuleDestinations
        );
    }
    require!(
        bps_sum == BPS_DENOMINATOR as u32,
        OxarError::InvalidRuleDestinations
    );

    let clock = Clock::get()?;
    let rule = &mut ctx.accounts.rule;
    rule.owner = ctx.accounts.owner.key();
    rule.rule_id = params.rule_id;
    rule.rule_type = params.rule_type;
    rule.trigger = params.trigger;
    rule.action = params.action;
    rule.is_active = true;
    rule.last_triggered_at = 0;
    rule.trigger_count = 0;
    rule.bump = ctx.bumps.rule;

    msg!(
        "Rule {} created by {} ({} destinations)",
        rule.key(),
        ctx.accounts.owner.key(),
        used
    );
    let _ = clock; // available if future logic needs it
    Ok(())
}
