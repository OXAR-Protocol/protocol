"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useTrackedRect } from "@/hooks/use-tracked-rect";
import { TOUR_STEPS } from "./tour-steps";
import { TourSpotlight } from "./tour-spotlight";
import { TourCard } from "./tour-card";

/** How long we'll wait for a step's anchor to show up before giving up on it. */
const ANCHOR_TIMEOUT_MS = 2500;
/** Where the tour always lands, whether it finishes or gets cut short. */
const HOME_ROUTE = "/portfolio";

/**
 * Drives the six-step walkthrough: pushes each step's route, waits for its real
 * `data-tour` element to mount, points the spotlight at it. An anchor that
 * never shows up — a feature flag off, an empty portfolio — gets skipped
 * rather than shown pointing at nothing, including the last step, which just
 * ends the tour instead of hanging.
 */
export function AppTour({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [stepIndex, setStepIndex] = useState(0);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const rect = useTrackedRect(target);
  const step = TOUR_STEPS[stepIndex];

  const finish = useCallback(() => {
    onDone();
    router.push(HOME_ROUTE);
  }, [onDone, router]);

  const advance = useCallback(() => {
    if (stepIndex + 1 >= TOUR_STEPS.length) finish();
    else setStepIndex((i) => i + 1);
  }, [stepIndex, finish]);

  const back = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);

  // Get to the step's route first; the anchor-polling effect below only starts
  // once we're actually there.
  useEffect(() => {
    if (step && pathname !== step.route) router.push(step.route);
  }, [step, pathname, router]);

  // Poll for the anchor once we're on the right route. Skips the step if it
  // never shows up within the timeout instead of leaving the spotlight stuck.
  useEffect(() => {
    if (!step || pathname !== step.route) return;
    setTarget(null);
    let cancelled = false;
    const deadline = Date.now() + ANCHOR_TIMEOUT_MS;
    let raf = 0;

    const poll = () => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.anchor}"]`);
      if (el) {
        setTarget(el);
        return;
      }
      if (Date.now() > deadline) {
        advance();
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

  if (!step) return null;

  return (
    <>
      <TourSpotlight target={target} />
      {target && (
        <TourCard
          rect={rect}
          stepIndex={stepIndex}
          total={TOUR_STEPS.length}
          titleKey={step.titleKey}
          bodyKey={step.bodyKey}
          canGoBack={stepIndex > 0}
          isLast={stepIndex === TOUR_STEPS.length - 1}
          onBack={back}
          onNext={advance}
          onSkip={finish}
        />
      )}
    </>
  );
}
