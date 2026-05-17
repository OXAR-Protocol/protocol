import type { Metadata } from "next";

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
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
        OXAR Radar · Analyzer
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        What does this wallet hold in RWA?
      </h1>
      <p className="mt-3 text-[var(--color-text-muted)]">
        Paste any Ethereum address. We pull live balances, compute concentration
        and risk, and let Claude explain it in plain language.
      </p>

      <div className="mt-8">
        <AnalyzeForm initialWallet={params.wallet ?? ""} />
      </div>

      <p className="mt-12 font-mono text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">
        Not investment advice · Educational analytics · Public demo limited per IP
      </p>
    </main>
  );
}
