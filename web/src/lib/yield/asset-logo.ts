// Per-asset logo resolution. Tokenized stocks get their real ticker logo from
// Parqet's keyless logo CDN; everything else returns undefined so the <AssetIcon>
// falls back to a clean monogram.
//
// Was Financial Modeling Prep — dropped 2026-07-17: its keyless endpoint went
// intermittently 502 and served a tiny valid-PNG error body that DECODES without
// firing <img> onError, so the monogram fallback never triggered → blank icons.
// Parqet misses return a real 404 (empty body) → onError fires → monogram shows.
export function assetLogoSrc(id: string): string | undefined {
  if (id.startsWith("xstock-")) {
    const ticker = id.slice("xstock-".length).toUpperCase();
    return `https://assets.parqet.com/logos/symbol/${ticker}?format=png`;
  }
  return undefined;
}

/** Monogram text for the <AssetIcon> fallback: a stock's ticker, else the
 *  asset symbol (e.g. USDC) for yield sources. */
export function assetIconLabel(id: string, assetSymbol: string): string {
  if (id.startsWith("xstock-")) return id.slice("xstock-".length).toUpperCase();
  return assetSymbol;
}
