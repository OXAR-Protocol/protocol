"use client";

import Link from "next/link";

export function EmptyPortfolio() {
  return (
    <div className="rounded-[5px] border border-dashed border-white/10 bg-surface-0 p-10 flex flex-col items-center text-center">
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 mb-4">
        [ Empty ]
      </span>
      <p className="font-sans text-xl text-white">No investments yet</p>
      <p className="font-mono text-xs text-white/30 mt-3 max-w-xs leading-relaxed">
        If you invested $1,000 in UA-UAH-SHORT 30 days ago, you&apos;d have +$14.79 today
      </p>
      <Link
        href="/vaults"
        className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-[5px] font-mono text-xs uppercase tracking-[0.15em] bg-white text-black hover:bg-white/90 transition-colors"
      >
        Start Earning
      </Link>
    </div>
  );
}
