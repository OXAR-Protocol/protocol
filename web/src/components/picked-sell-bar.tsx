"use client";

import { BasketBar } from "@/components/basket-bar";
import type { ProviderView } from "@/hooks/use-yield-positions";

/**
 * The portfolio's basket. Selling is the usual errand here — and buying more of
 * what you already hold is now the same gesture, rather than a trip to the market
 * to find the thing that is already on this screen.
 */
export function PickedSellBar({
  views,
  selected,
  onOutcome,
  onDone,
}: {
  /** Everything held, so a failed row can be named by its asset rather than its id. */
  views: ProviderView[];
  selected: ReadonlySet<string>;
  onOutcome: (stillSelected: ReadonlySet<string>) => void;
  onDone: () => void;
}) {
  return (
    <BasketBar
      views={views}
      picked={selected}
      onOutcome={onOutcome}
      onClear={() => onOutcome(new Set())}
      onDone={onDone}
    />
  );
}
