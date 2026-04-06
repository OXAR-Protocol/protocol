"use client";

import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";
import { AnimatedSection } from "@/components/animated-section";
import { NodeVisualization } from "@/components/node-visualization";
import { IsometricBoxes } from "@/components/isometric-boxes";

const BLOCKS = [
  {
    title: "MPC Resharing",
    description: (
      <>
        Wallet ownership transfers via <strong>key resharing</strong>, not
        blockchain transactions. The private key is split into shards —{" "}
        <strong>it never exists in whole form</strong>.
      </>
    ),
  },
  {
    title: "TEE Enclaves",
    description: (
      <>
        Each node runs inside a <strong>hardware-isolated enclave</strong>{" "}
        (Intel SGX / AWS Nitro). Shards are{" "}
        <strong>sealed in silicon</strong> — not even node operators can
        access them.
      </>
    ),
  },
  {
    title: "Shamir 3-of-5",
    description: (
      <>
        Server-side shard is split into <strong>5 sub-shards</strong> across
        independent nodes. Any <strong>3 are sufficient</strong> to operate.
        No single point of failure.
      </>
    ),
  },
];

export function Security() {
  return (
    <section id="security" className="py-32 px-6 overflow-hidden relative">
      <IsometricBoxes className="opacity-40" />
      <div className="max-w-[1200px] mx-auto relative z-10">
        <AnimatedSection>
          <SectionLabel>Security</SectionLabel>
          <SectionTitle>Built on zero trust</SectionTitle>
        </AnimatedSection>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-16 items-center">
          <div className="space-y-0">
            {BLOCKS.map((block, i) => (
              <AnimatedSection key={block.title} delay={i * 0.15}>
                <div
                  className={`py-8 ${
                    i < BLOCKS.length - 1 ? "border-b border-white/10" : ""
                  }`}
                >
                  <h3 className="font-mono text-base uppercase tracking-wide text-white mb-3">
                    {block.title}
                  </h3>
                  <p className="font-mono text-sm leading-relaxed text-white/50 max-w-lg [&>strong]:text-white [&>strong]:font-normal">
                    {block.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection delay={0.3} className="hidden lg:block">
            <NodeVisualization />
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
