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
  getStepStyle,
} from "@/lib/how-it-works-arc";

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [screenH, setScreenH] = useState(800);
  const [screenW, setScreenW] = useState(1200);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const arcCenterX = getArcCenterX(screenW);

  useEffect(() => {
    setScreenH(window.innerHeight);
    setScreenW(window.innerWidth);
    const onResize = () => {
      setScreenH(window.innerHeight);
      setScreenW(window.innerWidth);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    stepRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveStep(i);
        },
        { threshold: 0.5 },
      );
      observer.observe(ref);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section id="how-it-works">
      <div className="relative" style={{ height: `${STEPS.length * 100}vh` }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          <IsometricBoxes className="opacity-30 pointer-events-none" />

          <div className="absolute top-8 left-6 md:left-12 z-20">
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

          {STEPS.map((step, i) => {
            const pos = getArcPosition(i, activeStep, screenH, arcCenterX);
            const offset = i - activeStep;
            const style = getStepStyle(offset);

            return (
              <div key={step.number}>
                <motion.div
                  className="absolute pointer-events-none"
                  animate={{ left: pos.x, top: pos.y, opacity: style.opacity }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div
                    className={`-translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500 ${
                      offset === 0
                        ? "w-3 h-3 bg-white/80 arc-dot"
                        : "w-2 h-2 bg-white/25 arc-dot-inactive"
                    }`}
                  />
                </motion.div>

                <motion.div
                  className="absolute pointer-events-none"
                  animate={{
                    left: pos.x + 16,
                    top: pos.y,
                    scale: style.scale,
                    opacity: style.opacity,
                  }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: "left center" }}
                >
                  <span
                    className="font-mono font-light text-white arc-number block -translate-y-1/2"
                    style={{ fontSize: style.fontSize }}
                  >
                    {step.number}
                  </span>
                </motion.div>
              </div>
            );
          })}

          <div className="absolute top-1/2 -translate-y-1/2 right-6 md:right-12 lg:right-[10%] w-[min(400px,50vw)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
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

        {STEPS.map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            className="absolute w-full"
            style={{
              top: `${i * (100 / STEPS.length)}%`,
              height: `${100 / STEPS.length}%`,
            }}
          />
        ))}
      </div>
    </section>
  );
}
