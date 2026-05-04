"use client";

import type { VaultConfig } from "@oxar/sdk";

import { getBondColor } from "@/lib/bond-constants";

interface BondPopularProps {
  bonds: readonly VaultConfig[];
  onSelect: (id: string) => void;
}

export function BondPopular({ bonds, onSelect }: BondPopularProps) {
  return (
    <div className="px-5 pt-4 pb-2">
      <span className="font-mono text-[10px] uppercase tracking-wide text-white/25 block mb-2">
        Popular
      </span>
      <div className="flex flex-wrap gap-2">
        {bonds.map((c) => {
          const { color, rgb } = getBondColor(c.denomination);
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/25 transition-colors"
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono text-[11px] text-white">
                ox{c.denomination}
              </span>
              <span className="font-mono text-[10px]" style={{ color }}>
                {c.apy.toFixed(1)}%
              </span>
              {c.isWar && (
                <span
                  className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded"
                  style={{ color, background: `rgba(${rgb},0.1)` }}
                >
                  WAR
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
