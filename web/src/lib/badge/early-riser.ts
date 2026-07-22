/**
 * "Early Riser" — an honorary badge for people who were in during the closed alpha.
 * Ties to the brand line "where your money sleeps": while everyone's money slept, you
 * rose early.
 *
 * Criterion (deliberately simple — no user table, no token, purely cosmetic): you had
 * access to the app before the public launch. We stamp a first-seen timestamp per browser
 * on the first app paint; anyone whose first-seen predates ALPHA_CUTOFF qualifies. During
 * the closed alpha the access wall only lets allowlisted/invited people in, so the badge
 * stays honest and scarce on its own — once we open publicly, later first-seens don't get
 * it. No backfill needed: everyone already in stamps a first-seen < cutoff automatically.
 */

// Public-launch cutoff. Anyone whose first app visit predates this is an Early Riser.
// Bump this to the real open-launch date when closed alpha ends (until then, everyone
// who gets past the wall is genuinely early).
export const ALPHA_CUTOFF = Date.parse("2027-01-01T00:00:00Z");

const FIRST_SEEN_KEY = "oxar.firstSeen.v1";

/** Record the first time this browser opened the app (idempotent); returns that ms epoch. */
export function markFirstSeen(): number | null {
  try {
    const ls = window.localStorage;
    const existing = ls.getItem(FIRST_SEEN_KEY);
    if (existing) {
      const n = Number(existing);
      if (Number.isFinite(n)) return n;
    }
    const now = Date.now();
    ls.setItem(FIRST_SEEN_KEY, String(now));
    return now;
  } catch {
    return null;
  }
}

/** True if this browser first saw the app during the closed alpha (before public launch). */
export function isEarlyRiser(): boolean {
  const seen = markFirstSeen();
  return seen !== null && seen < ALPHA_CUTOFF;
}
