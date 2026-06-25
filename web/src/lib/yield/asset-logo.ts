// Per-asset logo resolution. Tokenized stocks get their real ticker logo from
// Financial Modeling Prep's keyless image endpoint; everything else returns
// undefined so the <AssetIcon> falls back to a clean monogram.
export function assetLogoSrc(id: string): string | undefined {
  if (id.startsWith("xstock-")) {
    const ticker = id.slice("xstock-".length).toUpperCase();
    return `https://financialmodelingprep.com/image-stock/${ticker}.png`;
  }
  return undefined;
}

/** Monogram text for the <AssetIcon> fallback: a stock's ticker, else the
 *  asset symbol (e.g. USDC) for yield sources. */
export function assetIconLabel(id: string, assetSymbol: string): string {
  if (id.startsWith("xstock-")) return id.slice("xstock-".length).toUpperCase();
  return assetSymbol;
}
