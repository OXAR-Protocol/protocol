"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { useSolanaContext } from "@/providers/solana-provider";
import { useT } from "@/lib/i18n";
import { acceptTerms } from "@/lib/terms";
import { AppTour } from "@/components/tour/app-tour";

/**
 * Once per WALLET, not once per browser. The old single key meant a second person on
 * the same device never saw it, and — the reported bug — it could show before there
 * was a wallet at all, so it reappeared once one existed.
 */
const seenKey = (owner: string) => `oxar:intro-seen:${owner}`;

/**
 * True the first time a given wallet opens the app.
 *
 * Deliberately waits for the wallet: a welcome shown before someone has an account
 * explains a product they can't yet use, and it was then shown AGAIN once the wallet
 * appeared — which is the duplicate that got reported.
 */
export function useIntro(): { show: boolean; dismiss: () => void; acknowledgeTerms: () => void } {
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

  // Explicit notice (the terms line + link on the card) + this affirmative act
  // is the acceptance record — fire-and-forget, and never blocks either action
  // it's attached to. See `lib/terms.ts` for what this is and isn't.
  const acknowledgeTerms = () => {
    if (owner) acceptTerms(owner);
  };

  const dismiss = () => {
    setShow(false);
    acknowledgeTerms();
    if (!owner) return;
    try {
      localStorage.setItem(seenKey(owner), "1");
    } catch {
      // Can't remember it? Then it shows again — annoying, never broken.
    }
  };

  return { show, dismiss, acknowledgeTerms };
}

/**
 * First-run welcome: one photo, the pitch, and a choice — walk through the real
 * app or skip straight in. Replaces the old 4-slide carousel of pitch-deck
 * photos: a real tour of the actual screens (see `AppTour`) teaches
 * the product better than photos of money ever did, and it can't go stale the
 * way a screenshot does the moment a button moves.
 *
 * Dismissing the welcome card OR finishing/skipping the tour both mark the
 * wallet as seen — either way, the user has been shown the app. The card also
 * carries the only notice of /terms a new wallet gets, and either action here
 * (skip or start the tour) fires the best-effort acceptance record — see
 * `useIntro`'s `acknowledgeTerms` and `lib/terms.ts`.
 */
export function IntroModal() {
  const { t } = useT();
  const { show, dismiss, acknowledgeTerms } = useIntro();
  const [touring, setTouring] = useState(false);

  const finishTour = () => {
    setTouring(false);
    dismiss();
  };

  // Starting the tour is itself the affirmative act — record it now rather
  // than waiting for the tour to finish (dismiss() there would also cover it,
  // but someone can navigate away mid-tour without ever calling it).
  const startTour = () => {
    acknowledgeTerms();
    setTouring(true);
  };

  if (touring) return <AppTour onDone={finishTour} />;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-full max-w-[440px] overflow-hidden rounded-t-[20px] border border-black/10 bg-white sm:rounded-[20px]"
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label={t("intro.skip")}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/70 p-1.5 text-black/45 backdrop-blur transition hover:text-black"
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            <div className="relative h-[240px] w-full overflow-hidden bg-[#faf9f7]">
              <img
                src="/art/intro/sleeping-money.webp"
                alt=""
                aria-hidden
                className="h-full w-full select-none object-cover"
              />
              {/* The image melts into the card rather than ending on a hard seam. */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-white" />
            </div>

            <div className="px-6 pb-6 pt-2">
              <p className="text-[19px] leading-snug text-black">{t("intro.headline")}</p>
              <p className="mt-2 text-[14px] leading-relaxed text-black/55">{t("intro.body")}</p>
              <p className="mt-3 text-[11px] leading-relaxed text-black/35">
                {t("intro.termsPrefix")}{" "}
                {/* /terms is a marketing route (see middleware.ts) that only resolves on
                 *  oxar.app, not app.oxar.app — an absolute URL + hard navigation, not
                 *  next/link, so it actually lands instead of hitting the domain-split
                 *  redirect mid client-side transition. Opens in a new tab so reading it
                 *  doesn't blow away the welcome card / tour state in this one. */}
                <a
                  href="https://oxar.app/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-black/20 underline-offset-2 hover:text-black/60"
                >
                  {t("intro.termsLink")}
                </a>
              </p>

              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-[12px] lowercase tracking-wide text-black/40 transition hover:text-black"
                >
                  {t("intro.skip")}
                </button>
                <button
                  type="button"
                  onClick={startTour}
                  className="rounded-full bg-black px-5 py-2.5 text-[13px] lowercase tracking-wide text-white transition hover:bg-black/85"
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
