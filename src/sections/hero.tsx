"use client";

import { motion } from "framer-motion";
import { SectionLabel } from "@/components/section-label";
import { Button } from "@/components/button";
import { FadeIn } from "@/components/fade-in";
import { scrollToWaitlist } from "@/lib/scroll-to-waitlist";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 hero-video"
        style={{
          opacity: 0.12,
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black, transparent)",
        }}
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlay for text readability */}
      <div
        className="absolute inset-0 z-10 pointer-events-none hero-overlay"
        style={{
          background: `linear-gradient(to bottom,
            #000000 0%,
            rgba(10,10,15,0.6) 30%,
            rgba(10,10,15,0.5) 50%,
            rgba(10,10,15,0.6) 70%,
            #000000 100%
          )`
        }}
      />

      {/* Subtle blue glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none z-10"
        style={{ background: "radial-gradient(circle, rgba(114,162,240,0.1), rgba(139,92,246,0.05), transparent)" }}
      />

      <div className="relative z-20 text-center max-w-3xl mx-auto pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <SectionLabel>Live on Solana · Devnet</SectionLabel>
        </motion.div>

        <motion.h1
          className="mt-6 text-[clamp(2.5rem,6vw,3.5rem)] font-sans font-normal leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Real-world yields.
          <br />
          On-chain access.
        </motion.h1>

        <FadeIn delay={0.4}>
          <p className="mt-6 font-mono text-base text-white/50 leading-relaxed max-w-xl mx-auto [&>strong]:text-white [&>strong]:font-normal">
            Emerging market government bonds — tokenized on Solana.{" "}
            <strong>No bank. No broker. Just yield.</strong>
          </p>
        </FadeIn>

        <FadeIn delay={0.6}>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap pointer-events-auto">
          <Button variant="filled" onClick={scrollToWaitlist}>
            Get Early Access
          </Button>
          <Button variant="ghost" href="#how-it-works">
            Learn more ↓
          </Button>
          </div>
        </FadeIn>

      </div>

    </section>
  );
}
