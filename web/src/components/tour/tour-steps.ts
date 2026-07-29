import type { TranslationKey } from "@/lib/i18n/en";

export interface TourStep {
  /** Route the step lives on — the driver navigates here before looking for the anchor. */
  route: string;
  /** Matches the `data-tour="<anchor>"` attribute on the real element being introduced. */
  anchor: string;
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
    route: "/portfolio",
    anchor: "balance",
    titleKey: "tour.balance.title",
    bodyKey: "tour.balance.body",
  },
  {
    route: "/portfolio",
    anchor: "deposit",
    titleKey: "tour.deposit.title",
    bodyKey: "tour.deposit.body",
  },
  {
    route: "/market",
    anchor: "catalog",
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
    route: "/portfolio",
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
