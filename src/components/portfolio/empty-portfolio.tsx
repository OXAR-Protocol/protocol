"use client";

import Link from "next/link";

export function EmptyPortfolio() {
  return (
    <div className="flex flex-col items-center py-16 px-4">
      <p className="text-white/60 font-mono text-lg text-center">
        No investments yet
      </p>
      <p className="text-white/30 font-mono text-sm text-center mt-2 max-w-xs">
        If you invested $1,000 in UA-UAH-SHORT 30 days ago, you&apos;d have +$14.79
      </p>
      <div className="flex justify-center mt-6">
        <Link
          href="/vaults"
          className="bg-accent text-white px-6 py-3 rounded-xl font-mono text-sm uppercase tracking-wide transition-opacity hover:opacity-90"
        >
          Start Earning
        </Link>
      </div>
    </div>
  );
}
