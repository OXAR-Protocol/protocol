// Invite-link access. A shared `?code` on any app URL clears the closed-alpha wall
// for that browser (see AccessWall) — no manual approval, no email required up front.
// After the person is inside, a soft popup (JoinCapture) asks for their email to put
// them on the waitlist + allowlist (so access persists across devices, and we can
// reach them for big updates). It's a SOFT gate: the app is non-custodial, so this
// only controls who sees the UI, never funds.

/** Valid invite codes that clear the wall. One per channel, so we can attribute
 *  where a user arrived from (see CHANNEL_KEY). Add a campaign = add a code here. */
export const INVITE_CODES = [
  "superteam-alpha",
  "dev3pack-alpha",
  "bridge-accelerator",
  "craft-circle",
  // Public: goes out in the ORO gold announcement. Unlike the others this one is
  // meant to be seen by anyone, so it buys no exclusivity — it's here purely so the
  // post's traffic lands under its own channel instead of merging into `direct`.
  "oro-gold",
  // The one link we hand out everywhere — launch pages, posts, DMs, decks:
  //   https://app.oxar.app/join?code=launch
  // Deliberately a single code rather than one per channel: a link you have to pick
  // the right variant of is a link that gets pasted wrong. Attribution for it is
  // therefore coarse (everything lands under `launch`) — that's the trade.
  "launch",
] as const;

/** Is this `?code` one of our valid invite codes? */
export function isValidInviteCode(code: string | null | undefined): code is string {
  return !!code && (INVITE_CODES as readonly string[]).includes(code);
}

// localStorage keys.
export const INVITE_FLAG = "oxar.join.invite.v1"; // arrived via an invite link
export const CAPTURED_FLAG = "oxar.join.captured.v1"; // gave an email → never ask again
export const DISMISSED_FLAG = "oxar.join.dismissed.v1"; // "maybe later" → don't nag again
export const CHANNEL_KEY = "oxar.join.channel.v1"; // which invite code they arrived through (first-touch)
