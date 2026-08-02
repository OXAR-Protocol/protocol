"use client";

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, ChevronRight } from "lucide-react";

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

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-no-pull
      className="fixed inset-0 z-[60] flex items-center justify-center bg-white/70 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-full w-full max-w-[400px] overflow-y-auto rounded-[12px] border border-black/15 bg-white p-6"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[10px] lowercase tracking-[0.2em] text-black/40">{t("cardroute.label")}</p>
            <h2 className="mt-1 text-xl text-black">{t("cardroute.title")}</h2>
          </div>
          <button onClick={onClose} className="text-black/45 transition hover:text-black">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-2">
          {routes.map((route) => (
            <button
              key={route.key}
              onClick={() => {
                if (route.unavailable) return;
                onClose();
                route.onSelect();
              }}
              disabled={!!route.unavailable}
              className="flex w-full items-center gap-3 rounded-[10px] border border-black/15 px-4 py-3 text-left transition enabled:hover:border-black/40 disabled:opacity-45"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] text-black">{t(route.title)}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-black/50">
                  {route.unavailable ?? t(route.body)}
                </span>
              </span>
              {!route.unavailable && (
                <ChevronRight size={16} strokeWidth={1.5} className="shrink-0 text-black/30" />
              )}
            </button>
          ))}
        </div>

        <p className="mt-4 text-[11px] leading-snug text-black/40">{t("cardroute.footer")}</p>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
