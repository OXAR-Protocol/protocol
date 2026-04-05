const STEPS = [
  { icon: "1", label: "Deposit USDC" },
  { icon: "2", label: "Pick vault" },
  { icon: "3", label: "Get yield token" },
  { icon: "4", label: "Token grows daily" },
  { icon: "5", label: "Sell or claim" },
];

const BADGES = [
  "No KYC for small amounts",
  "Solana = fast & cheap",
  "Animated yield accrual",
];

export function Solution() {
  return (
    <section id="solution" className="px-6 py-24">
      <div className="mx-auto max-w-6xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-teal-500">
          The Solution
        </p>
        <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          USDC &rarr; Choose vault &rarr; Earn yield daily
        </h2>
        <p className="mx-auto mb-14 max-w-xl text-gray-500 dark:text-gray-400">
          Simple flow. Understand it in 10 seconds.
        </p>

        {/* Flow diagram */}
        <div className="relative mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-4">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-lg font-bold text-teal-500 dark:bg-teal-500/20">
                  {step.icon}
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="hidden text-gray-300 dark:text-gray-700 sm:block">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {BADGES.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
