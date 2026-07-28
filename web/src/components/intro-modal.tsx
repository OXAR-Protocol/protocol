"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { useT } from "@/lib/i18n";

/** Shown once per browser. A tour you can't dismiss is an obstacle, not a welcome. */
const SEEN_KEY = "oxar:intro-seen";

/**
 * The collage the pitch deck is built from, rather than screenshots of our own
 * screens. Screenshots go stale the moment a button moves, and they explain the
 * furniture instead of the idea — these say what the thing is FOR.
 *
 * Served from `art/intro`, not `pitch/collage`: the deck's PNGs are print-weight
 * (6.9 MB across these four) and this is the very first thing a new user waits for,
 * often on a phone. Same pictures at 880px WebP — 300 KB for the set.
 */
const SLIDES = [
  { img: "/art/intro/sleeping-money.webp", key: "intro.1" },
  { img: "/art/intro/coin-stack.webp", key: "intro.2" },
  { img: "/art/intro/crowd-world.webp", key: "intro.3" },
  { img: "/art/intro/grasping-hands.webp", key: "intro.4" },
] as const;

/** True the first time this browser opens the app. */
export function useIntro(): { show: boolean; dismiss: () => void } {
  // Never during render: reading storage there makes the component impure and
  // flashes the modal on every navigation before hydration settles.
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setShow(true);
    } catch {
      // Private mode / storage blocked — skip the intro rather than loop it.
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Can't remember it? Then it shows again — annoying, never broken.
    }
  };

  return { show, dismiss };
}

export function IntroModal() {
  const { t } = useT();
  const { show, dismiss } = useIntro();
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;

  // Fetch the next picture while this one is being read, so advancing never shows
  // an empty frame.
  useEffect(() => {
    const next = SLIDES[i + 1];
    if (next) new Image().src = next.img;
  }, [i]);

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
            {/* Skip is present on every slide, not hidden behind the last one. */}
            <button
              type="button"
              onClick={dismiss}
              aria-label={t("intro.skip")}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/70 p-1.5 text-black/45 backdrop-blur transition hover:text-black"
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            <div className="relative h-[240px] w-full overflow-hidden bg-[#faf9f7]">
              <AnimatePresence mode="wait">
                <motion.img
                  key={SLIDES[i]!.img}
                  src={SLIDES[i]!.img}
                  alt=""
                  aria-hidden
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="h-full w-full select-none object-cover"
                />
              </AnimatePresence>
              {/* The image melts into the card rather than ending on a hard seam. */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-white" />
            </div>

            <div className="px-6 pb-6 pt-2">
              <AnimatePresence mode="wait">
                <motion.p
                  key={SLIDES[i]!.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="min-h-[64px] text-[17px] leading-snug text-black"
                >
                  {t(`${SLIDES[i]!.key}` as "intro.1")}
                </motion.p>
              </AnimatePresence>

              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  {SLIDES.map((s, n) => (
                    <span
                      key={s.key}
                      className={`h-1.5 rounded-full transition-all ${
                        n === i ? "w-5 bg-black" : "w-1.5 bg-black/15"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  {!last && (
                    <button
                      type="button"
                      onClick={dismiss}
                      className="text-[12px] lowercase tracking-wide text-black/40 transition hover:text-black"
                    >
                      {t("intro.skip")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => (last ? dismiss() : setI((n) => n + 1))}
                    className="rounded-full bg-black px-5 py-2.5 text-[13px] lowercase tracking-wide text-white transition hover:bg-black/85"
                  >
                    {t(last ? "intro.start" : "intro.next")}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
