"use client";

import { useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/en";
import type { Band, CardSide } from "@/lib/tour/geometry";

interface Props {
  /** Which end of the content band the card takes — decided once per step by the
   *  driver, from the geometry, so the card can't land on the highlight. */
  side: CardSide;
  band: Band;
  stepIndex: number;
  total: number;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  canGoBack: boolean;
  isLast: boolean;
  /** Reports the card's measured height so the driver can reserve room for it
   *  BEFORE scrolling the target — a guessed constant is how the card ended up
   *  covering the section it was describing. */
  onHeight: (h: number) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

const GAP = 12;

export function TourCard({
  side,
  band,
  stepIndex,
  total,
  titleKey,
  bodyKey,
  canGoBack,
  isLast,
  onHeight,
  onBack,
  onNext,
  onSkip,
}: Props) {
  const { t } = useT();
  const ref = useRef<HTMLDivElement>(null);

  // Before paint: the driver's scroll maths needs this height in the same frame,
  // otherwise the page visibly jumps once the real height arrives.
  useLayoutEffect(() => {
    if (ref.current) onHeight(ref.current.getBoundingClientRect().height);
  }, [onHeight, titleKey, bodyKey]);

  return (
    <motion.div
      ref={ref}
      initial={{ y: side === "bottom" ? 16 : -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-x-3 z-[60] mx-auto max-w-[420px] rounded-panel border border-ink/10 bg-paper p-4 shadow-[0_8px_28px_rgba(0,0,0,0.16)]"
      style={
        side === "bottom"
          ? { bottom: `calc(100vh - ${band.bottom}px + ${GAP}px)` }
          : { top: band.top + GAP }
      }
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] lowercase tracking-wide text-ink/40">
          {t("tour.step", { current: String(stepIndex + 1), total: String(total) })}
        </p>
        {/* Always present: taps are blocked during the tour, so the way out must
            never be more than one tap away. */}
        <button
          type="button"
          onClick={onSkip}
          aria-label={t("tour.skip")}
          className="text-ink/40 transition hover:text-ink"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      <p className="mt-2 text-[16px] leading-snug text-ink">{t(titleKey)}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink/55">{t(bodyKey)}</p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="inline-flex items-center gap-1 text-[12px] lowercase tracking-wide text-ink/45 transition hover:text-ink disabled:opacity-0"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          {t("tour.back")}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[13px] lowercase tracking-wide text-paper transition active:scale-[0.97] hover:bg-ink/85"
        >
          {t(isLast ? "tour.done" : "tour.next")}
          {isLast ? <Check size={13} strokeWidth={2} /> : <ArrowRight size={13} strokeWidth={1.5} />}
        </button>
      </div>
    </motion.div>
  );
}
