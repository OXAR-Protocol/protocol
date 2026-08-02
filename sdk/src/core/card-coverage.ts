/**
 * Where a card route is known NOT to work, so the chooser can say so before
 * someone spends a decline finding out.
 *
 * Only verified facts go in here. An empty list means "no known restriction" —
 * never "confirmed to work". Coverage is checked against the providers' own APIs;
 * whether a specific bank passes the charge is a separate question that no country
 * list can answer (a Ukrainian card was refused for one provider and accepted for
 * another on the same day).
 */

/** Country codes each route's provider does not serve. */
const NOT_SERVED: Record<string, readonly string[]> = {
  /**
   * The built-in card is Privy routing across MoonPay / Coinbase / Stripe by geo.
   * MoonPay's own API answers `isBuyAllowed: false` for Ukraine and lists no UAH,
   * and no route through the other two has been seen working from there either.
   */
  builtin: ["UA"],
  /** Paybis restricts only occupied territories, which an IP country can't express. */
  paybis: [],
};

/** True when this route's provider is known not to serve the country. */
export function cardRouteUnserved(routeKey: string, country: string | null | undefined): boolean {
  if (!country) return false;
  return (NOT_SERVED[routeKey] ?? []).includes(country.toUpperCase());
}
