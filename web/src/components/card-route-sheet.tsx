"use client";

import { CreditCard } from "lucide-react";

import { cardRouteUnserved } from "@oxar/sdk";

import { SheetShell } from "@/components/sheet-shell";
import { SheetRow } from "@/components/sheet-row";
import { useCountry } from "@/hooks/use-country";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/en";

export interface CardRoute {
  key: string;
  title: TranslationKey;
  /** One line on what makes this route different — the reason to pick it. */
  body: TranslationKey;
  /** Set when the route can't run here; shown instead of the body, and unclickable.
   *  Already-translated text, because some reasons carry a number. */
  unavailable?: string;
  onSelect: () => void;
}

/**
 * Which way to pay by card.
 *
 * One entry point on the panel, the choice in here — naming vendors on the panel
 * ("pay with Paybis instead") meant nothing to someone who has never heard of them,
 * and reading as a fallback hid that it is a card payment too.
 *
 * Routes are data, so adding WhiteBIT or Guardarian after a real-card test is one
 * entry rather than another button competing for the same space.
 */
export function CardRouteSheet({ routes, onClose }: { routes: readonly CardRoute[]; onClose: () => void }) {
  const { t } = useT();
  const country = useCountry();

  return (
    <SheetShell label={t("cardroute.label")} title={t("cardroute.title")} onClose={onClose}>
      <div className="flex flex-col gap-2">
        {routes.map((route) => {
          const unserved = cardRouteUnserved(route.key, country);
          return (
            <SheetRow
              key={route.key}
              icon={CreditCard}
              title={t(route.title)}
              // One line, and the most important one: why this route can't run beats
              // what makes it different, and both beat nothing.
              body={route.unavailable ?? (unserved ? t("cardroute.notInCountry") : t(route.body))}
              badge={unserved && !route.unavailable ? t("common.soon") : undefined}
              onClick={
                route.unavailable
                  ? undefined
                  : () => {
                      onClose();
                      route.onSelect();
                    }
              }
            />
          );
        })}
      </div>

      <p className="mt-4 text-[11px] leading-snug text-ink/40">{t("cardroute.footer")}</p>
    </SheetShell>
  );
}
