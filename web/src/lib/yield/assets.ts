import { isXStock } from "./xstocks";
import { isMetal } from "./metals-catalog";

/**
 * A price-exposure asset (tokenized stock or commodity) shown in a buy/sell
 * section: holdings are valued at market price, P&L = value − cost basis, no APY.
 * Both `XStockMeta` and `MetalMeta` satisfy this shape, so one section component
 * renders either catalog.
 */
export interface AssetMeta {
  id: string;
  symbol: string;
  token: string;
  name: string;
  mint: string;
  /** Category for the browse filter, e.g. "tech" / "crypto" (stocks). Optional. */
  sector?: string;
}

/** True for price-exposure holdings (stocks + commodities) vs yield-bearing sources. */
export function isPriceExposure(id: string): boolean {
  return isXStock(id) || isMetal(id);
}
