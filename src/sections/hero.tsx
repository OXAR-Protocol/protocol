"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { SectionLabel } from "@/components/section-label";
import { Button } from "@/components/button";
import { FadeIn } from "@/components/fade-in";

const LogoParticles = dynamic(
  () => import('@/components/3d/logo-particles').then((mod) => mod.LogoParticles),
  { ssr: false }
)

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* Outer grid with radial fade */}
      <div
        className="absolute inset-0 hero-grid-outer"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: 0.8,
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black, transparent)',
        }}
      />

      {/* Inner grid with accent tint */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(114,162,240,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(114,162,240,0.06) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          opacity: 0.6,
          maskImage: 'radial-gradient(ellipse 50% 40% at 50% 45%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 50% 40% at 50% 45%, black, transparent)',
        }}
      />

      {/* 3D Logo Particles */}
      <div className="absolute inset-0 z-10">
        <LogoParticles />
      </div>

      {/* Gradient overlay for text readability */}
      <div
        className="absolute inset-0 z-20 pointer-events-none hero-overlay"
        style={{
          background: `linear-gradient(to bottom,
            #0a0a0a 0%,
            rgba(10,10,15,0.8) 30%,
            rgba(10,10,15,0.85) 45%,
            rgba(10,10,15,0.85) 55%,
            rgba(10,10,15,0.8) 70%,
            #0a0a0a 100%
          )`
        }}
      />

      {/* Golden glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/15 blur-[120px] animate-breathing pointer-events-none" />

      <div className="relative z-30 text-center max-w-3xl mx-auto pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <SectionLabel>Real World Assets</SectionLabel>
        </motion.div>

        <motion.h1
          className="mt-6 text-[clamp(2.5rem,6vw,3.5rem)] font-sans font-normal leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Own real assets.
          <br />
          Digitally.
        </motion.h1>

        <FadeIn delay={0.4}>
          <p className="mt-6 font-mono text-base text-white/50 leading-relaxed max-w-xl mx-auto [&>strong]:text-white [&>strong]:font-normal">
            <strong>Buy, sell, and send</strong> real-world assets in seconds.{" "}
            Gold first, then more. <strong>Backed by physical reserves.</strong> Starting from $5.
          </p>
        </FadeIn>

        <FadeIn delay={0.6}>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap pointer-events-auto">
          <Button variant="filled" href="#">
            Launch App
          </Button>
          <Button variant="ghost" href="#how-it-works">
            Learn more ↓
          </Button>
          </div>
        </FadeIn>

      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce-slow">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="hero-scroll-indicator"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
