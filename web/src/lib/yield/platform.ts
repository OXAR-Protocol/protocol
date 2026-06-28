/**
 * The proven third-party protocol/issuer behind each source. We curate but do
 * not operate these (see /terms) — surfacing the name is a trust signal: the
 * user's money sits in a known, verifiable place, not an OXAR black box. That's
 * our non-custodial story made visible, and trust is the product's only asset.
 *
 * `kind` shapes the verb: lending markets hold deposits ("lent on Kamino"),
 * RWA/stock issuers mint the token you hold ("issued by Ondo Finance").
 */
export interface Platform {
  name: string;
  kind: "lent" | "issued";
}

/** The platform/issuer behind a provider id, or null if unknown. */
export function getPlatform(id: string): Platform | null {
  if (id.startsWith("jupiter-lend")) return { name: "Jupiter Lend", kind: "lent" };
  if (id.startsWith("kamino")) return { name: "Kamino", kind: "lent" };
  if (id.startsWith("ondo")) return { name: "Ondo Finance", kind: "issued" };
  if (id.startsWith("xstock")) return { name: "Backed Finance", kind: "issued" };
  if (id.startsWith("gold-xaut")) return { name: "Tether", kind: "issued" };
  return null;
}
