"use client";

import { useState, useMemo } from "react";

const VAULT_OPTIONS = [
  { label: "OVDP UAH Short (18%)", apy: 18 },
  { label: "OVDP UAH Mid (17%)", apy: 17 },
  { label: "OVDP USD (4%)", apy: 4 },
  { label: "OVDP EUR (3.5%)", apy: 3.5 },
  { label: "War Bonds UAH (18%)", apy: 18 },
  { label: "War Bonds USD (4%)", apy: 4 },
];

const PERIODS = [
  { label: "3 months", months: 3 },
  { label: "6 months", months: 6 },
  { label: "12 months", months: 12 },
];

const BANK_RATE = 1;
const ONDO_RATE = 4;

function calcYield(amount: number, apy: number, months: number) {
  return amount * (apy / 100) * (months / 12);
}

function formatUsd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function YieldCalculator() {
  const [amount, setAmount] = useState(10000);
  const [vaultIdx, setVaultIdx] = useState(0);
  const [periodIdx, setPeriodIdx] = useState(1);

  const vault = VAULT_OPTIONS[vaultIdx];
  const period = PERIODS[periodIdx];

  const results = useMemo(() => {
    const oxar = calcYield(amount, vault.apy, period.months);
    const bank = calcYield(amount, BANK_RATE, period.months);
    const ondo = calcYield(amount, ONDO_RATE, period.months);
    return { oxar, bank, ondo, total: amount + oxar };
  }, [amount, vault.apy, period.months]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
        Yield Calculator
      </h3>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount (USDC)
            </label>
            <input
              type="range"
              min={100}
              max={100000}
              step={100}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mb-2 w-full accent-teal-500"
            />
            <input
              type="number"
              min={100}
              max={100000}
              value={amount}
              onChange={(e) => setAmount(Math.max(100, Math.min(100000, Number(e.target.value))))}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Vault
            </label>
            <select
              value={vaultIdx}
              onChange={(e) => setVaultIdx(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            >
              {VAULT_OPTIONS.map((v, i) => (
                <option key={v.label} value={i}>{v.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Period
            </label>
            <div className="flex gap-2">
              {PERIODS.map((p, i) => (
                <button
                  key={p.months}
                  onClick={() => setPeriodIdx(i)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    periodIdx === i
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col justify-center space-y-4">
          <div className="rounded-xl bg-teal-500/10 p-5 text-center dark:bg-teal-500/20">
            <div className="text-sm font-medium text-teal-600 dark:text-teal-400">Your yield</div>
            <div className="text-3xl font-extrabold text-teal-500 transition-all">
              {formatUsd(results.oxar)}
            </div>
          </div>
          <div className="rounded-xl bg-gray-100 p-5 text-center dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-500">Total return</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatUsd(results.total)}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
              <div className="text-xs text-gray-500">Bank (1%)</div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {formatUsd(results.bank)}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
              <div className="text-xs text-gray-500">Ondo (4%)</div>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {formatUsd(results.ondo)}
              </div>
            </div>
            <div className="rounded-lg bg-teal-50 p-3 dark:bg-teal-500/10">
              <div className="text-xs text-teal-600 dark:text-teal-400">OXAR</div>
              <div className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                {formatUsd(results.oxar)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
