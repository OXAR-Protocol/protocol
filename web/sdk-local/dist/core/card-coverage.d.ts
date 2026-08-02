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
/** True when this route's provider is known not to serve the country. */
export declare function cardRouteUnserved(routeKey: string, country: string | null | undefined): boolean;
