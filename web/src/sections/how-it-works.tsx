"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { SectionLabel } from "@/components/section-label";
import { IsometricBoxes } from "@/components/isometric-boxes";
import {
  STEPS,
  ARC_RADIUS,
  ARC_CENTER_Y_RATIO,
  getArcCenterX,
  getArcPosition,
  getMarkerStyle,
} from "@/lib/how-it-works-arc";

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [screenH, setScreenH] = useState(800);
  const [screenW, setScreenW] = useState(1200);
  const sectionRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const arcCenterX = getArcCenterX(screenW);

  useEffect(() => {
    const measure = () => {
      setScreenH(window.innerHeight);
      setScreenW(window.innerWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Scroll drives a continuous progress (0..n-1); the wheel rotates smoothly.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
      const t = scrollable > 0 ? scrolled / scrollable : 0;
      const progress = t * (STEPS.length - 1);

      const cx = getArcCenterX(window.innerWidth);
      STEPS.forEach((_, i) => {
        const node = markerRefs.current[i];
        if (!node) return;
        const pos = getArcPosition(i, progress, window.innerHeight, cx);
        const s = getMarkerStyle(i - progress);
        node.style.left = `${pos.x}px`;
        node.style.top = `${pos.y}px`;
        node.style.opacity = String(s.opacity);
        node.style.setProperty("--fr", `${s.fontRem}rem`);
        node.style.setProperty("--ds", String(s.dotScale));
      });

      const next = Math.round(progress);
      setActiveStep((prev) => (prev === next ? prev : next));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="how-it-works">
      <div ref={sectionRef} className="relative" style={{ height: `${STEPS.length * 100}vh` }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          <IsometricBoxes className="opacity-30 pointer-events-none" />

          <div className="pointer-events-none absolute inset-x-0 top-8 z-20 mx-auto max-w-[1200px] px-6">
            <SectionLabel>How It Works</SectionLabel>
          </div>

          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ overflow: "visible" }}
          >
            <circle
              cx={arcCenterX}
              cy={screenH * ARC_CENTER_Y_RATIO}
              r={ARC_RADIUS}
              fill="none"
              className="arc-line"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          </svg>

          {STEPS.map((step, i) => (
            <div
              key={step.number}
              ref={(el) => {
                markerRefs.current[i] = el;
              }}
              className="absolute pointer-events-none will-change-[left,top,opacity]"
            >
              <div className="-translate-x-1/2 -translate-y-1/2 flex items-center gap-4">
                <span
                  className="block rounded-full bg-white"
                  style={{ width: "calc(12px * var(--ds, 1))", height: "calc(12px * var(--ds, 1))" }}
                />
                <span
                  className="font-mono font-light leading-none text-white"
                  style={{ fontSize: "var(--fr, 2rem)" }}
                >
                  {step.number}
                </span>
              </div>
            </div>
          ))}

          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto flex max-w-[1200px] justify-end px-6">
            <div className="w-[min(400px,50vw)]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="h-px w-12 bg-white/20 mb-6" />

                  <h3 className="font-mono text-xl md:text-2xl lg:text-3xl uppercase tracking-wide text-white mb-4">
                    {STEPS[activeStep].title}
                  </h3>

                  <p className="font-mono text-sm md:text-base leading-relaxed text-white/40">
                    {STEPS[activeStep].description}
                  </p>

                  <div className="mt-6 font-mono text-xs text-white/20 uppercase tracking-widest">
                    Step {activeStep + 1} of {STEPS.length}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === activeStep ? "w-8 bg-white/60" : "w-3 bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
