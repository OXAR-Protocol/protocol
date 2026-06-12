"use client";

import { ApyTicker } from "./apy-ticker";

type Tier = "live" | "building" | "roadmap";

const ASSETS: { name: string; note: string; tier: Tier }[] = [
  { name: "USDC Yield", note: "Solana · Jupiter Lend", tier: "live" },
  { name: "US Treasuries", note: "Ondo USDY", tier: "building" },
  { name: "Private credit", note: "syrupUSDC", tier: "building" },
  { name: "Precious metals", note: "Tokenized gold", tier: "roadmap" },
  { name: "Real estate", note: "Tokenized property", tier: "roadmap" },
  { name: "Farmland", note: "Emerging markets", tier: "roadmap" },
];

const TIER_LABEL: Record<Tier, string> = {
  live: "LIVE",
  building: "In development",
  roadmap: "On our roadmap",
};

// Honesty rule: a number and a pulsing dot exist ONLY on the live asset.
export function AssetCards() {
  return (
    <ul className="flex flex-col gap-3 w-full max-w-sm">
      {ASSETS.map((a) => (
        <li
          key={a.name}
          className={`group border rounded-sm px-4 py-3 backdrop-blur-[2px] transition-colors duration-300 ${
            a.tier === "live"
              ? "border-amber-400/40 bg-amber-400/[0.04] hover:border-amber-400/80"
              : "border-white/10 bg-white/[0.02] hover:border-white/25"
          }`}
        >
          <div className="flex items-baseline justify-between gap-4">
            <span
              className={`font-serif text-lg leading-tight ${
                a.tier === "live" ? "text-white" : "text-white/55"
              }`}
            >
              {a.name}
            </span>
            {a.tier === "live" ? (
              <span className="flex items-center gap-2 shrink-0">
                <ApyTicker className="text-sm" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </span>
            ) : (
              <span className="font-mono text-[11px] uppercase tracking-widest text-white/30 shrink-0">
                {TIER_LABEL[a.tier]}
              </span>
            )}
          </div>
          <div className="mt-1 font-mono text-[11px] tracking-wide text-white/30">
            {a.note}
            {a.tier === "live" && (
              <span className="ml-2 text-amber-400/70 uppercase tracking-widest">
                · {TIER_LABEL.live}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
