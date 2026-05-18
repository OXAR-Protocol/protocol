import type { Metadata } from "next";

import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard — OXAR Radar",
  description: "Manage your OXAR Radar API keys and view usage.",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
        OXAR Radar · Dashboard
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">API keys</h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        Sign in to mint a key. Free during preview — no card, no plan.
      </p>

      <div className="mt-8">
        <DashboardClient />
      </div>
    </main>
  );
}
