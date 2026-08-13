import type { TranslationKey } from "@/lib/i18n/en";

export interface TourStep {
  /** Route the step lives on — the driver navigates here before looking for the anchor. */
  route: string;
  /**
   * Matches the `data-tour="<anchor>"` attribute on the real element(s) being
   * introduced. Several are allowed: the catalog stop covers savings, stocks and
   * gold, and lighting only the first made the copy promise three things the
   * screen showed one of. Each gets its OWN hole rather than one blanket rect.
   */
  anchor: string | readonly string[];
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}

/**
 * The stops of the guided walkthrough — real routes, real elements, not
 * screenshots of them. If an anchor doesn't exist on the page (a feature flag is
 * off, a fresh wallet has no positions yet), the driver skips that step rather
 * than pointing the spotlight at nothing — see `app-tour.tsx`.
 *
 * Order matters for that reason: the two conditional stops (the multi-add control,
 * behind a flag; the history, which needs a position to exist) sit in the MIDDLE.
 * A skipped middle step is invisible, whereas a tour that ends on one just stops
 * early — and stopping early is indistinguishable from breaking. The last stop is
 * `/you`, which every signed-in wallet has.
 */
export const TOUR_STEPS: readonly TourStep[] = [
  {
    route: "/you",
    anchor: "balance",
    titleKey: "tour.balance.title",
    bodyKey: "tour.balance.body",
  },
  {
    route: "/you",
    anchor: "deposit",
    titleKey: "tour.deposit.title",
    bodyKey: "tour.deposit.body",
  },
  {
    route: "/market",
    // The three section headings, not the three full lists — a hole per compact
    // label reads as "there are these kinds here"; holes around the lists would
    // just be the page again, undimmed.
    anchor: ["catalog", "catalog-stocks", "catalog-gold"],
    titleKey: "tour.catalog.title",
    bodyKey: "tour.catalog.body",
  },
  {
    route: "/market",
    anchor: "multi-add",
    titleKey: "tour.multiAdd.title",
    bodyKey: "tour.multiAdd.body",
  },
  {
    route: "/you",
    anchor: "history",
    titleKey: "tour.history.title",
    bodyKey: "tour.history.body",
  },
  {
    route: "/asset/jupiter-lend-usdc",
    anchor: "chart",
    titleKey: "tour.chart.title",
    bodyKey: "tour.chart.body",
  },
  {
    route: "/you",
    anchor: "account",
    titleKey: "tour.account.title",
    bodyKey: "tour.account.body",
  },
] as const;

/** A step's anchors, however it spelled them. */
export function anchorsOf(step: TourStep): readonly string[] {
  return Array.isArray(step.anchor) ? step.anchor : [step.anchor as string];
}
