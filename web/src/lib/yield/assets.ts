import { isXStock } from "./xstocks";
import { isGold } from "./gold";

/**
 * A price-exposure asset (tokenized stock or commodity) shown in a buy/sell
 * section: holdings are valued at market price, P&L = value − cost basis, no APY.
 * Both `XStockMeta` and `GoldMeta` satisfy this shape, so one section component
 * renders either catalog.
 */
export interface AssetMeta {
  id: string;
  symbol: string;
  token: string;
  name: string;
  mint: string;
}

/** True for price-exposure holdings (stocks + commodities) vs yield-bearing sources. */
export function isPriceExposure(id: string): boolean {
  return isXStock(id) || isGold(id);
}
