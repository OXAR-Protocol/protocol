"use client";

import { useState } from "react";
import { Button } from "@/components/button";

const VAULT_OPTIONS = [
  { label: "UAH 18%", apy: 18, bankRate: 3 },
  { label: "USD 4%", apy: 4, bankRate: 0.5 },
  { label: "EUR 3.5%", apy: 3.5, bankRate: 0.3 },
];

export function YieldCalculator() {
  const [amount, setAmount] = useState(10000);
  const [vaultIndex, setVaultIndex] = useState(0);

  const vault = VAULT_OPTIONS[vaultIndex];
  const yearlyYield = Math.round(amount * (vault.apy / 100));
  const bankMultiplier =
    vault.bankRate > 0 ? Math.round(vault.apy / vault.bankRate) : 0;

  return (
    <div className="p-6 rounded-[5px] border border-white/10 bg-surface-0">
      <h4 className="font-mono text-xs uppercase tracking-wide text-white/30 mb-6">
        Yield Calculator
      </h4>

      {/* Amount slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-sm text-white/50">Amount</span>
          <span className="font-mono text-sm text-white">
            ${amount.toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min={100}
          max={100000}
          step={100}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
        />
        <div className="flex justify-between mt-1">
          <span className="font-mono text-[10px] text-white/20">$100</span>
          <span className="font-mono text-[10px] text-white/20">$100,000</span>
        </div>
      </div>

      {/* Vault selector */}
      <div className="mb-6">
        <span className="font-mono text-sm text-white/50 block mb-2">
          Vault
        </span>
        <div className="flex gap-2">
          {VAULT_OPTIONS.map((v, i) => (
            <button
              key={v.label}
              onClick={() => setVaultIndex(i)}
              className={`flex-1 px-3 py-2 rounded-[5px] font-mono text-xs transition-colors ${
                i === vaultIndex
                  ? "bg-white/10 text-white border border-white/20"
                  : "bg-transparent text-white/30 border border-white/10 hover:border-white/20"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      <div className="text-center py-4">
        <p className="font-mono text-sm text-white/30 mb-1">
          Your yearly yield
        </p>
        <p className="text-[clamp(1.8rem,4vw,2.5rem)] font-mono font-normal text-accent">
          ${yearlyYield.toLocaleString()}
        </p>
        {bankMultiplier > 1 && (
          <p className="mt-1 font-mono text-sm text-white/50">
            {bankMultiplier}x more than a bank
          </p>
        )}
      </div>

      <div className="mt-4">
        <Button variant="filled" href="#how-it-works">
          Start Earning
        </Button>
      </div>
    </div>
  );
}
