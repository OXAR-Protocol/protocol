"use client";

import { motion } from "framer-motion";
import { SectionLabel } from "@/components/section-label";
import { BondCertificate } from "@/components/waitlist/bond-certificate";

export function Waitlist() {
  return (
    <section
      id="waitlist"
      className="relative px-6 py-24 md:py-32 scroll-mt-16 overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[140px] pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(circle, rgba(114,162,240,0.08), rgba(139,92,246,0.04), transparent)",
        }}
      />

      <div className="max-w-[1100px] mx-auto flex flex-col items-center gap-4 text-center mb-12 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <SectionLabel>Early Access · Limited Allocation</SectionLabel>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="font-sans font-normal text-[clamp(2rem,5vw,3rem)] leading-[1.1] text-white max-w-[760px]"
        >
          Reserve your place.
          <br />
          <span className="text-white/60">Stamp the bond.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-2 font-mono text-sm text-white/45 max-w-[520px] leading-relaxed"
        >
          Fill the certificate. Move the slider to the allocation you&apos;d
          deploy at launch. Press the seal — your spot is locked.
        </motion.p>
      </div>

      <BondCertificate />
    </section>
  );
}
