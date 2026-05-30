import type { ProviderView } from "@/hooks/use-yield-positions";

/**
 * A marketplace card: one standalone provider, or several providers of the same
 * protocol (e.g. Jupiter Lend USDC/USDT/USDG) collapsed behind a stablecoin picker.
 */
export interface ProviderGroup {
  /** `group` id for collapsed protocols, else the single provider's id. */
  key: string;
  name: string;
  views: ProviderView[];
  /** Highest APY across members (fraction) — shown as "up to X%" when collapsed. */
  maxApy: number;
  hasPosition: boolean;
}

/**
 * Collapse providers that share a `group` into one card; leave others standalone.
 * Order follows each group's first appearance.
 */
export function groupProviderViews(views: ProviderView[]): ProviderGroup[] {
  const order: string[] = [];
  const byKey = new Map<string, ProviderView[]>();

  for (const v of views) {
    const key = v.group ?? v.id;
    const bucket = byKey.get(key);
    if (bucket) {
      bucket.push(v);
    } else {
      byKey.set(key, [v]);
      order.push(key);
    }
  }

  return order.map((key) => {
    const members = byKey.get(key)!;
    return {
      key,
      name: members[0].name,
      views: members,
      maxApy: members.reduce((max, v) => Math.max(max, v.apy), 0),
      hasPosition: members.some((v) => v.underlyingBalance > BigInt(0)),
    };
  });
}
