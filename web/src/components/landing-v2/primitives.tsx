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

/** Shared editorial headline scale (Figma node 193:164 — the problem header). */
export const HEADLINE =
  "lowercase text-[clamp(34px,6.8vw,72px)] leading-[1.04] tracking-[-0.07em]";

/** Section header in the "problem" style: bracket label + big statement. */
export function SectionHead({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Reveal>
        <Label className="text-black/45">{label}</Label>
      </Reveal>
      <Reveal delay={0.05}>
        <div className={`mt-8 ${HEADLINE}`}>{children}</div>
      </Reveal>
    </>
  );
}

/** A headline line whose words spread edge-to-edge, e.g. "we  break  the  tradeoff". */
export function Spread({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex flex-wrap justify-between gap-x-4">{children}</p>
  );
}
