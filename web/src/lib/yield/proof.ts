import { PROVIDERS } from "./registry";
import { isXStock } from "./xstocks";
import { isGold } from "./gold";

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
  "jupiter-lend-usdc": { issuer: "https://jup.ag/lend" },
  "jupiter-lend-usdt": { issuer: "https://jup.ag/lend" },
};

/** Backed's prospectus and final terms for xStocks — the document that says what
 *  each token is a claim on. (An earlier guess at this URL 404'd: every link here
 *  is now one that was actually opened.) */
const XSTOCK_BACKING = "https://assets.backed.fi/legal-documentation";
/** Tether publishes gold-bar attestations for XAUt. */
const GOLD_BACKING = "https://gold.tether.to/transparency";

export function proofLinks(id: string): ProofLink[] {
  const provider = PROVIDERS.find((p) => p.id === id);
  const links: ProofLink[] = [];

  // The mint itself: the single most checkable fact — this exact token, on chain.
  if (provider?.heldMint) {
    links.push({ key: "token", href: `https://solscan.io/token/${provider.heldMint}` });
  }

  const known = ISSUER[id];
  if (known?.issuer) links.push({ key: "issuer", href: known.issuer });

  const backing = known?.backing ?? (isXStock(id) ? XSTOCK_BACKING : isGold(id) ? GOLD_BACKING : undefined);
  if (backing) links.push({ key: "backing", href: backing });

  // Where the advertised rate comes from — the same pool the number is read from.
  if (provider?.defiLlamaPoolId) {
    links.push({ key: "rate", href: `https://defillama.com/yields/pool/${provider.defiLlamaPoolId}` });
  }

  return links;
}
