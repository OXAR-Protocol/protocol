import { PROVIDERS } from "./registry";
import { isXStock } from "./xstocks";

/**
 * "What am I actually buying?" — answered with links a user can check themselves,
 * not with copy asking them to trust us.
 *
 * Everything here is derived from what the app already knows: the mint it will
 * actually swap into, and the pool whose rate it quotes. A claim we can't link to
 * simply isn't made — an issuer without a public attestation shows fewer rows
 * rather than a vaguer one.
 */
export interface ProofLink {
  /** Short label, e.g. "the token you receive". */
  key: "token" | "issuer" | "rate" | "backing";
  href: string;
}

/** Tether publishes gold-bar attestations for XAUt — for XAUt, and nothing else.
 *  This used to be the fallback for every `isGold(id)`, which meant ORO's "what
 *  backs it" pointed at Tether's vault: not a broken link but a false claim about
 *  whose bullion is behind the token. Each gold now names its own issuer below,
 *  and a gold that doesn't name one shows no backing row at all. */
const XAUT_BACKING = "https://gold.tether.to/transparency";

/** Issuer / attestation pages, per source. Only where one genuinely exists. */
const ISSUER: Record<string, { issuer?: string; backing?: string }> = {
  "ondo-usdy": {
    issuer: "https://ondo.finance/usdy",
    backing: "https://ondo.finance/usdy#transparency",
  },
  "maple-solana": {
    issuer: "https://syrup.fi",
    backing: "https://app.maple.finance/earn/syrupUSDC",
  },
  "onre-onyc": {
    issuer: "https://onre.finance",
    backing: "https://docs.onre.finance/for-capital-providers/redemptions",
  },
  "gold-oro": {
    issuer: "https://oro.finance",
    backing: "https://oro.finance/transparency",
  },
  "gold-xaut": {
    issuer: "https://gold.tether.to",
    backing: XAUT_BACKING,
  },
  "jupiter-lend-usdc": { issuer: "https://jup.ag/lend" },
  "jupiter-lend-usdt": { issuer: "https://jup.ag/lend" },
};

/** Backed's prospectus and final terms for xStocks — the document that says what
 *  each token is a claim on. (An earlier guess at this URL 404'd: every link here
 *  is now one that was actually opened.) */
const XSTOCK_BACKING = "https://assets.backed.fi/legal-documentation";

export function proofLinks(id: string): ProofLink[] {
  const provider = PROVIDERS.find((p) => p.id === id);
  const links: ProofLink[] = [];

  // The mint itself: the single most checkable fact — this exact token, on chain.
  if (provider?.heldMint) {
    links.push({ key: "token", href: `https://solscan.io/token/${provider.heldMint}` });
  }

  const known = ISSUER[id];
  if (known?.issuer) links.push({ key: "issuer", href: known.issuer });

  const backing = known?.backing ?? (isXStock(id) ? XSTOCK_BACKING : undefined);
  if (backing) links.push({ key: "backing", href: backing });

  // Where the advertised rate comes from — the same pool the number is read from.
  if (provider?.defiLlamaPoolId) {
    links.push({ key: "rate", href: `https://defillama.com/yields/pool/${provider.defiLlamaPoolId}` });
  }

  return links;
}
