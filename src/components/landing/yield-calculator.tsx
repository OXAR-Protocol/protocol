"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const VAULTS = [
  { name: "ОВДП UAH Short", apy: 18, currency: "UAH" },
  { name: "ОВДП UAH Mid", apy: 16, currency: "UAH" },
  { name: "ОВДП USD", apy: 4, currency: "USD" },
  { name: "ОВДП EUR", apy: 3.5, currency: "EUR" },
  { name: "War Bonds UAH", apy: 18, currency: "UAH" },
  { name: "War Bonds USD", apy: 15, currency: "USD" },
];

const PERIODS = [
  { label: "3 months", months: 3 },
  { label: "6 months", months: 6 },
  { label: "12 months", months: 12 },
];

function formatNum(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function YieldCalculator() {
  const [amount, setAmount] = useState(5000);
  const [vaultIdx, setVaultIdx] = useState(0);
  const [periodIdx, setPeriodIdx] = useState(2);

  const vault = VAULTS[vaultIdx];
  const period = PERIODS[periodIdx];

  const results = useMemo(() => {
    const oxarYield = amount * (vault.apy / 100) * (period.months / 12);
    const ondoYield = amount * 0.04 * (period.months / 12);
    const bankYield = amount * 0.01 * (period.months / 12);
    return {
      oxar: oxarYield,
      ondo: ondoYield,
      bank: bankYield,
      total: amount + oxarYield,
      multiplier: oxarYield > 0 ? (oxarYield / Math.max(bankYield, 0.01)).toFixed(0) : "0",
    };
  }, [amount, vault.apy, period.months]);

  return (
    <div
      className="mt-0.5 p-8 md:p-10 relative overflow-hidden"
      style={{ background: "#0d0d0d", border: "1px solid #2a2a2a" }}
    >
      {/* Header */}
      <div className="font-mono text-[9px] tracking-[0.15em] text-oxar-light uppercase mb-6 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-oxar-accent animate-pulse-dot" />
        YIELD CALCULATOR
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Inputs */}
        <div className="space-y-6">
          {/* Amount */}
          <div>
            <label className="font-mono text-[9px] tracking-[0.12em] text-oxar-light uppercase block mb-3">
              Investment amount (USDC)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={100}
                max={100000}
                step={100}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="flex-1 h-0.5 bg-oxar-gray appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-oxar-accent [&::-webkit-slider-thumb]:shadow-[0_0_8px_#c8ff00]"
              />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(100, Math.min(100000, Number(e.target.value))))}
                className="w-28 bg-oxar-dark border border-oxar-gray px-3 py-2 text-oxar-white font-mono text-sm text-right focus:border-oxar-accent outline-none"
              />
            </div>
          </div>

          {/* Vault select */}
          <div>
            <label className="font-mono text-[9px] tracking-[0.12em] text-oxar-light uppercase block mb-3">
              Vault
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {VAULTS.map((v, i) => (
                <button
                  key={i}
                  onClick={() => setVaultIdx(i)}
                  className={`px-3 py-2.5 text-left transition-all duration-200 ${
                    i === vaultIdx
                      ? "bg-[rgba(200,255,0,0.08)] border-[rgba(200,255,0,0.4)]"
                      : "bg-oxar-dark border-oxar-gray hover:border-oxar-mid"
                  }`}
                  style={{ border: "1px solid" }}
                >
                  <div className="font-mono text-[8px] tracking-[0.1em] text-oxar-light uppercase">
                    {v.currency}
                  </div>
                  <div className={`font-display text-lg ${i === vaultIdx ? "text-oxar-accent" : "text-oxar-white"}`}>
                    {v.apy}%
                  </div>
                  <div className="text-[10px] text-oxar-light truncate">{v.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Period */}
          <div>
            <label className="font-mono text-[9px] tracking-[0.12em] text-oxar-light uppercase block mb-3">
              Period
            </label>
            <div className="flex gap-1">
              {PERIODS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPeriodIdx(i)}
                  className={`flex-1 py-2.5 font-mono text-[10px] tracking-[0.1em] uppercase transition-all duration-200 ${
                    i === periodIdx
                      ? "bg-oxar-accent text-oxar-black"
                      : "bg-oxar-dark text-oxar-light hover:text-oxar-white"
                  }`}
                  style={{ border: i === periodIdx ? "none" : "1px solid #2a2a2a" }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="flex flex-direction-column gap-2">
          {/* Main result */}
          <div className="p-6" style={{ border: "1px solid rgba(200,255,0,0.3)", background: "rgba(200,255,0,0.04)" }}>
            <div className="font-mono text-[9px] tracking-[0.12em] text-oxar-accent uppercase mb-2">
              Your yield with OXAR
            </div>
            <div className="font-display text-oxar-accent leading-none" style={{ fontSize: "clamp(48px, 6vw, 72px)" }}>
              ${formatNum(results.oxar)}
            </div>
            <div className="text-sm text-oxar-lighter font-light mt-2">
              Total: ${formatNum(results.total)} USDC after {period.label}
            </div>
          </div>

          {/* Comparison */}
          <div className="space-y-1">
            <div className="flex items-center justify-between p-4 bg-oxar-dark" style={{ border: "1px solid #2a2a2a" }}>
              <div>
                <div className="font-mono text-[9px] text-oxar-mid tracking-[0.1em] uppercase">Bank deposit · 1%</div>
              </div>
              <div className="font-mono text-sm text-oxar-light">${formatNum(results.bank)}</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-oxar-dark" style={{ border: "1px solid #2a2a2a" }}>
              <div>
                <div className="font-mono text-[9px] text-oxar-mid tracking-[0.1em] uppercase">Ondo · US Treasuries · 4%</div>
              </div>
              <div className="font-mono text-sm text-oxar-light">${formatNum(results.ondo)}</div>
            </div>
            <div className="flex items-center justify-between p-4" style={{ border: "1px solid rgba(200,255,0,0.3)", background: "rgba(200,255,0,0.04)" }}>
              <div>
                <div className="font-mono text-[9px] text-oxar-accent tracking-[0.1em] uppercase">OXAR · {vault.name} · {vault.apy}%</div>
              </div>
              <div className="font-display text-xl text-oxar-accent">${formatNum(results.oxar)}</div>
            </div>
          </div>

          {/* Multiplier + CTA */}
          <div className="flex items-center justify-between mt-1">
            <div className="font-mono text-[10px] text-oxar-lighter tracking-[0.1em]">
              <span className="text-oxar-accent font-display text-2xl">{results.multiplier}×</span>{" "}
              more than a bank
            </div>
            <Link
              href="/login"
              className="font-mono text-[11px] tracking-[0.1em] uppercase px-6 py-3 bg-oxar-white text-oxar-black hover:bg-oxar-accent transition-all duration-200 inline-block"
            >
              Start Earning →
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 w-5 h-5 border-r border-b border-oxar-gray" />
    </div>
  );
}
