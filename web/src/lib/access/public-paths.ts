/**
 * The shop window: app routes a signed-out visitor may see.
 *
 * Everything else in `(app)` stays behind the login and the closed-alpha wall.
 * The split exists for one reason: every link we post pointed at a door. Someone
 * following an announcement about ORO landed on a sign-in form and left, so the
 * catalog is now readable without an account — and the wall moved from the
 * entrance onto the money.
 */
const PUBLIC_APP_PATHS = [
  "/market",
  "/yield",
  "/asset",
  // The portfolio and profile are public too, but empty: a visitor with no account
  // has no positions and no settings, so each says so and offers the way in. They
  // exist signed out because the tab bar does — three tabs where one of them
  // bounces you elsewhere is a broken bar, not a gate.
  "/portfolio",
  "/home",
  "/you",
] as const;

/** True when a signed-out visitor may see this route. */
export function isPublicAppPath(pathname: string): boolean {
  return PUBLIC_APP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
