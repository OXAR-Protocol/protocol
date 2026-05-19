import type { Metadata } from "next";

import { SectionLabel } from "@/components/section-label";

import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard — OXAR Radar",
  description: "Manage your OXAR Radar API keys and view usage.",
};

export default function DashboardPage() {
  return (
    <main className="relative min-h-screen px-6 pb-20 pt-24">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10" />
      <div
        className="pointer-events-none absolute left-1/2 top-32 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.10), rgba(139,92,246,0.03), transparent)",
        }}
      />

      <div className="mx-auto max-w-3xl">
        <SectionLabel>Dashboard</SectionLabel>
        <h1 className="mt-6 text-[clamp(2rem,5vw,3.25rem)] font-sans font-normal leading-tight">
          API keys
        </h1>
        <p className="mt-4 max-w-xl font-mono text-base leading-relaxed text-white/55 [&>strong]:font-normal [&>strong]:text-white">
          Sign in to mint a key. <strong>Free during preview</strong> — no card,
          no plan, no off-ramp friction.
        </p>

        <div className="mt-10">
          <DashboardClient />
        </div>
      </div>
    </main>
  );
}
