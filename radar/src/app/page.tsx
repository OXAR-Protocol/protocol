import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
        OXAR Radar
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight">
        RWA intelligence layer for crypto.
      </h1>
      <p className="mt-6 text-lg text-[var(--color-text-muted)]">
        Risk monitoring, wallet analysis, and AI-powered portfolio insights
        across every major Real World Assets protocol on Ethereum and Solana.
      </p>
      <div className="mt-10 flex gap-4">
        <Link
          href="/analyze"
          className="rounded-lg bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-black hover:opacity-90"
        >
          Try the analyzer
        </Link>
        <Link
          href="/docs"
          className="rounded-lg border border-white/10 px-5 py-3 text-sm font-medium hover:bg-white/5"
        >
          Read API docs
        </Link>
      </div>
      <p className="mt-16 font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
        Phase 1 — Day 1 scaffold · 2026-05-15
      </p>
    </main>
  );
}
