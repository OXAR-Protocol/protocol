"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useTrackedRects } from "@/hooks/use-tracked-rect";
import { useContentBand } from "@/hooks/use-content-band";
import { bandHeight, cardArea, placeCard, scrollDelta, unionBox, type CardSide } from "@/lib/tour/geometry";
import { TOUR_STEPS, anchorsOf } from "./tour-steps";
import { TourSpotlight } from "./tour-spotlight";
import { TourCard } from "./tour-card";

/** How long we'll wait for a step's anchors before going with what we have. */
const ANCHOR_TIMEOUT_MS = 2500;
/** Where the tour always lands, whether it finishes or gets cut short. */
const HOME_ROUTE = "/portfolio";
/** Only to pick the card's side before it has measured itself — see `cardArea`. */
const CARD_HEIGHT_GUESS = 190;
const GAP = 12;

/**
 * Drives the walkthrough: pushes each step's route, waits for its real
 * `data-tour` elements to mount, then lights them up and parks the card clear of
 * them.
 *
 * Anchors that never show up — a feature flag off, an empty portfolio — are
 * dropped; a step is skipped only when NONE of its anchors exist, including the
 * last one, which just ends the tour rather than hanging.
 */
export function AppTour({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const band = useContentBand();
  const [stepIndex, setStepIndex] = useState(0);
  const [targets, setTargets] = useState<HTMLElement[]>([]);
  const [cardHeight, setCardHeight] = useState(CARD_HEIGHT_GUESS);
  const boxes = useTrackedRects(targets);
  const step = TOUR_STEPS[stepIndex];

  // Both decided once per step: the side must not flip under the user, and the
  // scroll must not fight the rAF that keeps the boxes fresh.
  const sideRef = useRef<CardSide>("bottom");
  const settledFor = useRef(-1);

  const finish = useCallback(() => {
    onDone();
    router.push(HOME_ROUTE);
  }, [onDone, router]);

  const advance = useCallback(() => {
    if (stepIndex + 1 >= TOUR_STEPS.length) finish();
    else setStepIndex((i) => i + 1);
  }, [stepIndex, finish]);

  const back = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);

  // Get to the step's route first; the anchor hunt below only starts once we're there.
  useEffect(() => {
    if (step && pathname !== step.route) router.push(step.route);
  }, [step, pathname, router]);

  // Hunt for the step's anchors once we're on the right route. Settles early when
  // all of them are up, and after the timeout takes whatever did appear.
  useEffect(() => {
    if (!step || pathname !== step.route) return;
    const wanted = anchorsOf(step);
    setTargets([]);
    settledFor.current = -1;

    let cancelled = false;
    const deadline = Date.now() + ANCHOR_TIMEOUT_MS;
    let raf = 0;

    const poll = () => {
      if (cancelled) return;
      const found = wanted
        .map((a) => document.querySelector<HTMLElement>(`[data-tour="${a}"]`))
        .filter((el): el is HTMLElement => el !== null);

      if (found.length === wanted.length) {
        setTargets(found);
        return;
      }
      if (Date.now() > deadline) {
        if (found.length > 0) setTargets(found);
        else advance();
        return;
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [step, pathname, advance]);

  // Reserve the card's room FIRST, then scroll the highlight into what's left.
  // Doing it the other way round is how the card ended up sitting on top of the
  // section it was describing.
  useEffect(() => {
    if (settledFor.current === stepIndex) return;
    if (boxes.length === 0 || bandHeight(band) === 0) return;

    const union = unionBox(boxes);
    if (!union) return;

    sideRef.current = placeCard(union, band, cardHeight, GAP).side;
    const delta = scrollDelta(union, cardArea(sideRef.current, band, cardHeight, GAP), GAP);
    settledFor.current = stepIndex;
    if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: "smooth" });
  }, [boxes, band, cardHeight, stepIndex]);

  if (!step || bandHeight(band) === 0) return null;

  return (
    <>
      <TourSpotlight holes={boxes} band={band} />
      {boxes.length > 0 && (
        <TourCard
          side={sideRef.current}
          band={band}
          stepIndex={stepIndex}
          total={TOUR_STEPS.length}
          titleKey={step.titleKey}
          bodyKey={step.bodyKey}
          canGoBack={stepIndex > 0}
          isLast={stepIndex === TOUR_STEPS.length - 1}
          onHeight={setCardHeight}
          onBack={back}
          onNext={advance}
          onSkip={finish}
        />
      )}
    </>
  );
}
