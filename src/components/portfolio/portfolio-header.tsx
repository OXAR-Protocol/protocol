"use client";

import { useState, useEffect } from "react";
import { BN } from "@coral-xyz/anchor";

import { AnimatedNumber } from "@/components/animated-number";
import { PortfolioPosition } from "@/hooks/use-portfolio";
import { bnToDecimal } from "@/lib/format";

interface PortfolioHeaderProps {
  totalValue: BN;
  positions: PortfolioPosition[];
}

function computeDailyYield(positions: PortfolioPosition[]): number {
  let total = 0;
  for (const pos of positions) {
    const balance = bnToDecimal(pos.balance, 6);
    const nav = bnToDecimal(pos.vault.account.navPerShare, 6);
    const value = balance * nav;
    // apyBps is bounded (<10000), safe to toNumber()
    const apyBps = pos.vault.account.apyBps.toNumber();
    total += (value * apyBps) / 10_000 / 365;
  }
  return total;
}

export function PortfolioHeader({ totalValue, positions }: PortfolioHeaderProps) {
  const dailyYield = computeDailyYield(positions);
  const [accumulated, setAccumulated] = useState(0);

  useEffect(() => {
    setAccumulated(0);
    const increment = dailyYield / 86400;
    const interval = setInterval(() => {
      setAccumulated((prev) => prev + increment);
    }, 1000);
    return () => clearInterval(interval);
  }, [dailyYield]);

  return (
    <div className="rounded-[5px] border border-white/10 bg-surface-0 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
          Total Portfolio Value
        </span>
        <span className="font-mono text-[10px] text-white/20 uppercase">
          {positions.length} {positions.length === 1 ? "position" : "positions"}
        </span>
      </div>

      <AnimatedNumber
        value={bnToDecimal(totalValue, 6)}
        prefix="$"
        decimals={2}
        className="text-[2.5rem] font-mono font-light text-white leading-none"
      />

      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
          Earning today
        </span>
        <AnimatedNumber
          value={accumulated}
          prefix="+$"
          decimals={4}
          className="text-profit font-mono text-sm font-light"
          springOptions={{ stiffness: 300, damping: 40 }}
        />
      </div>
    </div>
  );
}
