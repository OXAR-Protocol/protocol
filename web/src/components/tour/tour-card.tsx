"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/en";

interface Props {
  /** Null for one frame while the tracked rect catches up to a fresh target. */
  rect: DOMRect | null;
  stepIndex: number;
  total: number;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  canGoBack: boolean;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

const CARD_WIDTH = 320;
const MARGIN = 16;

/** Below the cut-out if there's more room there, else above it — so the card
 *  never lands on top of the thing it's explaining. Desktop only; mobile is
 *  always a bottom sheet regardless of where the target sits. */
function desktopPosition(rect: DOMRect): { left: number; top?: number; bottom?: number } {
  const spaceBelow = window.innerHeight - rect.bottom;
  const left = Math.min(Math.max(rect.left, MARGIN), window.innerWidth - CARD_WIDTH - MARGIN);
  return spaceBelow >= rect.top
    ? { left, top: rect.bottom + MARGIN }
    : { left, bottom: window.innerHeight - rect.top + MARGIN };
}

export function TourCard({
  rect,
  stepIndex,
  total,
  titleKey,
  bodyKey,
  canGoBack,
  isLast,
  onBack,
  onNext,
  onSkip,
}: Props) {
  const { t } = useT();

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] lowercase tracking-wide text-black/40">
          {t("tour.step", { current: String(stepIndex + 1), total: String(total) })}
        </p>
        <button
          type="button"
          onClick={onSkip}
          aria-label={t("tour.skip")}
          className="text-black/40 transition hover:text-black"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
      <p className="mt-2 text-[16px] leading-snug text-black">{t(titleKey)}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-black/55">{t(bodyKey)}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="inline-flex items-center gap-1 text-[12px] lowercase tracking-wide text-black/45 transition hover:text-black disabled:opacity-0"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          {t("tour.back")}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-[13px] lowercase tracking-wide text-white transition hover:bg-black/85"
        >
          {t(isLast ? "tour.done" : "tour.next")}
          {isLast ? <Check size={13} strokeWidth={2} /> : <ArrowRight size={13} strokeWidth={1.5} />}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile: bottom sheet, above the tab bar and the home indicator. */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        className="fixed inset-x-3 z-[60] rounded-[16px] border border-black/10 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.16)] sm:hidden"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        {body}
      </motion.div>

      {/* Desktop: floats beside the cut-out. */}
      {rect && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed z-[60] hidden w-[320px] rounded-[16px] border border-black/10 bg-white p-4 shadow-[0_8px_28px_rgba(0,0,0,0.16)] sm:block"
          style={desktopPosition(rect)}
        >
          {body}
        </motion.div>
      )}
    </>
  );
}
