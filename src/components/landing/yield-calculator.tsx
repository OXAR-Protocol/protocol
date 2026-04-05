"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const VAULTS = [
  { name: "UAH 18%", apy: 18 },
  { name: "USD 4%", apy: 4 },
  { name: "War Bonds", apy: 18 },
];

function formatNum(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function YieldCalculator() {
  const [amount, setAmount] = useState(1000);
  const [vaultIdx, setVaultIdx] = useState(0);

  const vault = VAULTS[vaultIdx];

  const results = useMemo(() => {
    const oxar = amount * (vault.apy / 100);
    const bank = amount * 0.01;
    return { oxar, bank, multiplier: Math.round(oxar / Math.max(bank, 1)) };
  }, [amount, vault.apy]);

  return (
    <div
      className="mt-0.5 p-8 md:p-10 relative"
      style={{ background: "#0d0d0d", border: "1px solid #2a2a2a" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-8 items-center">
        {/* Left: Input */}
        <div>
          <div className="font-mono text-[9px] tracking-[0.12em] text-oxar-light uppercase mb-4">
            How much would you invest?
          </div>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="font-display text-oxar-white" style={{ fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1 }}>
              $
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(100, Math.min(100000, Number(e.target.value))))}
              className="bg-transparent font-display text-oxar-white outline-none w-full"
              style={{ fontSize: "clamp(48px, 6vw, 80px)", lineHeight: 1 }}
            />
          </div>
          <input
            type="range"
            min={100}
            max={100000}
            step={100}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-px bg-oxar-gray appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-oxar-accent [&::-webkit-slider-thumb]:shadow-[0_0_8px_#c8ff00] mb-6"
          />
          <div className="flex gap-1">
            {VAULTS.map((v, i) => (
              <button
                key={i}
                onClick={() => setVaultIdx(i)}
                className={`flex-1 py-2 font-mono text-[10px] tracking-[0.1em] uppercase transition-all duration-200 ${
                  i === vaultIdx
                    ? "bg-oxar-accent text-oxar-black"
                    : "text-oxar-light hover:text-oxar-white"
                }`}
                style={{ border: i === vaultIdx ? "none" : "1px solid #2a2a2a" }}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Result */}
        <div className="text-right">
          <div className="font-mono text-[9px] tracking-[0.12em] text-oxar-accent uppercase mb-2">
            Your yearly yield
          </div>
          <div className="font-display text-oxar-accent leading-none mb-4" style={{ fontSize: "clamp(56px, 8vw, 96px)" }}>
            ${formatNum(results.oxar)}
          </div>
          <div className="font-mono text-[10px] text-oxar-lighter tracking-[0.1em] mb-6">
            <span className="text-oxar-accent">{results.multiplier}×</span> more than a bank deposit
          </div>
          <Link
            href="/login"
            className="font-mono text-[11px] tracking-[0.1em] uppercase px-8 py-3 bg-oxar-white text-oxar-black hover:bg-oxar-accent transition-all duration-200 inline-block"
          >
            Start Earning →
          </Link>
        </div>
      </div>
    </div>
  );
}
