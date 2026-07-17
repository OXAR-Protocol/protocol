// Per-asset logo resolution → currently always undefined, so <AssetIcon> renders a
// clean ticker monogram. Reliable and zero-dependency, which no keyless stock-logo
// CDN turned out to be:
//   • Financial Modeling Prep — intermittent 502s + a tiny valid-PNG error body that
//     DECODES without firing <img> onError → blank tiles (never fell back).
//   • Parqet — served without an Access-Control-Allow-Origin header (CORS-blocked in
//     the grid) + 404s on some tickers + WRONG-company matches (SPCX → an "axs" logo).
// Real per-token logos need self-hosting Backed's official xStock assets (a polish
// task); until then monograms are correct and on-brand. Keep the signature so callers
// (and a future self-hosted map) don't change.
export function assetLogoSrc(_id: string): string | undefined {
  return undefined;
}

/** Monogram text for the <AssetIcon> fallback: a stock's ticker, else the
 *  asset symbol (e.g. USDC) for yield sources. */
export function assetIconLabel(id: string, assetSymbol: string): string {
  if (id.startsWith("xstock-")) return id.slice("xstock-".length).toUpperCase();
  return assetSymbol;
}
