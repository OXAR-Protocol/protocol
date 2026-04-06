"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionLabel } from "@/components/section-label";

const STEPS = [
  {
    number: "01",
    title: "Sign Up",
    description:
      "Create an account with email or Google. Your wallet is created automatically — no seed phrases, no extensions.",
  },
  {
    number: "02",
    title: "Buy Assets",
    description:
      "Purchase tokenized assets with your bank card. Starting with gold — 1 ETNYG = 1 gram, backed by physical reserves.",
  },
  {
    number: "03",
    title: "Own & Track",
    description:
      "See your balance in real units and dollars. Get notified about audits, reserves status, and price movements.",
  },
  {
    number: "04",
    title: "Sell or Send",
    description:
      "Sell back to fiat instantly or send assets to anyone in seconds. Full liquidity, anytime.",
  },
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    stepRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveStep(i);
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(ref);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section id="how-it-works">
      {/* Sticky container */}
      <div className="relative" style={{ height: `${STEPS.length * 100}vh` }}>
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <div className="max-w-[1200px] mx-auto w-full px-6 flex items-center gap-12 md:gap-20">
            {/* Left — big number */}
            <div className="hidden md:flex flex-col items-start flex-shrink-0 w-[280px]">
              <SectionLabel>How It Works</SectionLabel>

              <div className="relative mt-6 h-[180px] w-full overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeStep}
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -80, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute font-mono text-[160px] font-light leading-none text-white/[0.07]"
                  >
                    {STEPS[activeStep].number}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Step indicator dots */}
              <div className="flex gap-3 mt-4">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i === activeStep
                        ? "w-8 bg-white/60"
                        : "w-3 bg-white/15"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Mobile label */}
            <div className="md:hidden absolute top-8 left-6">
              <SectionLabel>How It Works</SectionLabel>
            </div>

            {/* Right — content */}
            <div className="flex-1 relative min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {/* Mobile number */}
                  <span className="md:hidden font-mono text-7xl font-light text-white/10 block mb-4">
                    {STEPS[activeStep].number}
                  </span>

                  <div className="h-px w-16 bg-white/20 mb-6" />

                  <h3 className="font-mono text-2xl md:text-3xl uppercase tracking-wide text-white mb-6">
                    {STEPS[activeStep].title}
                  </h3>

                  <p className="font-mono text-base md:text-lg leading-relaxed text-white/40 max-w-lg">
                    {STEPS[activeStep].description}
                  </p>

                  <div className="mt-8 font-mono text-xs text-white/20 uppercase tracking-widest">
                    Step {activeStep + 1} of {STEPS.length}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Invisible scroll triggers */}
        {STEPS.map((_, i) => (
          <div
            key={i}
            ref={(el) => { stepRefs.current[i] = el; }}
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
