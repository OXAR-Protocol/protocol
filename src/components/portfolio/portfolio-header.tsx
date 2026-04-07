"use client";

import { useState, useEffect } from "react";
import { BN } from "@coral-xyz/anchor";

import { AnimatedNumber } from "@/components/animated-number";
import { PortfolioPosition } from "@/hooks/use-portfolio";

interface PortfolioHeaderProps {
  totalValue: BN;
  positions: PortfolioPosition[];
}

function computeDailyYield(positions: PortfolioPosition[]): number {
  let total = 0;
  for (const pos of positions) {
    const balance = pos.balance.toNumber() / 1_000_000;
    const nav = pos.vault.account.navPerShare.toNumber() / 1_000_000;
    const value = balance * nav;
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
    <div className="flex flex-col items-center gap-1 py-4">
      <AnimatedNumber
        value={totalValue.toNumber() / 1_000_000}
        prefix="$"
        decimals={2}
        className="text-4xl font-mono font-bold text-white text-center"
      />
      <p className="text-white/30 font-mono text-xs uppercase text-center">
        Total Portfolio Value
      </p>

      <div className="mt-3 flex flex-col items-center">
        <AnimatedNumber
          value={accumulated}
          prefix="+$"
          decimals={4}
          className="text-profit font-mono text-lg font-bold text-center"
          springOptions={{ stiffness: 300, damping: 40 }}
        />
        <p className="text-white/30 font-mono text-xs text-center">
          earning today
        </p>
      </div>
    </div>
  );
}
