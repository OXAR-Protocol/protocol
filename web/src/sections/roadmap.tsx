"use client";

import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";
import { AnimatedSection } from "@/components/animated-section";
import { useAnimatedProgress } from "@/hooks/use-animated-progress";

const MILESTONES = [
  {
    phase: "Now",
    name: "Building",
    details: "Smart contracts live on devnet. Auto-distribute and group vaults under construction.",
    status: "current" as const,
  },
  {
    phase: "Aug 2026",
    name: "MVP launch",
    details: "Personal yield + group piles + Apple Pay deposits. First friend groups onboard.",
    status: "future" as const,
  },
  {
    phase: "Q4 2026",
    name: "More yields, more rules",
    details: "Cross-chain via Delora. Buffer top-up, round-ups, copy-investing. Ukrainian bonds via partner broker.",
    status: "future" as const,
  },
  {
    phase: "2027",
    name: "Native app + scale",
    details: "iOS and Android. Multi-currency. Emerging market bonds beyond Ukraine.",
    status: "future" as const,
  },
];

const CURRENT_INDEX = 0;
const PROGRESS_PCT = ((CURRENT_INDEX + 0.5) / MILESTONES.length) * 100;

export function Roadmap() {
  const progress = useAnimatedProgress(PROGRESS_PCT);

  return (
    <section id="roadmap" className="py-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection>
          <SectionLabel>What's ahead</SectionLabel>
          <SectionTitle>From devnet to your phone</SectionTitle>
        </AnimatedSection>

        {/* Desktop */}
        <div className="mt-16 hidden md:block" ref={progress.ref}>
          {/* Progress bar */}
          <div className="relative h-px bg-white/10 mb-12">
            {/* Filled portion */}
            <div
              className="absolute top-0 left-0 h-full transition-all ease-out"
              style={{
                width: `${progress.width}%`,
                background: "linear-gradient(90deg, rgba(139,92,246,0.8), rgba(139,92,246,0.8))",
                boxShadow: "0 0 12px rgba(139,92,246,0.4), 0 0 30px rgba(139,92,246,0.15)",
                transitionDuration: "1.5s",
              }}
            />

            {/* Milestone dots */}
            {MILESTONES.map((m, i) => {
              const left = (i / (MILESTONES.length - 1)) * 100;
              const isPast = i < CURRENT_INDEX;
              const isCurrent = i === CURRENT_INDEX;

              return (
                <div
                  key={m.phase}
                  className="absolute -top-[5px]"
                  style={{ left: `${left}%`, transform: "translateX(-50%)" }}
                >
                  <div
                    className={`w-[13px] h-[13px] rounded-full border-2 transition-all duration-700 ${
                      isCurrent
                        ? "border-accent bg-accent/30 shadow-[0_0_12px_rgba(139,92,246,0.5)]"
                        : isPast
                        ? "border-accent/50 bg-accent/10"
                        : "border-white/15 bg-surface-0"
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Labels */}
          <div className="grid grid-cols-4 gap-8">
            {MILESTONES.map((m, i) => {
              const isCurrent = i === CURRENT_INDEX;
              const isPast = i < CURRENT_INDEX;

              return (
                <AnimatedSection key={m.phase} delay={i * 0.12}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-xs uppercase tracking-wide ${
                          isCurrent ? "text-accent" : isPast ? "text-accent/50" : "text-white/30"
                        }`}
                      >
                        {m.phase}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 font-mono text-[10px] text-accent uppercase tracking-wider">
                          Now
                        </span>
                      )}
                    </div>
                    <h3 className={`mt-2 font-sans text-lg ${isCurrent ? "text-white" : "text-white/60"}`}>
                      {m.name}
                    </h3>
                    <p className="mt-2 font-mono text-sm text-white/30 leading-relaxed">
                      {m.details}
                    </p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>

        {/* Mobile */}
        <div className="mt-16 md:hidden">
          {/* Vertical progress */}
          <div className="relative pl-8">
            {/* Track */}
            <div className="absolute left-[5px] top-0 bottom-0 w-px bg-white/10">
              <div
                className="w-full transition-all ease-out"
                style={{
                  height: `${PROGRESS_PCT}%`,
                  background: "linear-gradient(180deg, rgba(139,92,246,0.8), rgba(139,92,246,0.8))",
                  boxShadow: "0 0 10px rgba(139,92,246,0.3)",
                  transitionDuration: "1.5s",
                }}
              />
            </div>

            <div className="space-y-8">
              {MILESTONES.map((m, i) => {
                const isCurrent = i === CURRENT_INDEX;
                const isPast = i < CURRENT_INDEX;

                return (
                  <AnimatedSection key={m.phase} delay={i * 0.1}>
                    <div className="relative flex gap-4 items-start">
                      {/* Dot */}
                      <div
                        className={`absolute -left-8 mt-1 w-[13px] h-[13px] rounded-full border-2 ${
                          isCurrent
                            ? "border-accent bg-accent/30 shadow-[0_0_12px_rgba(139,92,246,0.5)]"
                            : isPast
                            ? "border-accent/50 bg-accent/10"
                            : "border-white/15 bg-surface-0"
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-xs uppercase tracking-wide ${
                              isCurrent ? "text-accent" : "text-white/30"
                            }`}
                          >
                            {m.phase}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 font-mono text-[10px] text-accent uppercase tracking-wider">
                              Now
                            </span>
                          )}
                        </div>
                        <h3 className={`mt-1 font-sans text-lg ${isCurrent ? "text-white" : "text-white/60"}`}>
                          {m.name}
                        </h3>
                        <p className="mt-1 font-mono text-sm text-white/30 leading-relaxed">
                          {m.details}
                        </p>
                      </div>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
