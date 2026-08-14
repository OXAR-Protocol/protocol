"use client";

import { AnimatePresence, motion } from "framer-motion";

/**
 * A number that grows and shrinks a digit at a time.
 *
 * A sum typed on a keypad is the one thing on the screen, and swapping the whole
 * string on every press makes it flicker — the eye reads a new number rather than
 * the same one getting longer. So each character is its own element, keyed by
 * position: pressing a key drops one in, deleting lifts one out, and the digits
 * that didn't change never re-render.
 */
export function AnimatedAmount({
  value,
  placeholder = "0",
  className = "",
}: {
  value: string;
  /** Shown, dimmed, while nothing has been typed. */
  placeholder?: string;
  className?: string;
}) {
  const chars = (value === "" ? placeholder : value).split("");
  const empty = value === "";

  return (
    <span className={`inline-flex items-baseline ${empty ? "text-ink/25" : ""} ${className}`}>
      <AnimatePresence initial={false} mode="popLayout">
        {chars.map((ch, i) => (
          <motion.span
            // Position + character: a "5" that stays the fifth character stays put,
            // while a "5" replacing a "4" is a new element and animates.
            key={`${i}-${ch}`}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            // Leaving is a fade in place and nothing else. `layout` used to slide the
            // survivors along, so pressing keys quickly caught a digit mid-slide,
            // sitting on top of its neighbour.
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            transition={{ type: "spring", stiffness: 700, damping: 40, mass: 0.4 }}
            className="inline-block tabular-nums"
          >
            {ch}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
