"use client";

import { cn } from "@/lib/utils";

/**
 * A placeholder in the shape of the thing that is coming.
 *
 * The app had fifteen loading states drawn as a centred spinner and one drawn as a
 * skeleton. A spinner says "wait" and reserves nothing, so the moment the data lands
 * the section snaps to its real height and everything under it jumps — which is the
 * jarring state change that motion is supposed to prevent, arriving instead because
 * of it. Where the geometry is known before the data is, draw the geometry.
 *
 * The pulse is a plain CSS animation, so the reduced-motion block in `globals.css`
 * already stops it without this component knowing anything about that.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("animate-pulse rounded-card bg-ink/[0.06]", className)} />
  );
}

/** The positions list, before it knows what is in it. Three rows, because that is
 *  about what fits before the fold and guessing high would push real content down. */
export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2" aria-busy>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[76px] w-full" />
      ))}
    </div>
  );
}
