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

/** Bracketed eyebrow label — 24px black, as in Figma. Position via className. */
export function Label({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`lowercase text-[clamp(18px,1.7vw,24px)] leading-none text-black ${className}`}
    >
      [ {children} ]
    </p>
  );
}

/** A headline line whose words spread edge-to-edge. */
export function Spread({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`flex flex-wrap justify-between gap-x-4 ${className}`}>
      {children}
    </p>
  );
}
