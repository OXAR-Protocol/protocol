"use client";

import { motion } from "framer-motion";

/** Fade + lift on scroll into view. Restrained, single-shot. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/** Bracketed eyebrow label, e.g. `[ the problem ]`. */
export function Label({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`lowercase text-[clamp(13px,1.1vw,16px)] tracking-[0.02em] ${className}`}
    >
      [ {children} ]
    </span>
  );
}
