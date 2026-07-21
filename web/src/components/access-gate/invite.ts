// Invite-link access. A shared `?code` on any app URL clears the closed-alpha wall
// for that browser (see AccessWall) — no manual approval, no email required up front.
// After the person is inside, a soft popup (JoinCapture) asks for their email to put
// them on the waitlist + allowlist (so access persists across devices, and we can
// reach them for big updates). It's a SOFT gate: the app is non-custodial, so this
// only controls who sees the UI, never funds.

/** Valid invite codes that clear the wall. One per channel, so we can attribute
 *  where a user arrived from (see CHANNEL_KEY). Add a campaign = add a code here. */
export const INVITE_CODES = ["superteam-alpha", "dev3pack-alpha"] as const;

/** Back-compat single-code export (first code). Prefer `isValidInviteCode`. */
export const INVITE_CODE = INVITE_CODES[0];

/** Is this `?code` one of our valid invite codes? */
export function isValidInviteCode(code: string | null | undefined): code is string {
  return !!code && (INVITE_CODES as readonly string[]).includes(code);
}

// localStorage keys.
export const INVITE_FLAG = "oxar.join.invite.v1"; // arrived via an invite link
export const CAPTURED_FLAG = "oxar.join.captured.v1"; // gave an email → never ask again
export const DISMISSED_FLAG = "oxar.join.dismissed.v1"; // "maybe later" → don't nag again
export const CHANNEL_KEY = "oxar.join.channel.v1"; // which invite code they arrived through (first-touch)
