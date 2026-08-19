"use client";

import { usePickSet } from "@/components/pick-set";
import { BasketBar } from "@/components/basket-bar";
import type { ProviderView } from "@/hooks/use-yield-positions";

/**
 * The market's basket — the page-wide picked set, handed to the bar that can do
 * both directions with it. Buying is the usual errand here; selling appears by
 * itself when something picked is something you already hold.
 */
export function PickedBuyBar({ views }: { views: readonly ProviderView[] }) {
  const pickSet = usePickSet();
  if (!pickSet?.enabled) return null;

  return (
    <BasketBar
      views={views}
      picked={pickSet.picked}
      onOutcome={() => {}}
      onClear={() => pickSet.clear()}
      onSwap={(from, to) => pickSet.swap(from, to)}
    />
  );
}
