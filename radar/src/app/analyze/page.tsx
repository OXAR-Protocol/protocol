import type { Metadata } from "next";

import { SectionLabel } from "@/components/section-label";

import { AnalyzeForm } from "./analyze-form";

export const metadata: Metadata = {
  title: "Analyze any wallet's RWA exposure — OXAR Radar",
  description:
    "Paste an Ethereum or Solana address. Get a breakdown of Real World Assets positions, risk score, and a plain-language summary from Claude.",
};

interface AnalyzePageProps {
  searchParams: Promise<{ wallet?: string }>;
}

export default async function AnalyzePage({ searchParams }: AnalyzePageProps) {
  const params = await searchParams;
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
        <SectionLabel>Analyzer</SectionLabel>
        <h1 className="mt-6 text-[clamp(2rem,5vw,3.25rem)] font-sans font-normal leading-tight">
          What does this wallet hold
          <br />
          <span className="text-white/50">in RWA?</span>
        </h1>
        <p className="mt-6 max-w-xl font-mono text-base leading-relaxed text-white/55 [&>strong]:font-normal [&>strong]:text-white">
          Paste any Ethereum or Solana address. We pull live balances, compute
          concentration and risk, and let Claude{" "}
          <strong>explain it in plain language.</strong>
        </p>

        <div className="mt-10">
          <AnalyzeForm initialWallet={params.wallet ?? ""} />
        </div>

        <p className="mt-16 font-mono text-[11px] uppercase tracking-[0.15em] text-white/30">
          Not investment advice · Educational analytics · Public demo limited per IP
        </p>
      </div>
    </main>
  );
}
