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

// ISO-3166 alpha-2 codes blocked for tokenized securities.
//
// The list mirrors the issuer's own restricted-countries list — Backed Finance
// (xStocks) publishes it at assets.backed.fi/legal-documentation/restricted-countries.
// Where the issuer will not serve a country, showing a buy button there is a risk
// we take for nothing: the token is theirs, not ours. Countries we block that the
// issuer does not are marked as our own caution, so a later reader can tell the
// two apart.
//
// Note what a country list cannot do: both issuers exclude *regions* — Crimea,
// Sevastopol, Luhansk, Donetsk — and `x-vercel-ip-country` returns `UA` for all
// of them. That gap is disclosed in the terms (§7) rather than enforced here;
// closing it needs `x-vercel-ip-country-region`.
const BLOCKED_COUNTRIES = new Set<string>([
  // Reg S — the offering is not made to US persons:
  "US", // United States + territories
  // Our own caution, not on the issuer's list:
  "CA", // Canada
  "GB", // United Kingdom
  "CH", // Switzerland
  // Sanctioned / explicitly excluded by the issuer:
  "CU",
  "IR",
  "KP",
  "SY",
  "RU",
  "BY",
  // Not served by the issuer (Backed restricted-countries list):
  "AF",
  "CF",
  "CD",
  "ET",
  "HT",
  "IQ",
  "LB",
  "LY",
  "ML",
  "MZ",
  "MM",
  "NI",
  "NG",
  "PH",
  "SO",
  "SS",
  "SD",
  "VE",
  "YE",
  "ZW",
  // Named unavailable in xStocks' own materials:
  "AU",
]);

/** True if tokenized stocks must be geoblocked for this country code. */
export function isStockBlockedCountry(country: string | null | undefined): boolean {
  if (!country) return false; // unknown → allow (dev); prod always supplies it
  return BLOCKED_COUNTRIES.has(country.toUpperCase());
}
