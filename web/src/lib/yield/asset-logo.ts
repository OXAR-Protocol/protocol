// Per-asset logo resolution. Stock logos are SELF-HOSTED under /public/logos/xstocks/
// (from the open nvstly/icons set), served same-origin — no CORS, and a missing file
// returns a real 404 so <AssetIcon>'s onError fires → clean ticker monogram. We host
// them instead of hotlinking a keyless CDN because none was reliable: FMP 502'd with a
// valid-PNG error body that decoded WITHOUT firing onError (blank tiles); Parqet was
// CORS-blocked + 404'd + returned wrong-company logos. Tickers without a bundled file
// (ETFs like SPY/QQQ/GLD, private SPCX, CRCL) just fall back to a monogram.
/** Ticker from a stock id. The `-ondo` suffix is still stripped: a rail variant of
 *  the same company would share its ticker and logo, and the one that existed is
 *  gone rather than impossible. */
function stockTicker(id: string): string {
  return id.slice("xstock-".length).replace(/-ondo$/, "").toUpperCase();
}

/**
 * Yield sources and gold, by provider id. Self-hosted for the same reason the
 * stocks are: these came from the tokens' own metadata (Jupiter's list, CoinGecko
 * where that failed), and an IPFS or Arweave gateway is not something a logo should
 * depend on at render time.
 *
 * All are square, edge to edge, like the stock logos — a token's round mark left as
 * a circle floated inside the tile with a rim of card showing around it, which read
 * as a mistake next to a column of full-bleed squares. Each is composited onto its
 * own rim colour, with the mark's cut-outs (Tether's T) kept white so filling the
 * outside doesn't erase the letter.
 */
const ASSET_LOGOS: Record<string, string> = {
  "jupiter-lend-usdc": "/logos/assets/jupiter-lend-usdc.png",
  "jupiter-lend-usdt": "/logos/assets/jupiter-lend-usdt.png",
  "ondo-usdy": "/logos/assets/ondo-usdy.png",
  "maple-solana": "/logos/assets/maple-solana.png",
  "onre-onyc": "/logos/assets/onre-onyc.png",
  "gold-xaut": "/logos/assets/gold-xaut.png",
  "gold-oro": "/logos/assets/gold-oro.png",
};

export function assetLogoSrc(id: string): string | undefined {
  if (id.startsWith("xstock-")) {
    return `/logos/xstocks/${stockTicker(id)}.png`;
  }
  return ASSET_LOGOS[id];
}

/** Monogram text for the <AssetIcon> fallback: a stock's ticker, else the
 *  asset symbol (e.g. USDC) for yield sources. */
export function assetIconLabel(id: string, assetSymbol: string): string {
  if (id.startsWith("xstock-")) return stockTicker(id);
  return assetSymbol;
}
