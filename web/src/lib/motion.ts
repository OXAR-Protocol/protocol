"use client";

import { useCallback } from "react";
import { useReducedMotion, type Transition } from "framer-motion";

/**
 * The app's motion vocabulary.
 *
 * Colour and type have been tokenised in `globals.css` since the theme landed; motion
 * never was. Three of roughly twenty-eight transitions in the app named a curve, and
 * the only well-chosen cubic-bezier in the codebase lived on the marketing landing —
 * so the product, where the craft actually gets felt, ran on library defaults.
 *
 * These are the same values as the CSS custom properties in `globals.css`, in the form
 * framer-motion wants them. Keep the two in sync: a curve that exists twice with
 * different numbers is worse than a curve that exists once in the wrong place.
 */

/** Entering, exiting, and the default for anything that doesn't have a reason. Starts
 *  fast, so the motion reads as a response rather than as a delay. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** Seconds, because that is the unit framer-motion speaks. Mirrors `--duration-*`.
 *
 *  Both of these have callers. An `EASE_IN_OUT` and a longer `sheet` duration were
 *  drafted alongside them and then deleted unused — a vocabulary is only worth having
 *  if every word in it is spoken, and this file was written in the same change that
 *  removed five dead keyframes from `globals.css`. */
export const DURATION = {
  press: 0.16,
  fast: 0.2,
} as const;

/**
 * Four springs, where there were six.
 *
 * The app had eight spring call sites carrying six distinct configs — 32/320, 15/220,
 * 26/220, 34/420, 40/700 and 26/300 — no two of which differed enough to have been a
 * decision. Reach for one of these; if none of them fits, that is worth a conversation
 * rather than a seventh set of numbers.
 */
export const SPRING = {
  /** Sheets and drawers: settles without overshoot, because a money screen that
   *  bounces reads as a toy. */
  sheet: { type: "spring", damping: 32, stiffness: 320 },
  /** Small things that should feel instant — the tab-bar capsule, chips. */
  snappy: { type: "spring", damping: 34, stiffness: 420 },
  /** Panels and cards arriving: present, not springy. */
  soft: { type: "spring", damping: 26, stiffness: 260 },
  /** The one place visible bounce is earned — a success mark, seen once per action.
   *  Kept at its original numbers on purpose: the low damping here was a decision, not
   *  drift, and flattening it into `soft` would have quietly deleted the only moment
   *  in the app that celebrates anything. */
  celebrate: { type: "spring", damping: 15, stiffness: 220 },
  /** A single character in a number that is being typed. */
  digit: { type: "spring", damping: 40, stiffness: 700, mass: 0.4 },
} as const satisfies Record<string, Transition>;

/**
 * True when the visitor has asked their OS for less motion.
 *
 * The CSS media query in `globals.css` handles anything CSS drives. This is for the
 * decisions CSS cannot make: whether the movers carousel advances by itself at all.
 * That is not "shorter" under reduced motion — it is off.
 */
export function useAppReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}

/** Between one element of a group entrance and the next. Stagger is decorative: it
 *  must never be the reason someone is waiting to tap something. */
const STAGGER_STEP = 0.04;
const MAX_STAGGER_STEPS = 4;

/** What a `rise()` call hands to a `motion` element. */
export interface RiseProps {
  initial: { opacity: number; y?: number };
  animate: { opacity: number; y?: number };
  transition: Transition;
}

/**
 * The one entrance animation in the app.
 *
 * It existed three times over — `profile-money.tsx`, `asset-detail.tsx`, and inlined
 * across five pages — with identical values every time, which is the no-duplication
 * rule in the root CLAUDE.md broken in the most literal way available.
 *
 * It is also much faster than it was. The old 500ms with delays up to 200ms meant
 * content landed 600-700ms after a tab tap, and because app-router navigation unmounts
 * the page, that replayed on every single switch between `/you` and `/market`. At that
 * frequency the rule is to remove or drastically reduce; 200ms is the reduction, and
 * the stagger is capped at 40ms so a group entrance still reads as a group without
 * anyone waiting on it.
 *
 * Under reduced motion the travel goes away and the fade stays — you still see that
 * something arrived, it just doesn't fly.
 */
export function useRise(): (step?: number) => RiseProps {
  const reduced = useAppReducedMotion();

  return useCallback(
    (step = 0) => ({
      initial: { opacity: 0, ...(reduced ? {} : { y: 12 }) },
      animate: { opacity: 1, ...(reduced ? {} : { y: 0 }) },
      transition: {
        duration: reduced ? 0.12 : DURATION.fast,
        ease: EASE_OUT,
        // A step index, not a number of seconds — call sites say "I am third", and the
        // helper decides what third is worth. The previous arrangement let each page
        // hand-pick a delay, which is how one of them ended up spending 440ms before
        // its last element started. Capped at four steps: past that a stagger has
        // stopped grouping anything and is just charging the last item rent.
        delay: reduced ? 0 : Math.min(step, MAX_STAGGER_STEPS) * STAGGER_STEP,
      },
    }),
    [reduced],
  );
}
