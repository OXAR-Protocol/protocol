/**
 * Tokenized securities (xStocks, and Ondo's equity products) are offered under
 * Reg S — NOT to US persons, and not in a set of restricted jurisdictions. This
 * gates the /stocks section by the request's country (Vercel `x-vercel-ip-country`).
 *
 * Note: defaults to ALLOW when the country is unknown (e.g. local dev, where the
 * header is absent) so development isn't blocked; on Vercel the header is always
 * set. A stricter fail-closed policy (block on unknown) is a deliberate hardening
 * choice for launch.
 */

// ISO-3166 alpha-2 codes blocked for tokenized securities (extend per legal).
const BLOCKED_COUNTRIES = new Set<string>([
  "US", // United States + territories
  "CA", // Canada
  "GB", // United Kingdom
  "CH", // Switzerland
  // Sanctioned / explicitly excluded:
  "CU",
  "IR",
  "KP",
  "SY",
  "RU",
  "BY",
]);

/** True if tokenized stocks must be geoblocked for this country code. */
export function isStockBlockedCountry(country: string | null | undefined): boolean {
  if (!country) return false; // unknown → allow (dev); prod always supplies it
  return BLOCKED_COUNTRIES.has(country.toUpperCase());
}
