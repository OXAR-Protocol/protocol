"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { useSolanaContext } from "@/providers/solana-provider";
import { useT } from "@/lib/i18n";
import { LanguageChips } from "@/components/language-picker";
import { AppTour } from "@/components/tour/app-tour";

/**
 * Once per WALLET, not once per browser. The old single key meant a second person on
 * the same device never saw it, and — the reported bug — it could show before there
 * was a wallet at all, so it reappeared once one existed.
 */
const seenKey = (owner: string) => `oxar:intro-seen:${owner}`;

/**
 * Forget that this wallet has seen the welcome, so it runs again.
 *
 * Exposed because "watch it again" is a fair thing to want — the walkthrough is
 * the only place several features are explained, and someone who skipped it on
 * day one shouldn't have to clear browser storage by hand to get it back.
 */
export function forgetIntro(owner: string): void {
  try {
    localStorage.removeItem(seenKey(owner));
  } catch {
    // Storage blocked: nothing was remembered, so there is nothing to forget.
  }
}

/**
 * True the first time a given wallet opens the app.
 *
 * Deliberately waits for the wallet: a welcome shown before someone has an account
 * explains a product they can't yet use, and it was then shown AGAIN once the wallet
 * appeared — which is the duplicate that got reported.
 */
export function useIntro(): { show: boolean; dismiss: () => void } {
  const { walletAddress } = useSolanaContext();
  const owner = walletAddress?.toBase58() ?? null;
  // Never during render: reading storage there makes the component impure and
  // flashes the modal on every navigation before hydration settles.
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!owner) {
      setShow(false);
      return;
    }
    try {
      if (!localStorage.getItem(seenKey(owner))) setShow(true);
    } catch {
      // Private mode / storage blocked — skip the intro rather than loop it.
    }
  }, [owner]);

  const dismiss = () => {
    setShow(false);
    if (!owner) return;
    try {
      localStorage.setItem(seenKey(owner), "1");
    } catch {
      // Can't remember it? Then it shows again — annoying, never broken.
    }
  };

  return { show, dismiss };
}

/**
 * First-run welcome: one photo, the pitch, and a choice — walk through the real
 * app or skip straight in. Replaces the old 4-slide carousel of pitch-deck
 * photos: a real tour of the actual screens (see `AppTour`) teaches
 * the product better than photos of money ever did, and it can't go stale the
 * way a screenshot does the moment a button moves.
 *
 * Dismissing the welcome card OR finishing/skipping the tour both mark the
 * wallet as seen — either way, the user has been shown the app. Terms
 * acceptance is a separate, earlier gate (`TermsAndIntroGate` mounts it
 * before this component ever runs) — this card no longer carries any terms
 * notice of its own.
 */
export function IntroModal() {
  const { t } = useT();
  const { show, dismiss } = useIntro();
  const [touring, setTouring] = useState(false);

  const finishTour = () => {
    setTouring(false);
    dismiss();
  };

  const startTour = () => setTouring(true);

  if (touring) return <AppTour onDone={finishTour} />;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-no-pull
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/30 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-full max-w-[440px] overflow-hidden rounded-t-[20px] border border-ink/10 bg-paper sm:rounded-[20px]"
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label={t("intro.skip")}
              className="absolute right-3 top-3 z-10 rounded-full bg-paper/70 p-1.5 text-ink/45 backdrop-blur transition hover:text-ink"
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            {/* Language is choosable up to here; the tour itself just follows it. */}
            <div className="absolute left-3 top-3 z-10 rounded-full bg-paper/70 p-1 backdrop-blur">
              <LanguageChips />
            </div>

            <div className="relative h-[240px] w-full overflow-hidden bg-page">
              <img
                src="/art/intro/sleeping-money.webp"
                alt=""
                aria-hidden
                className="h-full w-full select-none object-cover"
              />
              {/* The image melts into the card rather than ending on a hard seam. */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-paper" />
            </div>

            <div className="px-6 pb-6 pt-2">
              <p className="text-[19px] leading-snug text-ink">{t("intro.headline")}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-ink/55">{t("intro.body")}</p>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-[12px] lowercase tracking-wide text-ink/40 transition hover:text-ink"
                >
                  {t("intro.skip")}
                </button>
                <button
                  type="button"
                  onClick={startTour}
                  className="rounded-full bg-ink px-5 py-2.5 text-[13px] lowercase tracking-wide text-paper transition hover:bg-ink/85"
                >
                  {t("intro.showMeAround")}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
