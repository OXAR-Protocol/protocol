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
