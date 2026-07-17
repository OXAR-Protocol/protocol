// Per-asset logo resolution. Stock logos are SELF-HOSTED under /public/logos/xstocks/
// (from the open nvstly/icons set), served same-origin — no CORS, and a missing file
// returns a real 404 so <AssetIcon>'s onError fires → clean ticker monogram. We host
// them instead of hotlinking a keyless CDN because none was reliable: FMP 502'd with a
// valid-PNG error body that decoded WITHOUT firing onError (blank tiles); Parqet was
// CORS-blocked + 404'd + returned wrong-company logos. Tickers without a bundled file
// (ETFs like SPY/QQQ/GLD, private SPCX, CRCL) just fall back to a monogram.
export function assetLogoSrc(id: string): string | undefined {
  if (id.startsWith("xstock-")) {
    const ticker = id.slice("xstock-".length).toUpperCase();
    return `/logos/xstocks/${ticker}.png`;
  }
  return undefined;
}

/** Monogram text for the <AssetIcon> fallback: a stock's ticker, else the
 *  asset symbol (e.g. USDC) for yield sources. */
export function assetIconLabel(id: string, assetSymbol: string): string {
  if (id.startsWith("xstock-")) return id.slice("xstock-".length).toUpperCase();
  return assetSymbol;
}
