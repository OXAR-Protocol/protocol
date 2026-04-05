import { YieldCalculator } from "./yield-calculator";

const VAULTS = [
  { name: "OVDP UAH Short", apy: 18, currency: "UAH", type: "3-6 months", isWar: false },
  { name: "OVDP UAH Mid", apy: 17, currency: "UAH", type: "6-12 months", isWar: false },
  { name: "OVDP USD", apy: 4, currency: "USD", type: "Stable", isWar: false },
  { name: "OVDP EUR", apy: 3.5, currency: "EUR", type: "Stable", isWar: false },
  { name: "War Bonds UAH", apy: 18, currency: "UAH", type: "Impact", isWar: true },
  { name: "War Bonds USD", apy: 4, currency: "USD", type: "Impact", isWar: true },
];

export function VaultShowcase() {
  return (
    <section id="vaults" className="bg-gray-50 px-6 py-24 dark:bg-gray-950/50">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-teal-500">
          Vaults
        </p>
        <h2 className="mb-4 text-center text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Choose your yield strategy
        </h2>
        <p className="mx-auto mb-14 max-w-xl text-center text-gray-500 dark:text-gray-400">
          Six vault types backed by Ukrainian government bonds.
        </p>

        {/* Vault grid */}
        <div className="mb-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VAULTS.map((v) => (
            <div
              key={v.name}
              className={`group relative rounded-2xl border-2 bg-white p-6 transition hover:shadow-lg dark:bg-gray-900 ${
                v.isWar
                  ? "border-amber-400/60 dark:border-amber-500/40"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              {v.isWar && (
                <span className="absolute -top-3 right-4 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-gray-900">
                  IMPACT
                </span>
              )}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">{v.name}</h3>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {v.type}
                </span>
              </div>
              <div className={`text-4xl font-extrabold ${v.isWar ? "text-amber-500" : "text-teal-500"}`}>
                {v.apy}%
              </div>
              <div className="mt-1 text-sm text-gray-500">APY</div>
              <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Currency</span>
                  <span className="font-medium text-gray-900 dark:text-white">{v.currency}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Calculator */}
        <YieldCalculator />
      </div>
    </section>
  );
}
