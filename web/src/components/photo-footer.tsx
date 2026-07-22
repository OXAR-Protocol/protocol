"use client";

import { motion } from "framer-motion";

/**
 * Torn-paper dollar-bill eyes as a clean full-width footer at the very bottom of the
 * page — content sits ABOVE it (never overlapping, so text stays legible). The top
 * emerges from the page (white → transparent), the bottom darkens for depth, and the
 * whole thing gently fades/rises into view when the user scrolls down to it.
 */
export function PhotoFooter() {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative mt-12 mb-16 h-56 w-full select-none overflow-hidden md:mb-0 md:h-80"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/art/torn-eyes.webp"
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
      />
      {/* emerge from the page: white top melting into the photo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#ffffff_0%,rgba(255,255,255,0)_45%)]" />
      {/* subtle darkening at the very bottom for depth */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-b from-transparent to-black/20" />
    </motion.div>
  );
}
