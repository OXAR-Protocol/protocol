// Invite-link access. A shared `?code` on any app URL clears the closed-alpha wall
// for that browser (see AccessWall) — no manual approval, no email required up front.
// After the person is inside, a soft popup (JoinCapture) asks for their email to put
// them on the waitlist + allowlist (so access persists across devices, and we can
// reach them for big updates). It's a SOFT gate: the app is non-custodial, so this
// only controls who sees the UI, never funds.

/** The one shared invite code (add more here for future campaigns). */
export const INVITE_CODE = "superteam-alpha";

// localStorage keys.
export const INVITE_FLAG = "oxar.join.invite.v1"; // arrived via an invite link
export const CAPTURED_FLAG = "oxar.join.captured.v1"; // gave an email → never ask again
export const DISMISSED_FLAG = "oxar.join.dismissed.v1"; // "maybe later" → don't nag again
